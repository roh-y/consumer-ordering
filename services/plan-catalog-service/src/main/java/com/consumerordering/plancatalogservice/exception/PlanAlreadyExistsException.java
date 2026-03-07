package com.consumerordering.plancatalogservice.exception;

public class PlanAlreadyExistsException extends RuntimeException {

    public PlanAlreadyExistsException(String planId) {
        super("Plan already exists: " + planId);
    }
}
