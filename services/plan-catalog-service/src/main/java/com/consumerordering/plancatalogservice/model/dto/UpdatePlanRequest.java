package com.consumerordering.plancatalogservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePlanRequest {

    private String name;
    private String description;
    private Double pricePerMonth;
    private Integer dataGB;
    private List<String> features;
}
