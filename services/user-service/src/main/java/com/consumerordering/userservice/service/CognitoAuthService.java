package com.consumerordering.userservice.service;

import com.consumerordering.userservice.model.dto.LoginResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.*;

import java.util.Map;

/**
 * Wraps Cognito SDK calls for user authentication operations.
 * All Cognito interactions go through this service so the rest of the app
 * doesn't need to know about Cognito API details.
 */
@Service
public class CognitoAuthService {

    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;
    private final String clientId;

    public CognitoAuthService(CognitoIdentityProviderClient cognitoClient,
                              @Value("${app.cognito.user-pool-id}") String userPoolId,
                              @Value("${app.cognito.client-id}") String clientId) {
        this.cognitoClient = cognitoClient;
        this.userPoolId = userPoolId;
        this.clientId = clientId;
    }

    /** Register a new user in Cognito. Returns the Cognito user sub (UUID). */
    public String signUp(String email, String password, String firstName, String lastName) {
        SignUpRequest request = SignUpRequest.builder()
                .clientId(clientId)
                .username(email)
                .password(password)
                .userAttributes(
                        AttributeType.builder().name("email").value(email).build(),
                        AttributeType.builder().name("given_name").value(firstName).build(),
                        AttributeType.builder().name("family_name").value(lastName).build()
                )
                .build();

        SignUpResponse response = cognitoClient.signUp(request);
        return response.userSub();
    }

    /** Confirm a user's email with the verification code sent by Cognito. */
    public void confirmSignUp(String email, String confirmationCode) {
        ConfirmSignUpRequest request = ConfirmSignUpRequest.builder()
                .clientId(clientId)
                .username(email)
                .confirmationCode(confirmationCode)
                .build();

        cognitoClient.confirmSignUp(request);
    }

    /** Authenticate a user and return JWT tokens. */
    public LoginResponse initiateAuth(String email, String password) {
        InitiateAuthRequest request = InitiateAuthRequest.builder()
                .authFlow(AuthFlowType.USER_PASSWORD_AUTH)
                .clientId(clientId)
                .authParameters(Map.of(
                        "USERNAME", email,
                        "PASSWORD", password
                ))
                .build();

        InitiateAuthResponse response = cognitoClient.initiateAuth(request);
        AuthenticationResultType result = response.authenticationResult();

        return LoginResponse.builder()
                .accessToken(result.accessToken())
                .refreshToken(result.refreshToken())
                .idToken(result.idToken())
                .expiresIn(result.expiresIn())
                .tokenType(result.tokenType())
                .build();
    }

    /** Use a refresh token to get new access/id tokens. */
    public LoginResponse refreshTokens(String refreshToken) {
        InitiateAuthRequest request = InitiateAuthRequest.builder()
                .authFlow(AuthFlowType.REFRESH_TOKEN_AUTH)
                .clientId(clientId)
                .authParameters(Map.of("REFRESH_TOKEN", refreshToken))
                .build();

        InitiateAuthResponse response = cognitoClient.initiateAuth(request);
        AuthenticationResultType result = response.authenticationResult();

        return LoginResponse.builder()
                .accessToken(result.accessToken())
                .idToken(result.idToken())
                .expiresIn(result.expiresIn())
                .tokenType(result.tokenType())
                .build();
    }
}
