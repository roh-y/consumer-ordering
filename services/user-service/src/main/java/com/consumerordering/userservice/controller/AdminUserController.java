package com.consumerordering.userservice.controller;

import com.consumerordering.userservice.model.dto.ProfileResponse;
import com.consumerordering.userservice.model.dto.UserStatsResponse;
import com.consumerordering.userservice.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<ProfileResponse>> listAllUsers() {
        log.info("action=ADMIN_LIST_USERS");
        return ResponseEntity.ok(adminUserService.listAllUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<UserStatsResponse> getUserStats() {
        log.info("action=ADMIN_USER_STATS");
        return ResponseEntity.ok(adminUserService.getUserStats());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileResponse> getUser(@PathVariable String userId) {
        log.info("action=ADMIN_GET_USER userId={}", userId);
        return ResponseEntity.ok(adminUserService.getUser(userId));
    }
}
