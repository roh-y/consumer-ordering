package com.consumerordering.userservice.controller;

import com.consumerordering.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @PutMapping("/plan")
    public ResponseEntity<Void> updateUserPlan(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String planId = request.get("planId");
        userService.updatePlanId(userId, planId);
        return ResponseEntity.ok().build();
    }
}
