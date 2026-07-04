package com.rtdabe.auth;

import com.rtdabe.dto.LoginRequest;
import com.rtdabe.dto.TokenResponse;

public interface AuthService {
    TokenResponse login(LoginRequest request);
    TokenResponse refresh(String refreshToken);
}
