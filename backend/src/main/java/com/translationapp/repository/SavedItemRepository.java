package com.translationapp.repository;

import com.translationapp.model.Folder;
import com.translationapp.model.SavedItem;
import com.translationapp.model.SavedItemCategory;
import com.translationapp.model.User;
import com.translationapp.model.Translation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedItemRepository extends JpaRepository<SavedItem, UUID> {

    // Find by user, category, and folder (folder can be null for items not in any folder)
    Page<SavedItem> findByUserAndCategoryAndFolderOrderByCreatedAtDesc(User user, SavedItemCategory category, Folder folder, Pageable pageable);

    // Find by user and category (for items not in any specific folder, or across all folders if folder is not a query param)
    Page<SavedItem> findByUserAndCategoryOrderByCreatedAtDesc(User user, SavedItemCategory category, Pageable pageable);
    
    // Find by user and folder (all categories within a folder)
    Page<SavedItem> findByUserAndFolderOrderByCreatedAtDesc(User user, Folder folder, Pageable pageable);

    // Find all for a user (across all categories and folders, for a general "all saved" view if needed)
    Page<SavedItem> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // Check if a specific translation is already saved by a user
    Optional<SavedItem> findByUserAndTranslation(User user, Translation translation);
    
    // Count items in a folder (used in FolderService before deleting a folder)
    long countByFolder(Folder folder);
} 