package com.consumerordering.plancatalogservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {

    private String planId;
    private String name;
    private String description;
    private double pricePerMonth;
    private int dataGB;
    private List<String> features;
}
