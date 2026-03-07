package com.consumerordering.notificationservice.consumer;

import com.consumerordering.notificationservice.model.OrderEvent;
import com.consumerordering.notificationservice.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.DeleteMessageRequest;
import software.amazon.awssdk.services.sqs.model.ReceiveMessageRequest;
import software.amazon.awssdk.services.sqs.model.Message;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    @Value("${app.sqs.order-events-queue-url}")
    private String queueUrl;

    @Scheduled(fixedDelay = 5000)
    public void pollMessages() {
        try {
            ReceiveMessageRequest request = ReceiveMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .maxNumberOfMessages(10)
                    .waitTimeSeconds(5)
                    .build();

            List<Message> messages = sqsClient.receiveMessage(request).messages();

            for (Message message : messages) {
                processMessage(message);
            }
        } catch (Exception e) {
            log.error("Failed to poll SQS messages: {}", e.getMessage());
        }
    }

    private void processMessage(Message message) {
        try {
            OrderEvent event = objectMapper.readValue(message.body(), OrderEvent.class);
            log.info("action=PROCESS_EVENT eventType={} orderId={}", event.getEventType(), event.getOrderId());

            emailService.sendOrderEmail(event);

            // Delete message after successful processing
            sqsClient.deleteMessage(DeleteMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .receiptHandle(message.receiptHandle())
                    .build());

        } catch (Exception e) {
            log.error("Failed to process message: {}", e.getMessage());
        }
    }
}
