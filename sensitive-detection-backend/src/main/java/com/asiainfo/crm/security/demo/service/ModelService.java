package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.dto.ModelUpdateRequest;
import com.asiainfo.crm.security.demo.dto.PageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ModelService {

    private final ObjectMapper objectMapper;
    private List<Map<String, Object>> modelConfigs = new ArrayList<>();

    public ModelService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("mock-data/model_config.json");
            InputStream is = resource.getInputStream();
            modelConfigs = objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});
            log.info("Loaded {} model configurations", modelConfigs.size());
        } catch (Exception e) {
            log.error("Failed to load model configurations", e);
        }
    }

    public PageResponse<Map<String, Object>> listModels(int pageNum, int pageSize) {
        int total = modelConfigs.size();
        int fromIndex = (pageNum - 1) * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<Map<String, Object>> page;
        if (fromIndex >= total) {
            page = new ArrayList<>();
        } else {
            page = new ArrayList<>(modelConfigs.subList(fromIndex, toIndex));
        }

        return PageResponse.<Map<String, Object>>builder()
                .total((long) total)
                .list(page)
                .build();
    }

    public Map<String, Object> getModel(String id) {
        return modelConfigs.stream()
                .filter(m -> id != null && id.equals(m.get("id")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Model not found: " + id));
    }

    public Map<String, Object> updateModel(ModelUpdateRequest request) {
        if (request == null || !StringUtils.hasText(request.getId())) {
            throw new IllegalArgumentException("Model id is required");
        }

        Map<String, Object> model = getModel(request.getId());

        if (request.getEnabled() != null) {
            model.put("enabled", request.getEnabled());
        }
        if (request.getConfidence() != null) {
            model.put("confidence", request.getConfidence());
        }
        if (request.getPriority() != null) {
            model.put("priority", request.getPriority());
        }
        if (StringUtils.hasText(request.getDescription())) {
            model.put("description", request.getDescription());
        }

        model.put("update_time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        log.info("Model {} updated", request.getId());

        return model;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> testModel(String id, String sampleData) {
        Map<String, Object> model = getModel(id);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("modelId", id);
        result.put("modelName", model.get("name"));
        result.put("modelType", model.get("type"));
        result.put("sensitiveType", model.get("sensitive_type"));
        result.put("sampleData", sampleData);
        result.put("testTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        if (!Boolean.TRUE.equals(model.get("enabled"))) {
            result.put("detected", false);
            result.put("message", "Model is disabled");
            return result;
        }

        if (!StringUtils.hasText(sampleData)) {
            result.put("detected", false);
            result.put("message", "No sample data provided");
            return result;
        }

        String type = String.valueOf(model.getOrDefault("type", ""));
        if ("RULE".equals(type)) {
            // Test with regex pattern
            String pattern = String.valueOf(model.getOrDefault("pattern", ""));
            if (StringUtils.hasText(pattern)) {
                try {
                    boolean found = Pattern.compile(pattern).matcher(sampleData).find();
                    Double confidence = model.get("confidence") != null ? ((Number) model.get("confidence")).doubleValue() : 0.9;
                    result.put("detected", found);
                    result.put("confidence", found ? confidence : 0.0);
                    result.put("matchResult", found ? "Pattern matched" : "No match found");
                } catch (Exception e) {
                    result.put("detected", false);
                    result.put("error", "Pattern compilation failed: " + e.getMessage());
                }
            }
        } else if ("LLM".equals(type)) {
            // Simulate LLM detection
            result.put("detected", true);
            result.put("confidence", 0.85);
            result.put("matchResult", "LLM model analysis simulated - would require actual LLM service");
        } else {
            result.put("detected", false);
            result.put("message", "Unknown model type: " + type);
        }

        return result;
    }
}
