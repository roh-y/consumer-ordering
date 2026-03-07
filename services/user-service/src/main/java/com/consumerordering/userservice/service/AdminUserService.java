package com.consumerordering.userservice.service;

import com.consumerordering.userservice.model.User;
import com.consumerordering.userservice.model.dto.ProfileResponse;
import com.consumerordering.userservice.model.dto.UserStatsResponse;
import com.consumerordering.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<ProfileResponse> listAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toProfileResponse)
                .toList();
    }

    public ProfileResponse getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        return toProfileResponse(user);
    }

    public UserStatsResponse getUserStats() {
        List<User> users = userRepository.findAll();

        long usersWithPlan = users.stream()
                .filter(u -> u.getPlanId() != null && !u.getPlanId().isEmpty())
                .count();

        Map<String, Long> planDistribution = users.stream()
                .filter(u -> u.getPlanId() != null && !u.getPlanId().isEmpty())
                .collect(Collectors.groupingBy(User::getPlanId, Collectors.counting()));

        return UserStatsResponse.builder()
                .totalUsers(users.size())
                .usersWithPlan(usersWithPlan)
                .planDistribution(planDistribution)
                .build();
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
