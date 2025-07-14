package com.translationapp.service;

import com.translationapp.dto.SavedItemCreateRequest;
import com.translationapp.dto.SavedItemUpdateRequest;
import com.translationapp.model.*;
import com.translationapp.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.Optional;
import java.util.UUID;

@Service
public class SavedItemService {

    private final SavedItemRepository savedItemRepository;
    private final UserRepository userRepository;
    private final TranslationRepository translationRepository;
    private final FolderRepository folderRepository;
    private final TranslationPersistenceService translationPersistenceService; // For marking underlying translation as favorite

    public SavedItemService(SavedItemRepository savedItemRepository,
                            UserRepository userRepository,
                            TranslationRepository translationRepository,
                            FolderRepository folderRepository,
                            TranslationPersistenceService translationPersistenceService) {
        this.savedItemRepository = savedItemRepository;
        this.userRepository = userRepository;
        this.translationRepository = translationRepository;
        this.folderRepository = folderRepository;
        this.translationPersistenceService = translationPersistenceService;
    }

    @Transactional
    public SavedItem createSavedItem(UUID userId, SavedItemCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Translation translation = translationRepository.findById(request.getTranslationId())
                .orElseThrow(() -> new EntityNotFoundException("Translation not found: " + request.getTranslationId()));

        // Check if this translation already saved by this user
        Optional<SavedItem> existingSavedItem = savedItemRepository.findByUserAndTranslation(user, translation);
        if (existingSavedItem.isPresent()) {
            throw new IllegalArgumentException("This translation is already saved.");
        }

        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new EntityNotFoundException("Folder not found: " + request.getFolderId()));
            if (!folder.getUser().getId().equals(userId)) {
                throw new SecurityException("User not authorized to save item to this folder.");
            }
        }

        String name = request.getName();
        if (name == null || name.trim().isEmpty()) {
            // Default name from translation, truncated if too long
            name = translation.getSourceText().length() > 50 ? translation.getSourceText().substring(0, 47) + "..." : translation.getSourceText();
        }

        SavedItem savedItem = new SavedItem(user, translation, request.getCategory(), folder, name, request.getNotes());
        
        // Also ensure the underlying translation is marked as a favorite
        if (!translation.isFavorite()) {
            translationPersistenceService.toggleFavorite(userId, translation.getId());
        }
        
        return savedItemRepository.save(savedItem);
    }

    @Transactional(readOnly = true)
    public Page<SavedItem> getSavedItems(UUID userId, SavedItemCategory category, UUID folderId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        if (folderId != null) {
            Folder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new EntityNotFoundException("Folder not found: " + folderId));
            if (!folder.getUser().getId().equals(userId)) {
                throw new SecurityException("User not authorized to access this folder.");
            }
            if (category != null) {
                return savedItemRepository.findByUserAndCategoryAndFolderOrderByCreatedAtDesc(user, category, folder, pageable);
            } else {
                return savedItemRepository.findByUserAndFolderOrderByCreatedAtDesc(user, folder, pageable);
            }
        } else {
            if (category != null) {
                return savedItemRepository.findByUserAndCategoryOrderByCreatedAtDesc(user, category, pageable);
            } else {
                return savedItemRepository.findByUserOrderByCreatedAtDesc(user, pageable);
            }
        }
    }
    
    @Transactional(readOnly = true)
    public Optional<SavedItem> getSavedItemById(UUID userId, UUID savedItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Optional<SavedItem> savedItem = savedItemRepository.findById(savedItemId);
        if (savedItem.isPresent() && !savedItem.get().getUser().getId().equals(userId)){
             throw new SecurityException("User not authorized to access this saved item.");
        }
        return savedItem;
    }

    @Transactional
    public SavedItem updateSavedItem(UUID userId, UUID savedItemId, SavedItemUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        SavedItem savedItem = savedItemRepository.findById(savedItemId)
                .orElseThrow(() -> new EntityNotFoundException("Saved item not found: " + savedItemId));

        if (!savedItem.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to update this saved item.");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            savedItem.setName(request.getName());
        }
        if (request.getNotes() != null) {
            savedItem.setNotes(request.getNotes());
        }

        if (request.isSetFolderIdNull()) {
            savedItem.setFolder(null);
        } else if (request.getFolderId() != null) {
            Folder newFolder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new EntityNotFoundException("Folder not found: " + request.getFolderId()));
            if (!newFolder.getUser().getId().equals(userId)) {
                throw new SecurityException("User not authorized to move item to this folder.");
            }
            savedItem.setFolder(newFolder);
        }
        // Category and underlying Translation are not updatable here

        return savedItemRepository.save(savedItem);
    }

    @Transactional
    public void deleteSavedItem(UUID userId, UUID savedItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        SavedItem savedItem = savedItemRepository.findById(savedItemId)
                .orElseThrow(() -> new EntityNotFoundException("Saved item not found: " + savedItemId));

        if (!savedItem.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to delete this saved item.");
        }
        
        // Deleting a saved item does not delete the underlying translation or un-favorite it.
        // It just removes this specific bookmark/categorization.
        savedItemRepository.delete(savedItem);
    }
} 