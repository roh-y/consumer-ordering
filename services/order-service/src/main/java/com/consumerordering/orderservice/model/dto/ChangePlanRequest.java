package com.consumerordering.orderservice.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePlanRequest {

    @NotBlank(message = "New plan ID is required")
    private String newPlanId;
}
