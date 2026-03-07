package com.consumerordering.plancatalogservice.repository;

import com.consumerordering.plancatalogservice.model.Plan;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.List;
import java.util.Optional;

@Repository
public class PlanRepository {

    private final DynamoDbTable<Plan> planTable;

    public PlanRepository(DynamoDbEnhancedClient enhancedClient,
                          @Value("${app.dynamodb.plans-table}") String tableName) {
        this.planTable = enhancedClient.table(tableName, TableSchema.fromBean(Plan.class));
    }

    public void save(Plan plan) {
        planTable.putItem(plan);
    }

    public Optional<Plan> findById(String planId) {
        Plan plan = planTable.getItem(Key.builder().partitionValue(planId).build());
        return Optional.ofNullable(plan);
    }

    public List<Plan> findAll() {
        return planTable.scan().items().stream().toList();
    }

    public void update(Plan plan) {
        planTable.updateItem(plan);
    }

    public void delete(String planId) {
        planTable.deleteItem(Key.builder().partitionValue(planId).build());
    }

    public long count() {
        return planTable.scan().items().stream().count();
    }
}
