package com.translationapp.repository;

import com.translationapp.model.Folder;
import com.translationapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FolderRepository extends JpaRepository<Folder, UUID> {

    // Find root folders for a user (folders with no parent)
    List<Folder> findByUserAndParentFolderIsNullOrderByCreatedAtDesc(User user);

    // Find subfolders for a given parent folder for a user
    List<Folder> findByUserAndParentFolderOrderByCreatedAtDesc(User user, Folder parentFolder);

    // Find by name within a specific parent folder for a user (for duplicate checks)
    Optional<Folder> findByUserAndParentFolderAndName(User user, Folder parentFolder, String name);

    // Find by name for root folders for a user (for duplicate checks)
    Optional<Folder> findByUserAndParentFolderIsNullAndName(User user, String name);
} 