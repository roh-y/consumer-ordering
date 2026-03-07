package com.consumerordering.orderservice.service;

import com.consumerordering.orderservice.exception.OrderNotFoundException;
import com.consumerordering.orderservice.model.Order;
import com.consumerordering.orderservice.model.dto.ChangePlanRequest;
import com.consumerordering.orderservice.model.dto.CreateOrderRequest;
import com.consumerordering.orderservice.model.dto.OrderResponse;
import com.consumerordering.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderEventPublisher orderEventPublisher;

    @Value("${app.plan-catalog-service.url:http://localhost:8082}")
    private String planCatalogServiceUrl;

    @Value("${app.user-service.url:http://localhost:8081}")
    private String userServiceUrl;

    public OrderResponse createOrder(String userId, CreateOrderRequest request, String userEmail) {
        Map<String, Object> plan = fetchPlan(request.getPlanId());

        Instant now = Instant.now();
        String orderId = UUID.randomUUID().toString();
        String planName = (String) plan.get("name");
        double pricePerMonth = ((Number) plan.get("pricePerMonth")).doubleValue();

        Order order = Order.builder()
                .orderId(orderId)
                .userId(userId)
                .planId(request.getPlanId())
                .planName(planName)
                .pricePerMonth(pricePerMonth)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        orderRepository.save(order);

        // Update user's planId
        updateUserPlanId(userId, request.getPlanId());

        // Publish enriched event to SQS
        orderEventPublisher.publishOrderCreated(orderId, userId, request.getPlanId(),
                planName, pricePerMonth, userEmail);

        log.info("action=CREATE_ORDER userId={} planId={} orderId={}", userId, request.getPlanId(), orderId);

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

        if (!"PENDING".equals(order.getStatus()) && !"ACTIVE".equals(order.getStatus())) {
            throw new IllegalStateException("Only pending or active orders can be cancelled");
        }

        order.setStatus("CANCELLED");
        order.setUpdatedAt(Instant.now());
        orderRepository.update(order);

        // Clear user's planId on cancellation
        updateUserPlanId(userId, null);

        orderEventPublisher.publishOrderCancelled(orderId, userId, order.getPlanId());

        log.info("action=CANCEL_ORDER userId={} orderId={}", userId, orderId);

        return toOrderResponse(order);
    }

    public OrderResponse changePlan(String userId, ChangePlanRequest request, String userEmail) {
        // Cancel any active orders for this user
        List<Order> activeOrders = orderRepository.findByUserId(userId).stream()
                .filter(o -> "ACTIVE".equals(o.getStatus()))
                .toList();

        for (Order active : activeOrders) {
            active.setStatus("CANCELLED");
            active.setUpdatedAt(Instant.now());
            orderRepository.update(active);
            log.info("action=CANCEL_ORDER_FOR_PLAN_CHANGE userId={} orderId={}", userId, active.getOrderId());
        }

        // Create new ACTIVE order for the new plan
        Map<String, Object> plan = fetchPlan(request.getNewPlanId());
        Instant now = Instant.now();
        String orderId = UUID.randomUUID().toString();
        String planName = (String) plan.get("name");
        double pricePerMonth = ((Number) plan.get("pricePerMonth")).doubleValue();

        Order newOrder = Order.builder()
                .orderId(orderId)
                .userId(userId)
                .planId(request.getNewPlanId())
                .planName(planName)
                .pricePerMonth(pricePerMonth)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        orderRepository.save(newOrder);

        // Update user's planId
        updateUserPlanId(userId, request.getNewPlanId());

        // Publish plan changed event
        orderEventPublisher.publishPlanChanged(orderId, userId, request.getNewPlanId(),
                planName, pricePerMonth, userEmail);

        log.info("action=CHANGE_PLAN userId={} newPlanId={} orderId={}", userId, request.getNewPlanId(), orderId);

        return toOrderResponse(newOrder);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchPlan(String planId) {
        RestTemplate restTemplate = new RestTemplate();
        String url = planCatalogServiceUrl + "/api/plans/" + planId;
        return restTemplate.getForObject(url, Map.class);
    }

    private void updateUserPlanId(String userId, String planId) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = userServiceUrl + "/api/users/internal/plan";
            Map<String, String> body = new java.util.HashMap<>();
            body.put("userId", userId);
            body.put("planId", planId);
            restTemplate.put(url, body);
        } catch (Exception e) {
            log.warn("Failed to update user planId for userId={}: {}", userId, e.getMessage());
        }
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
