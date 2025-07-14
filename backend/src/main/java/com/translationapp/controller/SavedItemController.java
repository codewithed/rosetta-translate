package com.translationapp.controller;

import com.translationapp.dto.*;
import com.translationapp.model.SavedItem;
import com.translationapp.model.SavedItemCategory;
import com.translationapp.security.UserPrincipal;
import com.translationapp.service.SavedItemService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/saved-items")
public class SavedItemController {

    private final SavedItemService savedItemService;

    public SavedItemController(SavedItemService savedItemService) {
        this.savedItemService = savedItemService;
    }

    @PostMapping
    public ResponseEntity<?> createSavedItem(@AuthenticationPrincipal UserPrincipal currentUser,
                                             @Valid @RequestBody SavedItemCreateRequest request) {
        try {
            SavedItem savedItem = savedItemService.createSavedItem(currentUser.getId(), request);
            return new ResponseEntity<>(SavedItemResponseDto.fromEntity(savedItem), HttpStatus.CREATED);
        } catch (IllegalArgumentException | SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (EntityNotFoundException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error saving item: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping
    public ResponseEntity<Page<SavedItemResponseDto>> getSavedItems(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) SavedItemCategory category,
            @RequestParam(required = false) UUID folderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<SavedItem> savedItemsPage = savedItemService.getSavedItems(currentUser.getId(), category, folderId, pageable);
        Page<SavedItemResponseDto> dtoPage = savedItemsPage.map(SavedItemResponseDto::fromEntity);
        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/{savedItemId}")
    public ResponseEntity<?> getSavedItemById(@AuthenticationPrincipal UserPrincipal currentUser, @PathVariable UUID savedItemId) {
        Optional<SavedItem> savedItem = savedItemService.getSavedItemById(currentUser.getId(), savedItemId);
        if (savedItem.isPresent()) {
            return ResponseEntity.ok(SavedItemResponseDto.fromEntity(savedItem.get()));
        }
        return new ResponseEntity<>(new ApiResponse(false, "Saved item not found."), HttpStatus.NOT_FOUND);
    }
    

    @PutMapping("/{savedItemId}")
    public ResponseEntity<?> updateSavedItem(@AuthenticationPrincipal UserPrincipal currentUser,
                                           @PathVariable UUID savedItemId,
                                           @Valid @RequestBody SavedItemUpdateRequest request) {
        try {
            SavedItem updatedItem = savedItemService.updateSavedItem(currentUser.getId(), savedItemId, request);
            return ResponseEntity.ok(SavedItemResponseDto.fromEntity(updatedItem));
        } catch (IllegalArgumentException | SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (EntityNotFoundException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error updating saved item: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{savedItemId}")
    public ResponseEntity<ApiResponse> deleteSavedItem(@AuthenticationPrincipal UserPrincipal currentUser,
                                                     @PathVariable UUID savedItemId) {
        try {
            savedItemService.deleteSavedItem(currentUser.getId(), savedItemId);
            return ResponseEntity.ok(new ApiResponse(true, "Saved item deleted successfully."));
        } catch (EntityNotFoundException e) {
             return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.NOT_FOUND);
        } catch (SecurityException e) {
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.FORBIDDEN);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error deleting saved item: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 