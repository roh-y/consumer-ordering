package com.consumerordering.plancatalogservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.util.List;

@DynamoDbBean
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plan {

    private String planId;
    private String name;
    private String description;
    private double pricePerMonth;
    private int dataGB;
    private List<String> features;
    private String badge;
    private int sortOrder;
    private String shortTagline;

    @DynamoDbPartitionKey
    public String getPlanId() {
        return planId;
    }
}
