package com.translationapp.service;

import com.translationapp.model.Folder;
import com.translationapp.model.User;
import com.translationapp.repository.FolderRepository;
import com.translationapp.repository.SavedItemRepository;
import com.translationapp.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class FolderService {

    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final SavedItemRepository savedItemRepository;

    public FolderService(FolderRepository folderRepository, UserRepository userRepository, SavedItemRepository savedItemRepository) {
        this.folderRepository = folderRepository;
        this.userRepository = userRepository;
        this.savedItemRepository = savedItemRepository;
    }

    @Transactional
    public Folder createFolder(UUID userId, String name, UUID parentFolderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        Folder parent = null;
        if (parentFolderId != null) {
            parent = folderRepository.findById(parentFolderId)
                    .orElseThrow(() -> new EntityNotFoundException("Parent folder not found: " + parentFolderId));
            // Check if parent folder belongs to the same user
            if (!parent.getUser().getId().equals(userId)) {
                throw new SecurityException("User not authorized to create subfolder in this parent folder.");
            }
        }

        // Check for duplicate folder name within the same parent (or at root)
        Optional<Folder> existingFolder;
        if (parent != null) {
            existingFolder = folderRepository.findByUserAndParentFolderAndName(user, parent, name);
        } else {
            existingFolder = folderRepository.findByUserAndParentFolderIsNullAndName(user, name);
        }
        if (existingFolder.isPresent()) {
            throw new IllegalArgumentException("A folder with this name already exists in this location.");
        }

        Folder folder = new Folder(user, name, parent);
        return folderRepository.save(folder);
    }

    @Transactional(readOnly = true)
    public List<Folder> getRootFolders(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        return folderRepository.findByUserAndParentFolderIsNullOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public List<Folder> getSubFolders(UUID userId, UUID parentFolderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Folder parent = folderRepository.findById(parentFolderId)
                .orElseThrow(() -> new EntityNotFoundException("Parent folder not found: " + parentFolderId));
        if (!parent.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to access this folder.");
        }
        return folderRepository.findByUserAndParentFolderOrderByCreatedAtDesc(user, parent);
    }

    @Transactional
    public Folder updateFolderName(UUID userId, UUID folderId, String newName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new EntityNotFoundException("Folder not found: " + folderId));
        if (!folder.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to update this folder.");
        }

        // Check for duplicate folder name within the same parent (or at root)
        Optional<Folder> existingFolder;
        if (folder.getParentFolder() != null) {
            existingFolder = folderRepository.findByUserAndParentFolderAndName(user, folder.getParentFolder(), newName);
        } else {
            existingFolder = folderRepository.findByUserAndParentFolderIsNullAndName(user, newName);
        }
        // Allow if it's the same folder, or no duplicate found
        if (existingFolder.isPresent() && !existingFolder.get().getId().equals(folderId)) {
            throw new IllegalArgumentException("A folder with this name already exists in this location.");
        }

        folder.setName(newName);
        return folderRepository.save(folder);
    }

    @Transactional
    public void deleteFolder(UUID userId, UUID folderId) {
        // Note: This is a simple delete. For a real app, decide on handling of subfolders and items within:
        // 1. Disallow deleting non-empty folders.
        // 2. Cascade delete subfolders and items (could be dangerous or complex).
        // 3. Move subfolders/items to parent or root.
        // For now, assume simple delete if folder is empty or it's a leaf. Add checks as needed.

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new EntityNotFoundException("Folder not found: " + folderId));
        if (!folder.getUser().getId().equals(userId)) {
            throw new SecurityException("User not authorized to delete this folder.");
        }
        
        // Basic check: prevent deleting if it has subfolders.
        List<Folder> subFolders = folderRepository.findByUserAndParentFolderOrderByCreatedAtDesc(user, folder);
        if (!subFolders.isEmpty()) {
            throw new IllegalStateException("Cannot delete folder with subfolders. Delete or move subfolders first.");
        }
        
        // Check for saved items within this folder before deleting.
        long itemsInFolder = savedItemRepository.countByFolder(folder);
        if (itemsInFolder > 0) {
            throw new IllegalStateException("Cannot delete folder that contains saved items. Move or delete items first.");
        }

        folderRepository.delete(folder);
    }
    
    // TODO: Implement moveFolder method if needed.
} 