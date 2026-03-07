package com.consumerordering.orderservice.controller;

import com.consumerordering.orderservice.model.dto.ChangePlanRequest;
import com.consumerordering.orderservice.model.dto.CreateOrderRequest;
import com.consumerordering.orderservice.model.dto.OrderResponse;
import com.consumerordering.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@AuthenticationPrincipal Jwt jwt,
                                                      @Valid @RequestBody CreateOrderRequest request) {
        String userId = jwt.getSubject();
        String userEmail = jwt.getClaimAsString("email");
        OrderResponse order = orderService.createOrder(userId, request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getOrders(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@AuthenticationPrincipal Jwt jwt,
                                                   @PathVariable String orderId) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(orderService.getOrder(orderId, userId));
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@AuthenticationPrincipal Jwt jwt,
                                                      @PathVariable String orderId) {
        String userId = jwt.getSubject();
        return ResponseEntity.ok(orderService.cancelOrder(orderId, userId));
    }

    @PostMapping("/change-plan")
    public ResponseEntity<OrderResponse> changePlan(@AuthenticationPrincipal Jwt jwt,
                                                     @Valid @RequestBody ChangePlanRequest request) {
        String userId = jwt.getSubject();
        String userEmail = jwt.getClaimAsString("email");
        OrderResponse order = orderService.changePlan(userId, request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}
