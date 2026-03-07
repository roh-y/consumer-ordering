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

    public void publishOrderCreated(String orderId, String userId, String planId) {
        try {
            Map<String, String> event = Map.of(
                "eventType", "order-created",
                "orderId", orderId,
                "userId", userId,
                "planId", planId
            );

            String messageBody = objectMapper.writeValueAsString(event);

            sqsClient.sendMessage(SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build());

            log.info("Published order-created event for orderId={}", orderId);
        } catch (Exception e) {
            log.error("Failed to publish order event for orderId={}", orderId, e);
        }
    }
}
