package com.translationapp.service;

import com.translationapp.dto.UserProfileUpdateRequestDto;
import com.translationapp.model.User;
import com.translationapp.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException; // For consistency with other services
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));
    }

    @Transactional
    public User updateUserProfile(UUID userId, UserProfileUpdateRequestDto request) {
        User user = getUserById(userId);

        if (request.getPreferences() != null) {
            user.setPreferredSourceLang(request.getPreferences().getPreferredSourceLang());
            user.setPreferredTargetLang(request.getPreferences().getPreferredTargetLang());
        }

        if (request.getSettings() != null) {
            // Basic validation for settings could be added here if it's expected to be JSON
            // For now, we trust the client sends a valid string or handles parsing errors.
            user.setSettings(request.getSettings());
        }
        
        return userRepository.save(user);
    }

    // Method to specifically update last login time, could be called by AuthService upon successful login
    @Transactional
    public void updateUserLastLogin(UUID userId) {
        User user = getUserById(userId);
        // user.setLastLogin(java.time.LocalDateTime.now()); // This is already handled in AuthController
        // No, AuthController updates lastLogin and saves. This is fine.
        // However, if we want a dedicated service method, it could be here.
        // For now, AuthController logic is sufficient.
    }
} 