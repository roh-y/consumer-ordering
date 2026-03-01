package com.consumerordering.userservice.controller;

import com.consumerordering.userservice.model.dto.*;
import com.consumerordering.userservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Register a new user — creates Cognito account + DynamoDB profile. */
    @PostMapping("/register")
    public ResponseEntity<ProfileResponse> register(@Valid @RequestBody RegisterRequest request) {
        ProfileResponse profile = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(profile);
    }

    /** Confirm email with the verification code sent by Cognito. */
    @PostMapping("/confirm")
    public ResponseEntity<Void> confirm(@Valid @RequestBody ConfirmRequest request) {
        userService.confirm(request);
        return ResponseEntity.ok().build();
    }

    /** Login — returns JWT tokens from Cognito. */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    /** Refresh access token using a refresh token. */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        LoginResponse response = userService.refresh(request);
        return ResponseEntity.ok(response);
    }

    /** Get the authenticated user's profile. */
    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        ProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(profile);
    }

    /** Update the authenticated user's profile. */
    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(@AuthenticationPrincipal Jwt jwt,
                                                          @Valid @RequestBody UpdateProfileRequest request) {
        String userId = jwt.getSubject();
        ProfileResponse profile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(profile);
    }
}
