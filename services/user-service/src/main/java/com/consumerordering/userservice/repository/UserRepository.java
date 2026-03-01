package com.consumerordering.userservice.repository;

import com.consumerordering.userservice.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.Optional;

/**
 * DynamoDB operations for the users table.
 * Uses the enhanced client for type-safe mapping between User objects and DynamoDB items.
 */
@Repository
public class UserRepository {

    private final DynamoDbTable<User> userTable;

    public UserRepository(DynamoDbEnhancedClient enhancedClient,
                          @Value("${app.dynamodb.users-table}") String tableName) {
        this.userTable = enhancedClient.table(tableName, TableSchema.fromBean(User.class));
    }

    public void save(User user) {
        userTable.putItem(user);
    }

    public Optional<User> findById(String userId) {
        User user = userTable.getItem(Key.builder().partitionValue(userId).build());
        return Optional.ofNullable(user);
    }

    /** Look up a user by email using the email-index GSI. */
    public Optional<User> findByEmail(String email) {
        var index = userTable.index("email-index");
        var queryRequest = QueryEnhancedRequest.builder()
                .queryConditional(QueryConditional.keyEqualTo(
                        Key.builder().partitionValue(email).build()))
                .limit(1)
                .build();

        var results = index.query(queryRequest);
        return results.stream()
                .flatMap(page -> page.items().stream())
                .findFirst();
    }

    public void update(User user) {
        userTable.updateItem(user);
    }

    public void delete(String userId) {
        userTable.deleteItem(Key.builder().partitionValue(userId).build());
    }
}
