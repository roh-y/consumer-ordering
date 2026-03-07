package com.consumerordering.orderservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;

    @Value("${app.sqs.order-events-queue-url}")
    private String queueUrl;

    public void publishOrderCreated(String orderId, String userId, String planId,
                                     String planName, double pricePerMonth, String userEmail) {
        publishEvent("ORDER_CREATED", orderId, userId, planId, planName, pricePerMonth, userEmail);
    }

    public void publishPlanChanged(String orderId, String userId, String planId,
                                    String planName, double pricePerMonth, String userEmail) {
        publishEvent("PLAN_CHANGED", orderId, userId, planId, planName, pricePerMonth, userEmail);
    }

    public void publishOrderCancelled(String orderId, String userId, String planId) {
        publishEvent("ORDER_CANCELLED", orderId, userId, planId, null, 0, null);
    }

    private void publishEvent(String eventType, String orderId, String userId, String planId,
                               String planName, double pricePerMonth, String userEmail) {
        try {
            Map<String, Object> event = new java.util.HashMap<>();
            event.put("eventType", eventType);
            event.put("orderId", orderId);
            event.put("userId", userId);
            event.put("planId", planId);
            if (planName != null) event.put("planName", planName);
            if (pricePerMonth > 0) event.put("pricePerMonth", pricePerMonth);
            if (userEmail != null) event.put("userEmail", userEmail);

            String messageBody = objectMapper.writeValueAsString(event);

            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build());

            log.info("Published {} event for orderId={}", eventType, orderId);
        } catch (Exception e) {
            log.error("Failed to publish {} event for orderId={}", eventType, orderId, e);
        }
    }
}
