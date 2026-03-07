package com.consumerordering.orderservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatsResponse {

    private long totalOrders;
    private long activeOrders;
    private double totalMonthlyRevenue;
    private Map<String, Long> ordersByPlan;
}
