package com.consumerordering.orderservice.service;

import com.consumerordering.orderservice.exception.OrderNotFoundException;
import com.consumerordering.orderservice.model.Order;
import com.consumerordering.orderservice.model.dto.CreateOrderRequest;
import com.consumerordering.orderservice.model.dto.OrderResponse;
import com.consumerordering.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Value("${app.plan-catalog-service.url:http://localhost:8082}")
    private String planCatalogServiceUrl;

    public OrderResponse createOrder(String userId, CreateOrderRequest request) {
        // Fetch plan details from plan-catalog-service
        Map<String, Object> plan = fetchPlan(request.getPlanId());

        Instant now = Instant.now();
        String orderId = UUID.randomUUID().toString();

        Order order = Order.builder()
                .orderId(orderId)
                .userId(userId)
                .planId(request.getPlanId())
                .planName((String) plan.get("name"))
                .pricePerMonth(((Number) plan.get("pricePerMonth")).doubleValue())
                .status("PENDING")
                .createdAt(now)
                .updatedAt(now)
                .build();

        orderRepository.save(order);

        // Publish event to SQS (fire-and-forget)
        orderEventPublisher.publishOrderCreated(orderId, userId, request.getPlanId());

        return toOrderResponse(order);
    }

    public List<OrderResponse> getOrdersByUser(String userId) {
        return orderRepository.findByUserId(userId).stream()
                .map(this::toOrderResponse)
                .toList();
    }

    public OrderResponse getOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId, userId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));
        return toOrderResponse(order);
    }

    public OrderResponse cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId, userId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(Instant.now());
        orderRepository.update(order);

        return toOrderResponse(order);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchPlan(String planId) {
        RestTemplate restTemplate = new RestTemplate();
        String url = planCatalogServiceUrl + "/api/plans/" + planId;
        return restTemplate.getForObject(url, Map.class);
    }

    private OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .userId(order.getUserId())
                .planId(order.getPlanId())
                .planName(order.getPlanName())
                .pricePerMonth(order.getPricePerMonth())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
