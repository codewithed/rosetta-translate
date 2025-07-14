package com.translationapp.controller;

import com.translationapp.dto.ApiResponse;
import com.translationapp.dto.UserProfileResponseDto;
import com.translationapp.dto.UserProfileUpdateRequestDto;
import com.translationapp.model.User;
import com.translationapp.security.UserPrincipal;
import com.translationapp.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        try {
            User user = userService.getUserById(currentUser.getId());
            return ResponseEntity.ok(UserProfileResponseDto.fromEntity(user));
        } catch (Exception e) {
            // Catching a broader exception for safety, though getUserById throws UsernameNotFoundException
            return new ResponseEntity<>(new ApiResponse(false, "Error retrieving user profile: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateUserProfile(@AuthenticationPrincipal UserPrincipal currentUser,
                                               @Valid @RequestBody UserProfileUpdateRequestDto request) {
        try {
            User updatedUser = userService.updateUserProfile(currentUser.getId(), request);
            return ResponseEntity.ok(UserProfileResponseDto.fromEntity(updatedUser));
        } catch (IllegalArgumentException e) { // For potential issues from DTO validation or simple invalid inputs
            return new ResponseEntity<>(new ApiResponse(false, e.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(new ApiResponse(false, "Error updating user profile: " + e.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 