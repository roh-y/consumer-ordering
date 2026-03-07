package com.consumerordering.plancatalogservice.exception;

public class PlanNotFoundException extends RuntimeException {

    public PlanNotFoundException(String planId) {
        super("Plan not found: " + planId);
    }
}
