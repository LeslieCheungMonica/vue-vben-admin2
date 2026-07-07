package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.KnowledgeAddRequest;
import com.asiainfo.crm.security.demo.dto.KnowledgeSearchRequest;
import com.asiainfo.crm.security.demo.dto.PageResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.KnowledgeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @PostMapping("/list")
    public Result<PageResponse<Map<String, Object>>> list(@RequestBody KnowledgeSearchRequest request) {
        log.info("List knowledge, category={}, page={}, size={}",
                request.getCategory(), request.getPageNum(), request.getPageSize());
        PageResponse<Map<String, Object>> result = knowledgeService.listKnowledge(request);
        return Result.success(result);
    }

    @PostMapping("/detail")
    public Result<Map<String, Object>> detail(@RequestBody Map<String, String> params) {
        String id = params.get("id");
        log.info("Get knowledge detail, id={}", id);
        Map<String, Object> detail = knowledgeService.getKnowledge(id);
        return Result.success(detail);
    }

    @PostMapping("/add")
    public Result<Map<String, Object>> add(@RequestBody KnowledgeAddRequest request) {
        log.info("Add knowledge, title={}", request.getTitle());
        Map<String, Object> added = knowledgeService.addKnowledge(request);
        return Result.success(added);
    }

    @PostMapping("/search")
    public Result<PageResponse<Map<String, Object>>> search(@RequestBody KnowledgeSearchRequest request) {
        log.info("Search knowledge, keyword={}", request.getKeyword());
        PageResponse<Map<String, Object>> result = knowledgeService.searchKnowledge(request);
        return Result.success(result);
    }

    @PostMapping("/enhance")
    public Result<Map<String, Object>> enhance() {
        log.info("Trigger knowledge enhancement");
        Map<String, Object> result = knowledgeService.enhanceKnowledge();
        return Result.success(result);
    }
}
