package com.asiainfo.crm.security.demo.framework;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class TokenManager {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String SECRET_KEY = "SensitiveDetectionDemo2026SecretKey";
    private static final long DEFAULT_EXPIRE_MS = 24 * 60 * 60 * 1000L;

    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    public String createToken(String username) {
        String tokenId = UUID.randomUUID().toString().replace("-", "");
        String raw = tokenId + ":" + username + ":" + System.currentTimeMillis();
        String signature = hmacSha256(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(
                (raw + ":" + signature).getBytes(StandardCharsets.UTF_8));

        TokenInfo info = new TokenInfo();
        info.token = token;
        info.username = username;
        info.createTime = System.currentTimeMillis();
        info.expireTime = System.currentTimeMillis() + DEFAULT_EXPIRE_MS;
        tokenStore.put(token, info);

        log.info("Token created for user: {}", username);
        return token;
    }

    public boolean validateToken(String token) {
        if (!StringUtils.hasText(token)) {
            return false;
        }
        TokenInfo info = tokenStore.get(token);
        if (info == null) {
            return false;
        }
        if (System.currentTimeMillis() > info.expireTime) {
            tokenStore.remove(token);
            return false;
        }
        return true;
    }

    public String getUsername(String token) {
        TokenInfo info = tokenStore.get(token);
        return info != null ? info.username : null;
    }

    public void invalidateToken(String token) {
        if (StringUtils.hasText(token)) {
            tokenStore.remove(token);
            log.info("Token invalidated");
        }
    }

    public long getExpireTime(String token) {
        TokenInfo info = tokenStore.get(token);
        return info != null ? info.expireTime : 0;
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec keySpec = new SecretKeySpec(SECRET_KEY.getBytes(StandardCharsets.UTF_8), HMAC_ALGO);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Failed to generate HMAC", e);
        }
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    static class TokenInfo {
        String token;
        String username;
        long createTime;
        long expireTime;
    }
}
