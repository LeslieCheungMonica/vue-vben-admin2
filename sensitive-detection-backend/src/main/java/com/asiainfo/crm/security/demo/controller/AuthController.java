package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.LoginRequest;
import com.asiainfo.crm.security.demo.dto.LoginResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.AuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/publicKey")
    public Result<Map<String, String>> getPublicKey() {
        String key = authService.getPublicKey();
        return Result.success(Collections.singletonMap("publicKey", key));
    }

    @PostMapping("/login")
    public Result<LoginResponse> login(@RequestBody LoginRequest request) {
        log.info("Login request for user: {}", request.getUsername());
        LoginResponse response = authService.login(request);
        return Result.success(response);
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("X-Sec-Auth");
        authService.logout(token);
        return Result.success();
    }
}
