package com.consumerordering.notificationservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "app.sqs.order-events-queue-url=https://sqs.us-east-1.amazonaws.com/000000000000/test-queue",
    "app.ses.from-email=test@example.com"
})
class NotificationServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
