package com.consumerordering.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;

/**
 * Creates the Cognito Identity Provider client bean used for
 * user sign-up, sign-in, and token operations.
 */
@Configuration
public class CognitoConfig {

    @Bean
    public CognitoIdentityProviderClient cognitoClient(Region awsRegion,
                                                        DefaultCredentialsProvider credentialsProvider) {
        return CognitoIdentityProviderClient.builder()
                .region(awsRegion)
                .credentialsProvider(credentialsProvider)
                .build();
    }
}
