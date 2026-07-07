package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.config.SecurityProperties;
import com.asiainfo.crm.security.demo.dto.LoginRequest;
import com.asiainfo.crm.security.demo.dto.LoginResponse;
import com.asiainfo.crm.security.demo.framework.TokenManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Slf4j
@Service
public class AuthService {

    private final SecurityProperties securityProperties;
    private final TokenManager tokenManager;

    public AuthService(SecurityProperties securityProperties, TokenManager tokenManager) {
        this.securityProperties = securityProperties;
        this.tokenManager = tokenManager;
    }

    public String getPublicKey() {
        return securityProperties.getAesKey();
    }

    public LoginResponse login(LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.getUsername()) || !StringUtils.hasText(request.getPassword())) {
            throw new IllegalArgumentException("Username and password are required");
        }

        // Decrypt AES-encrypted password from frontend
        String rawPassword = decryptPassword(request.getPassword());
        log.info("Login attempt for user: {}", request.getUsername());

        String expectedPassword = securityProperties.getUsers().get(request.getUsername());
        if (expectedPassword == null || !expectedPassword.equals(rawPassword)) {
            throw new IllegalStateException("Invalid username or password");
        }

        String token = tokenManager.createToken(request.getUsername());
        long expireTime = tokenManager.getExpireTime(token);

        log.info("User {} logged in successfully", request.getUsername());

        return LoginResponse.builder()
                .session(token)
                .username(request.getUsername())
                .expireTime(expireTime)
                .build();
    }

    public void logout(String token) {
        if (StringUtils.hasText(token)) {
            if (token.startsWith("Sec ")) {
                token = token.substring(4);
            }
            tokenManager.invalidateToken(token);
            log.info("User logged out");
        }
    }

    /**
     * Decrypt AES/ECB/PKCS7 encrypted password from frontend
     */
    private String decryptPassword(String encryptedPassword) {
        try {
            String aesKey = securityProperties.getAesKey();
            SecretKeySpec keySpec = new SecretKeySpec(aesKey.getBytes(StandardCharsets.UTF_8), "AES");
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decoded = Base64.getDecoder().decode(encryptedPassword);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Failed to decrypt password, treating as plain text: {}", e.getMessage());
            return encryptedPassword;
        }
    }
}
