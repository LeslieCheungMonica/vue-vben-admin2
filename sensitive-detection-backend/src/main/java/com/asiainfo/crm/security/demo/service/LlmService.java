package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.config.LlmProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
public class LlmService {

    private final LlmProperties props;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public LlmService(LlmProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getConnectTimeout());
        factory.setReadTimeout(props.getReadTimeout());
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isEnabled() {
        return props.isEnabled() && props.getApiKey() != null && !props.getApiKey().isEmpty();
    }

    /**
     * 通用 LLM 调用：传入 systemPrompt + userPrompt，返回 LLM 文本响应
     */
    public String chat(String systemPrompt, String userPrompt) {
        if (!isEnabled()) return null;
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("model", props.getDefaultModel());
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> sysMsg = new HashMap<>();
            sysMsg.put("role", "system");
            sysMsg.put("content", systemPrompt);
            messages.add(sysMsg);
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userPrompt);
            messages.add(userMsg);
            body.put("messages", messages);
            body.put("stream", false);
            body.put("temperature", 0);
            body.put("max_tokens", 2000);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + props.getApiKey());

            String jsonReq = objectMapper.writeValueAsString(body);
            log.info("LLM call: model={}", props.getDefaultModel());

            long start = System.currentTimeMillis();
            ResponseEntity<String> resp = restTemplate.exchange(
                    props.getApiUrl(), HttpMethod.POST, new HttpEntity<>(jsonReq, headers), String.class);
            long elapsed = System.currentTimeMillis() - start;
            log.info("LLM response: status={}, elapsed={}ms", resp.getStatusCodeValue(), elapsed);

            return extractContent(resp.getBody());
        } catch (Exception e) {
            log.error("LLM call failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 隐私检测：判断 JSON 报文是否包含敏感信息
     */
    public PrivacyDetectResult detectPrivacy(String jsonResponse) {
        String systemPrompt = "你是一个隐私信息检测专家。判断接口响应 JSON 中是否包含敏感信息泄露。" +
                "敏感类型包括：PHONE(手机号),ID_CARD(身份证),BANK_CARD(银行卡),EMAIL(邮箱),ADDRESS(地址),NAME(姓名)。" +
                "返回JSON格式：{\"has_sensitive\":true,\"items\":[{\"type\":\"PHONE\",\"field\":\"phoneNum\",\"value\":\"脱敏值\",\"confidence\":0.95}]}。" +
                "如果无敏感信息返回：{\"has_sensitive\":false,\"items\":[]}。只返回JSON，不要其他文字。";

        String userPrompt = "请分析以下接口响应是否包含敏感信息：\n" + jsonResponse;
        String result = chat(systemPrompt, userPrompt);
        if (result == null) return null;
        try {
            // 提取 JSON 部分
            String json = result;
            int idx = result.indexOf('{');
            if (idx >= 0) json = result.substring(idx);
            idx = json.lastIndexOf('}');
            if (idx >= 0) json = json.substring(0, idx + 1);
            return objectMapper.readValue(json, PrivacyDetectResult.class);
        } catch (Exception e) {
            log.warn("Failed to parse LLM privacy result: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 智能体对话：基于数据上下文回答用户问题
     */
    public String agentChat(String userMessage, String dataContext) {
        String systemPrompt = "你是敏感信息检测系统的智能安全助手。根据提供的系统数据回答用户问题。" +
                "用中文回答，使用 Markdown 格式。回答要简洁专业，引用具体数据。" +
                "如果问题与系统无关，礼貌说明你只能回答与敏感信息检测相关的问题。";

        String userPrompt = "【当前系统数据】\n" + dataContext + "\n\n【用户问题】" + userMessage;
        return chat(systemPrompt, userPrompt);
    }

    private String extractContent(String responseBody) {
        if (responseBody == null) return null;
        try {
            Map<String, Object> result = objectMapper.readValue(responseBody, Map.class);
            if (result.containsKey("choices")) {
                List<?> choices = (List<?>) result.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> first = (Map<String, Object>) choices.get(0);
                    Map<String, Object> message = (Map<String, Object>) first.get("message");
                    return (String) message.get("content");
                }
            } else if (result.containsKey("response")) {
                return (String) result.get("response");
            }
        } catch (Exception e) {
            log.warn("Failed to extract LLM content: {}", e.getMessage());
        }
        return null;
    }

    public List<String> getModels() { return props.getModels(); }
    public Map<String, String> getConfig() {
        Map<String, String> c = new HashMap<>();
        c.put("enabled", String.valueOf(props.isEnabled()));
        c.put("apiUrl", props.getApiUrl());
        c.put("defaultModel", props.getDefaultModel());
        c.put("models", String.join(",", props.getModels()));
        return c;
    }
    public void updateConfig(String apiUrl, String apiKey, String defaultModel) {
        if (apiUrl != null) props.setApiUrl(apiUrl);
        if (apiKey != null) props.setApiKey(apiKey);
        if (defaultModel != null) props.setDefaultModel(defaultModel);
    }

    @lombok.Data
    public static class PrivacyDetectResult {
        private boolean has_sensitive;
        private List<SensitiveItem> items;
    }

    @lombok.Data
    public static class SensitiveItem {
        private String type;
        private String field;
        private String value;
        private double confidence;
    }
}
