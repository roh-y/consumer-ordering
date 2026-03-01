package com.consumerordering.userservice.service;

import com.consumerordering.userservice.model.User;
import com.consumerordering.userservice.model.dto.*;
import com.consumerordering.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Orchestrates user-related business logic:
 * - Registration: Cognito sign-up + DynamoDB profile creation
 * - Login: Cognito authentication
 * - Profile: DynamoDB read/update
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final CognitoAuthService cognitoAuthService;
    private final UserRepository userRepository;

    /**
     * Register a new user: create in Cognito, then store profile in DynamoDB.
     * The Cognito sub (UUID) becomes the userId in DynamoDB.
     */
    public ProfileResponse register(RegisterRequest request) {
        // Create user in Cognito — returns the unique sub (UUID)
        String userId = cognitoAuthService.signUp(
                request.getEmail(),
                request.getPassword(),
                request.getFirstName(),
                request.getLastName()
        );

        // Store profile in DynamoDB
        Instant now = Instant.now();
        User user = User.builder()
                .userId(userId)
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .createdAt(now)
                .updatedAt(now)
                .build();

        userRepository.save(user);

        return toProfileResponse(user);
    }

    /** Confirm the user's email with the verification code. */
    public void confirm(ConfirmRequest request) {
        cognitoAuthService.confirmSignUp(request.getEmail(), request.getConfirmationCode());
    }

    /** Authenticate user via Cognito, returning JWT tokens. */
    public LoginResponse login(LoginRequest request) {
        return cognitoAuthService.initiateAuth(request.getEmail(), request.getPassword());
    }

    /** Refresh access token using a refresh token. */
    public LoginResponse refresh(RefreshRequest request) {
        return cognitoAuthService.refreshTokens(request.getRefreshToken());
    }

    /** Get user profile from DynamoDB by userId (from JWT sub claim). */
    public ProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return toProfileResponse(user);
    }

    /** Update user profile fields in DynamoDB. */
    public ProfileResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        user.setUpdatedAt(Instant.now());

        userRepository.update(user);
        return toProfileResponse(user);
    }

    private ProfileResponse toProfileResponse(User user) {
        return ProfileResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .planId(user.getPlanId())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
