package com.asiainfo.crm.security.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "security.login")
public class SecurityProperties {

    private Map<String, String> users = new HashMap<>();

    private String aesKey = "DemoAesKey2026!";

    private int tokenExpireHours = 24;
}
