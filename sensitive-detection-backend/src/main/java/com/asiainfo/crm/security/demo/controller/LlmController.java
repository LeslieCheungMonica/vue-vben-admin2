package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.LlmService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/llm")
public class LlmController {

    private final LlmService llmService;

    public LlmController(LlmService llmService) {
        this.llmService = llmService;
    }

    @PostMapping("/config")
    public Result<Map<String, String>> getConfig() {
        return Result.success(llmService.getConfig());
    }

    @PostMapping("/updateConfig")
    public Result<Void> updateConfig(@RequestBody Map<String, String> params) {
        llmService.updateConfig(
                params.get("apiUrl"),
                params.get("apiKey"),
                params.get("defaultModel")
        );
        log.info("LLM config updated");
        return Result.success();
    }

    @PostMapping("/test")
    public Result<Map<String, Object>> test(@RequestBody Map<String, String> params) {
        String prompt = params.getOrDefault("prompt", "你好，请用一句话介绍你自己。");
        long start = System.currentTimeMillis();
        String result = llmService.chat("你是一个安全助手，请简洁回答。", prompt);
        long elapsed = System.currentTimeMillis() - start;
        Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("success", result != null);
        resp.put("content", result);
        resp.put("elapsedMs", elapsed);
        return Result.success(resp);
    }
}
