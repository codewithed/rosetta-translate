package com.translationapp.controller;

import com.translationapp.dto.ApiResponse;
import com.translationapp.dto.FolderCreateRequest;
import com.translationapp.dto.FolderResponseDto;
import com.translationapp.model.Folder;
import com.translationapp.security.UserPrincipal;
import com.translationapp.service.FolderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @PostMapping
    public ResponseEntity<?> createFolder(@AuthenticationPrincipal UserPrincipal currentUser,
                                          @Valid @RequestBody FolderCreateRequest request) {
        try {
            Folder folder = folderService.createFolder(currentUser.getId(), request.getName(), request.getParentFolderId());
            return new ResponseEntity<>(FolderResponseDto.fromEntity(folder), HttpStatus.CREATED);
        } catch (IllegalArgumentException | SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error creating folder: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<List<FolderResponseDto>> getFolders(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) UUID parentFolderId) { // If null, get root folders
        List<Folder> folders;
        if (parentFolderId == null) {
            folders = folderService.getRootFolders(currentUser.getId());
        } else {
            folders = folderService.getSubFolders(currentUser.getId(), parentFolderId);
        }
        List<FolderResponseDto> dtos = folders.stream().map(FolderResponseDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{folderId}")
    public ResponseEntity<?> updateFolder(@AuthenticationPrincipal UserPrincipal currentUser,
                                          @PathVariable UUID folderId,
                                          @Valid @RequestBody FolderCreateRequest request) { // Reusing for name update
        try {
            Folder updatedFolder = folderService.updateFolderName(currentUser.getId(), folderId, request.getName());
            return ResponseEntity.ok(FolderResponseDto.fromEntity(updatedFolder));
        } catch (IllegalArgumentException | SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error updating folder: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<ApiResponse> deleteFolder(@AuthenticationPrincipal UserPrincipal currentUser,
                                                  @PathVariable UUID folderId) {
        try {
            folderService.deleteFolder(currentUser.getId(), folderId);
            return ResponseEntity.ok(new ApiResponse(true, "Folder deleted successfully."));
        } catch (IllegalStateException | SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error deleting folder: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 