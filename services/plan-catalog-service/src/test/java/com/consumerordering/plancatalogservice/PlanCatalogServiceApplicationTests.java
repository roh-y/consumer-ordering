package com.consumerordering.plancatalogservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration",
    "app.dynamodb.plans-table=test-plans"
})
class PlanCatalogServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
