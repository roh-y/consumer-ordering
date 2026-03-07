package com.consumerordering.orderservice.repository;

import com.consumerordering.orderservice.model.Order;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.List;
import java.util.Optional;

@Repository
public class OrderRepository {

    private final DynamoDbTable<Order> orderTable;

    public OrderRepository(DynamoDbEnhancedClient enhancedClient,
                           @Value("${app.dynamodb.orders-table}") String tableName) {
        this.orderTable = enhancedClient.table(tableName, TableSchema.fromBean(Order.class));
    }

    public void save(Order order) {
        orderTable.putItem(order);
    }

    public Optional<Order> findById(String orderId, String userId) {
        Order order = orderTable.getItem(Key.builder()
                .partitionValue(orderId)
                .sortValue(userId)
                .build());
        return Optional.ofNullable(order);
    }

    public List<Order> findByUserId(String userId) {
        var index = orderTable.index("userId-index");
        var queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(userId).build()))
                .build();

        return index.query(queryRequest).stream()
                .flatMap(page -> page.items().stream())
                .toList();
    }

    public List<Order> findAll() {
        return orderTable.scan().items().stream().toList();
    }

    public void update(Order order) {
        orderTable.updateItem(order);
    }
}
