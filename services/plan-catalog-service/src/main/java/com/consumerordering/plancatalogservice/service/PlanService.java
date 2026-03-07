package com.consumerordering.plancatalogservice.service;

import com.consumerordering.plancatalogservice.exception.PlanAlreadyExistsException;
import com.consumerordering.plancatalogservice.exception.PlanNotFoundException;
import com.consumerordering.plancatalogservice.model.Plan;
import com.consumerordering.plancatalogservice.model.dto.CreatePlanRequest;
import com.consumerordering.plancatalogservice.model.dto.PlanResponse;
import com.consumerordering.plancatalogservice.model.dto.UpdatePlanRequest;
import com.consumerordering.plancatalogservice.repository.PlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final PlanRepository planRepository;

    public List<PlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::toPlanResponse)
                .toList();
    }

    public PlanResponse getPlan(String planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException(planId));
        return toPlanResponse(plan);
    }

    public PlanResponse createPlan(CreatePlanRequest request) {
        String planId = UUID.randomUUID().toString();

        Plan plan = Plan.builder()
                .planId(planId)
                .name(request.getName())
                .description(request.getDescription())
                .pricePerMonth(request.getPricePerMonth())
                .dataGB(request.getDataGB())
                .features(request.getFeatures())
                .build();

        planRepository.save(plan);
        return toPlanResponse(plan);
    }

    public PlanResponse updatePlan(String planId, UpdatePlanRequest request) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException(planId));

        if (request.getName() != null) plan.setName(request.getName());
        if (request.getDescription() != null) plan.setDescription(request.getDescription());
        if (request.getPricePerMonth() != null) plan.setPricePerMonth(request.getPricePerMonth());
        if (request.getDataGB() != null) plan.setDataGB(request.getDataGB());
        if (request.getFeatures() != null) plan.setFeatures(request.getFeatures());

        planRepository.update(plan);
        return toPlanResponse(plan);
    }

    public void deletePlan(String planId) {
        planRepository.findById(planId)
                .orElseThrow(() -> new PlanNotFoundException(planId));
        planRepository.delete(planId);
    }

    private PlanResponse toPlanResponse(Plan plan) {
        return PlanResponse.builder()
                .planId(plan.getPlanId())
                .name(plan.getName())
                .description(plan.getDescription())
                .pricePerMonth(plan.getPricePerMonth())
                .dataGB(plan.getDataGB())
                .features(plan.getFeatures())
                .build();
    }
}
