package com.consumerordering.orderservice.service;

import com.consumerordering.orderservice.model.Order;
import com.consumerordering.orderservice.model.dto.OrderResponse;
import com.consumerordering.orderservice.model.dto.OrderStatsResponse;
import com.consumerordering.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;

    public List<OrderResponse> listAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::toOrderResponse)
                .toList();
    }

    public OrderStatsResponse getOrderStats() {
        List<Order> orders = orderRepository.findAll();

        List<Order> activeOrders = orders.stream()
                .filter(o -> "ACTIVE".equals(o.getStatus()))
                .toList();

        double totalRevenue = activeOrders.stream()
                .mapToDouble(Order::getPricePerMonth)
                .sum();

        Map<String, Long> ordersByPlan = activeOrders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getPlanName() != null ? o.getPlanName() : o.getPlanId(),
                        Collectors.counting()));

        return OrderStatsResponse.builder()
                .totalOrders(orders.size())
                .activeOrders(activeOrders.size())
                .totalMonthlyRevenue(totalRevenue)
                .ordersByPlan(ordersByPlan)
                .build();
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
