package com.asiainfo.crm.security.demo.framework;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
@Component
public class AuthFilter extends OncePerRequestFilter {

    private final TokenManager tokenManager;

    public AuthFilter(TokenManager tokenManager) {
        this.tokenManager = tokenManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Skip auth paths
        if (path.contains("/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader("X-Sec-Auth");

        // If no X-Sec-Auth header, skip authentication (for integrated mode)
        if (!StringUtils.hasText(token)) {
            request.setAttribute("currentUser", "system");
            filterChain.doFilter(request, response);
            return;
        }

        // Strip "Sec " prefix if present (frontend sends "Sec <token>")
        if (token.startsWith("Sec ")) {
            token = token.substring(4);
        }

        if (!tokenManager.validateToken(token)) {
            sendUnauthorized(response, "Invalid or expired token");
            return;
        }

        // Store username in request attribute for downstream use
        String username = tokenManager.getUsername(token);
        request.setAttribute("currentUser", username);

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":401,\"message\":\"" + message + "\",\"data\":null}");
    }
}
