package com.consumerordering.orderservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration",
    "app.dynamodb.orders-table=test-orders",
    "app.sqs.order-events-queue-url=https://sqs.us-east-1.amazonaws.com/000000000000/test-queue"
})
class OrderServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
