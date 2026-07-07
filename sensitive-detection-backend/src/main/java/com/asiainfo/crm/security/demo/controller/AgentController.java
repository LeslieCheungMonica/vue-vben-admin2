package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.ChatRequest;
import com.asiainfo.crm.security.demo.dto.ChatResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.AgentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequestMapping("/agent")
public class AgentController {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@RequestBody ChatRequest request) {
        log.info("Agent chat request (SSE): {}", request.getMessage());
        return agentService.chatStream(request);
    }

    @PostMapping("/chat/sync")
    public Result<ChatResponse> chatSync(@RequestBody ChatRequest request) {
        log.info("Agent chat request (sync): {}", request.getMessage());
        ChatResponse response = agentService.chatSync(request);
        return Result.success(response);
    }
}
