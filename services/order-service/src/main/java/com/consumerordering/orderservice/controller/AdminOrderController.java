package com.consumerordering.orderservice.controller;

import com.consumerordering.orderservice.model.dto.OrderResponse;
import com.consumerordering.orderservice.model.dto.OrderStatsResponse;
import com.consumerordering.orderservice.service.AdminOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ResponseEntity<List<OrderResponse>> listAllOrders() {
        log.info("action=ADMIN_LIST_ORDERS");
        return ResponseEntity.ok(adminOrderService.listAllOrders());
    }

    @GetMapping("/stats")
    public ResponseEntity<OrderStatsResponse> getOrderStats() {
        log.info("action=ADMIN_ORDER_STATS");
        return ResponseEntity.ok(adminOrderService.getOrderStats());
    }
}
