package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.dto.KnowledgeAddRequest;
import com.asiainfo.crm.security.demo.dto.KnowledgeSearchRequest;
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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
public class KnowledgeService {

    private final ObjectMapper objectMapper;
    private final DataService dataService;
    private List<Map<String, Object>> knowledgeBase = new ArrayList<>();
    private final AtomicInteger knowledgeCounter = new AtomicInteger(0);

    public KnowledgeService(ObjectMapper objectMapper, DataService dataService) {
        this.objectMapper = objectMapper;
        this.dataService = dataService;
    }

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("mock-data/knowledge_base.json");
            InputStream is = resource.getInputStream();
            knowledgeBase = objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});

            // Determine max id number
            int maxId = knowledgeBase.stream()
                    .map(k -> String.valueOf(k.getOrDefault("id", "kb_000")))
                    .filter(id -> id.startsWith("kb_"))
                    .mapToInt(id -> {
                        try {
                            return Integer.parseInt(id.substring(3));
                        } catch (NumberFormatException e) {
                            return 0;
                        }
                    })
                    .max().orElse(0);
            knowledgeCounter.set(maxId);

            log.info("Loaded {} knowledge base entries", knowledgeBase.size());
        } catch (Exception e) {
            log.error("Failed to load knowledge base", e);
        }
    }

    public PageResponse<Map<String, Object>> listKnowledge(KnowledgeSearchRequest request) {
        List<Map<String, Object>> filtered = knowledgeBase.stream()
                .filter(k -> {
                    if (StringUtils.hasText(request.getCategory())) {
                        String category = String.valueOf(k.getOrDefault("category", ""));
                        if (!category.equals(request.getCategory())) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        return paginate(filtered, request.getPageNum(), request.getPageSize());
    }

    public Map<String, Object> getKnowledge(String id) {
        return knowledgeBase.stream()
                .filter(k -> id != null && id.equals(k.get("id")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Knowledge not found: " + id));
    }

    public Map<String, Object> addKnowledge(KnowledgeAddRequest request) {
        if (request == null || !StringUtils.hasText(request.getTitle())) {
            throw new IllegalArgumentException("Title is required");
        }

        String id = "kb_" + String.format("%03d", knowledgeCounter.incrementAndGet());
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id", id);
        entry.put("title", request.getTitle());
        entry.put("category", StringUtils.hasText(request.getCategory()) ? request.getCategory() : "CUSTOM");
        entry.put("content", request.getContent());
        entry.put("tags", request.getTags() != null ? request.getTags() : new ArrayList<>());
        entry.put("source", StringUtils.hasText(request.getSource()) ? request.getSource() : "User Input");
        entry.put("create_time", now);

        knowledgeBase.add(entry);
        log.info("Knowledge added: {}", id);

        return entry;
    }

    public PageResponse<Map<String, Object>> searchKnowledge(KnowledgeSearchRequest request) {
        String keyword = request.getKeyword();
        List<Map<String, Object>> filtered = knowledgeBase.stream()
                .filter(k -> {
                    if (!StringUtils.hasText(keyword)) return true;

                    String title = String.valueOf(k.getOrDefault("title", "")).toLowerCase();
                    String content = String.valueOf(k.getOrDefault("content", "")).toLowerCase();
                    String lowerKeyword = keyword.toLowerCase();

                    if (title.contains(lowerKeyword) || content.contains(lowerKeyword)) {
                        return true;
                    }

                    // Also search in tags
                    Object tags = k.get("tags");
                    if (tags instanceof List) {
                        for (Object tag : (List<?>) tags) {
                            if (String.valueOf(tag).toLowerCase().contains(lowerKeyword)) {
                                return true;
                            }
                        }
                    }

                    return false;
                })
                .filter(k -> {
                    if (StringUtils.hasText(request.getCategory())) {
                        String category = String.valueOf(k.getOrDefault("category", ""));
                        return category.equals(request.getCategory());
                    }
                    return true;
                })
                .collect(Collectors.toList());

        return paginate(filtered, request.getPageNum(), request.getPageSize());
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> enhanceKnowledge() {
        log.info("Starting knowledge enhancement from detection results...");

        List<Map<String, Object>> detections = dataService.getDetectionResults();
        List<Map<String, Object>> newEntries = new ArrayList<>();

        // Analyze detection patterns by sensitive type
        Map<String, List<Map<String, Object>>> byType = new LinkedHashMap<>();
        for (Map<String, Object> det : detections) {
            Object types = det.get("sensitive_types");
            if (types instanceof List) {
                for (Object type : (List<?>) types) {
                    byType.computeIfAbsent(String.valueOf(type), k -> new ArrayList<>()).add(det);
                }
            }
        }

        // Generate knowledge entries for each sensitive type pattern
        for (Map.Entry<String, List<Map<String, Object>>> entry : byType.entrySet()) {
            String type = entry.getKey();
            List<Map<String, Object>> typeDetections = entry.getValue();

            Set<String> apiPaths = typeDetections.stream()
                    .map(d -> String.valueOf(d.getOrDefault("api_path", "")))
                    .collect(Collectors.toSet());

            Set<String> riskLevels = typeDetections.stream()
                    .map(d -> String.valueOf(d.getOrDefault("risk_level", "")))
                    .collect(Collectors.toSet());

            String title = type + "敏感信息检测模式总结";
            String category = "DETECTION_PATTERN";

            StringBuilder contentBuilder = new StringBuilder();
            contentBuilder.append("基于检测结果分析，").append(type).append("类型敏感信息在以下接口中被检测到：\n");
            for (String api : apiPaths) {
                contentBuilder.append("- ").append(api).append("\n");
            }
            contentBuilder.append("风险等级分布：").append(riskLevels).append("\n");
            contentBuilder.append("检测次数：").append(typeDetections.size()).append("次\n");
            contentBuilder.append("建议：对该类型敏感信息在接口响应中实施统一脱敏规则。");

            List<String> tags = new ArrayList<>();
            tags.add(type);
            tags.add("自动生成");
            tags.add("检测模式");

            KnowledgeAddRequest addRequest = new KnowledgeAddRequest();
            addRequest.setTitle(title);
            addRequest.setCategory(category);
            addRequest.setContent(contentBuilder.toString());
            addRequest.setTags(tags);
            addRequest.setSource("RAG自动增强");

            Map<String, Object> newEntry = addKnowledge(addRequest);
            newEntries.add(newEntry);
        }

        // Generate cross-type analysis
        if (byType.size() > 1) {
            String crossTitle = "多类型敏感信息组合泄露风险分析";
            StringBuilder crossContent = new StringBuilder();
            crossContent.append("分析发现").append(byType.size()).append("种敏感信息类型同时出现在系统接口中：\n");
            for (Map.Entry<String, List<Map<String, Object>>> e : byType.entrySet()) {
                crossContent.append("- ").append(e.getKey()).append(" (").append(e.getValue().size()).append("次检测)\n");
            }
            crossContent.append("多种敏感信息的组合出现增加了个人信息泄露的严重程度，建议对涉及多类型敏感信息的接口实施更严格的访问控制和脱敏策略。");

            KnowledgeAddRequest crossRequest = new KnowledgeAddRequest();
            crossRequest.setTitle(crossTitle);
            crossRequest.setCategory("RISK_ANALYSIS");
            crossRequest.setContent(crossContent.toString());
            crossRequest.setTags(Arrays.asList("组合风险", "自动生成", "多类型分析"));
            crossRequest.setSource("RAG自动增强");

            Map<String, Object> crossEntry = addKnowledge(crossRequest);
            newEntries.add(crossEntry);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalEnhanced", newEntries.size());
        result.put("newEntries", newEntries);
        result.put("enhanceTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        log.info("Knowledge enhancement completed, {} new entries generated", newEntries.size());

        return result;
    }

    private <T> PageResponse<T> paginate(List<T> list, int pageNum, int pageSize) {
        int total = list.size();
        int fromIndex = (pageNum - 1) * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, total);

        List<T> page;
        if (fromIndex >= total) {
            page = new ArrayList<>();
        } else {
            page = list.subList(fromIndex, toIndex);
        }

        return PageResponse.<T>builder()
                .total((long) total)
                .list(page)
                .build();
    }
}
