package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.ModelUpdateRequest;
import com.asiainfo.crm.security.demo.dto.PageResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.ModelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/model")
public class ModelController {

    private final ModelService modelService;

    public ModelController(ModelService modelService) {
        this.modelService = modelService;
    }

    @PostMapping("/list")
    public Result<PageResponse<Map<String, Object>>> list(@RequestBody Map<String, Object> params) {
        int pageNum = params.get("pageNum") != null ? ((Number) params.get("pageNum")).intValue() : 1;
        int pageSize = params.get("pageSize") != null ? ((Number) params.get("pageSize")).intValue() : 10;
        log.info("List models, page={}, size={}", pageNum, pageSize);
        PageResponse<Map<String, Object>> result = modelService.listModels(pageNum, pageSize);
        return Result.success(result);
    }

    @PostMapping("/detail")
    public Result<Map<String, Object>> detail(@RequestBody Map<String, String> params) {
        String id = params.get("id");
        log.info("Get model detail, id={}", id);
        Map<String, Object> model = modelService.getModel(id);
        return Result.success(model);
    }

    @PostMapping("/update")
    public Result<Map<String, Object>> update(@RequestBody ModelUpdateRequest request) {
        log.info("Update model, id={}", request.getId());
        Map<String, Object> updated = modelService.updateModel(request);
        return Result.success(updated);
    }

    @PostMapping("/test")
    public Result<Map<String, Object>> test(@RequestBody Map<String, Object> params) {
        String id = (String) params.get("id");
        String sampleData = (String) params.get("sampleData");
        log.info("Test model, id={}", id);
        Map<String, Object> result = modelService.testModel(id, sampleData);
        return Result.success(result);
    }
}
