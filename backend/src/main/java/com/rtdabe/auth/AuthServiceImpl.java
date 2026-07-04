package com.rtdabe.auth;

import com.rtdabe.dto.LoginRequest;
import com.rtdabe.dto.TokenResponse;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Locale;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {
    private final UserAccountRepository userAccountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthServiceImpl(UserAccountRepository userAccountRepository, RefreshTokenRepository refreshTokenRepository, JwtService jwtService) {
        this.userAccountRepository = userAccountRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
    }

    @Override
    public TokenResponse login(LoginRequest request) {
        UserAccount userAccount = userAccountRepository.findByUsername(request.username().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), userAccount.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!userAccount.isEnabled()) {
            throw new IllegalArgumentException("Account disabled");
        }

        String accessToken = jwtService.generateAccessToken(userAccount);
        String refreshToken = jwtService.generateRefreshToken(userAccount);

        RefreshToken stored = new RefreshToken();
        stored.setUserId(userAccount.getId());
        stored.setTokenHash(sha256(refreshToken));
        stored.setExpiresAt(OffsetDateTime.now().plusDays(7));
        stored.setRevoked(false);
        refreshTokenRepository.save(stored);

        return new TokenResponse(accessToken, refreshToken, 3600, "Bearer");
    }

    @Override
    public TokenResponse refresh(String refreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(refreshToken))
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }

        UserAccount userAccount = userAccountRepository.findById(stored.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(userAccount);
        return new TokenResponse(newAccessToken, refreshToken, 3600, "Bearer");
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
