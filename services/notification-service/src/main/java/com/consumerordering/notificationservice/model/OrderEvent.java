package com.consumerordering.notificationservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderEvent {

    private String eventType;
    private String orderId;
    private String userId;
    private String planId;
    private String planName;
    private double pricePerMonth;
    private String userEmail;
}
