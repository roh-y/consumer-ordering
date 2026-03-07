package com.consumerordering.plancatalogservice.controller;

import com.consumerordering.plancatalogservice.model.dto.CreatePlanRequest;
import com.consumerordering.plancatalogservice.model.dto.PlanResponse;
import com.consumerordering.plancatalogservice.model.dto.UpdatePlanRequest;
import com.consumerordering.plancatalogservice.service.PlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public ResponseEntity<List<PlanResponse>> getAllPlans() {
        return ResponseEntity.ok(planService.getAllPlans());
    }

    @GetMapping("/{planId}")
    public ResponseEntity<PlanResponse> getPlan(@PathVariable String planId) {
        return ResponseEntity.ok(planService.getPlan(planId));
    }

    @PostMapping
    public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody CreatePlanRequest request) {
        PlanResponse plan = planService.createPlan(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(plan);
    }

    @PutMapping("/{planId}")
    public ResponseEntity<PlanResponse> updatePlan(@PathVariable String planId,
                                                    @Valid @RequestBody UpdatePlanRequest request) {
        return ResponseEntity.ok(planService.updatePlan(planId, request));
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<Void> deletePlan(@PathVariable String planId) {
        planService.deletePlan(planId);
        return ResponseEntity.noContent().build();
    }
}
