package com.consumerordering.orderservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private String orderId;
    private String userId;
    private String planId;
    private String planName;
    private double pricePerMonth;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
}
