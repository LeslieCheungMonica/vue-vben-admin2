package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.dto.DataQueryRequest;
import com.asiainfo.crm.security.demo.dto.DetectionQueryRequest;
import com.asiainfo.crm.security.demo.dto.PageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.PostConstruct;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class DataService {

    private final ObjectMapper objectMapper;

    private List<Map<String, Object>> fullChainLogs = new ArrayList<>();
    private List<Map<String, Object>> detectionResults = new ArrayList<>();
    private List<Map<String, Object>> privacyInterfaceRisks = new ArrayList<>();

    public DataService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            fullChainLogs = loadJson("mock-data/full_chain_log.json");
            detectionResults = loadJson("mock-data/detection_results.json");
            privacyInterfaceRisks = loadJson("mock-data/privacy_interface_risk.json");
            log.info("Loaded mock data: {} logs, {} detections, {} risks",
                    fullChainLogs.size(), detectionResults.size(), privacyInterfaceRisks.size());
        } catch (Exception e) {
            log.error("Failed to load mock data", e);
        }
    }

    private List<Map<String, Object>> loadJson(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            InputStream is = resource.getInputStream();
            return objectMapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            log.error("Failed to load JSON from {}", path, e);
            return new ArrayList<>();
        }
    }

    public PageResponse<Map<String, Object>> queryLogList(DataQueryRequest request) {
        // Build a set of trace_ids that have been detected
        Set<String> detectedTraceIds = detectionResults.stream()
                .map(det -> String.valueOf(det.get("trace_id")))
                .collect(Collectors.toSet());

        List<Map<String, Object>> filtered = fullChainLogs.stream()
                .filter(log -> matchLogFilter(log, request, detectedTraceIds))
                .map(log -> {
                    // Enrich each log with detect_status based on whether it appears in detection results
                    Map<String, Object> enriched = new LinkedHashMap<>(log);
                    enriched.put("detect_status", detectedTraceIds.contains(String.valueOf(log.get("trace_id"))) ? "1" : "0");
                    return enriched;
                })
                .collect(Collectors.toList());

        return paginate(filtered, request.getPageNum(), request.getPageSize());
    }

    public Map<String, Object> getLogDetail(String traceId) {
        Map<String, Object> log = fullChainLogs.stream()
                .filter(l -> traceId != null && traceId.equals(l.get("trace_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Log not found: " + traceId));

        // Enrich with detect_status
        Set<String> detectedTraceIds = detectionResults.stream()
                .map(det -> String.valueOf(det.get("trace_id")))
                .collect(Collectors.toSet());

        Map<String, Object> enriched = new LinkedHashMap<>(log);
        enriched.put("detect_status", detectedTraceIds.contains(traceId) ? "1" : "0");
        return enriched;
    }

    public PageResponse<Map<String, Object>> queryDetectionList(DetectionQueryRequest request) {
        List<Map<String, Object>> filtered = detectionResults.stream()
                .filter(det -> matchDetectionFilter(det, request))
                .collect(Collectors.toList());

        return paginate(filtered, request.getPageNum(), request.getPageSize());
    }

    public Map<String, Object> getDetectionDetail(String id) {
        return detectionResults.stream()
                .filter(det -> id != null && id.equals(det.get("id")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Detection not found: " + id));
    }

    /**
     * 根据 trace_id 查找检测结果列表（一条日志可能对应多条检测记录）
     */
    public List<Map<String, Object>> getDetectionByTraceId(String traceId) {
        return detectionResults.stream()
                .filter(det -> traceId != null && traceId.equals(det.get("trace_id")))
                .collect(Collectors.toList());
    }

    public PageResponse<Map<String, Object>> queryRiskList(int pageNum, int pageSize) {
        return paginate(privacyInterfaceRisks, pageNum, pageSize);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalLogs", fullChainLogs.size());
        stats.put("totalDetections", detectionResults.size());
        stats.put("totalRisks", privacyInterfaceRisks.size());

        // Risk level distribution
        Map<String, Long> riskDistribution = privacyInterfaceRisks.stream()
                .collect(Collectors.groupingBy(
                        r -> String.valueOf(r.getOrDefault("risk_level", "UNKNOWN")),
                        Collectors.counting()));
        stats.put("riskDistribution", riskDistribution);

        // Sensitive type distribution from detection results
        Map<String, Long> sensitiveTypeDistribution = new LinkedHashMap<>();
        for (Map<String, Object> det : detectionResults) {
            Object types = det.get("sensitive_types");
            if (types instanceof List) {
                for (Object type : (List<?>) types) {
                    sensitiveTypeDistribution.merge(String.valueOf(type), 1L, Long::sum);
                }
            }
        }
        stats.put("sensitiveTypeDistribution", sensitiveTypeDistribution);

        // Detection source distribution
        Map<String, Long> detectSourceDistribution = detectionResults.stream()
                .collect(Collectors.groupingBy(
                        d -> String.valueOf(d.getOrDefault("detect_source", "UNKNOWN")),
                        Collectors.counting()));
        stats.put("detectSourceDistribution", detectSourceDistribution);

        // Deal status distribution
        Map<String, Long> dealStatusDistribution = detectionResults.stream()
                .collect(Collectors.groupingBy(
                        d -> String.valueOf(d.getOrDefault("deal_status", "0")),
                        Collectors.counting()));
        stats.put("dealStatusDistribution", dealStatusDistribution);

        // Top risky APIs
        List<Map<String, Object>> topRiskyApis = privacyInterfaceRisks.stream()
                .sorted((a, b) -> {
                    int scoreA = a.get("risk_score") != null ? ((Number) a.get("risk_score")).intValue() : 0;
                    int scoreB = b.get("risk_score") != null ? ((Number) b.get("risk_score")).intValue() : 0;
                    return Integer.compare(scoreB, scoreA);
                })
                .limit(5)
                .collect(Collectors.toList());
        stats.put("topRiskyApis", topRiskyApis);

        return stats;
    }

    public List<Map<String, Object>> getFullChainLogs() {
        return fullChainLogs;
    }

    public List<Map<String, Object>> getDetectionResults() {
        return detectionResults;
    }

    public List<Map<String, Object>> getPrivacyInterfaceRisks() {
        return privacyInterfaceRisks;
    }

    /**
     * 新增一条日志记录（补全字段），并加入内存数据集
     */
    public Map<String, Object> addLogRecord(Map<String, Object> logData) {
        // 补全必要字段
        if (!logData.containsKey("trace_id")) {
            logData.put("trace_id", "trace_manual_" + System.currentTimeMillis());
        }
        if (!logData.containsKey("span_id")) {
            logData.put("span_id", "span_manual");
        }
        if (!logData.containsKey("dt")) {
            logData.put("dt", java.time.LocalDate.now().toString());
        }
        if (!logData.containsKey("event_id")) {
            logData.put("event_id", "evt_manual_" + System.currentTimeMillis());
        }
        if (!logData.containsKey("create_time")) {
            logData.put("create_time", java.time.LocalDateTime.now().format(
                    java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (!logData.containsKey("request_result")) {
            logData.put("request_result", "0");
        }
        if (!logData.containsKey("response_status")) {
            logData.put("response_status", 200);
        }

        fullChainLogs.add(logData);
        log.info("Added manual log record: trace_id={}", logData.get("trace_id"));
        return logData;
    }

    /**
     * 将 LLM 检测结果写入检测列表
     */
    public void addDetectionRecord(Map<String, Object> logRecord, LlmService.PrivacyDetectResult llmResult) {
        if (llmResult == null || !llmResult.isHas_sensitive()) return;

        Map<String, Object> detection = new LinkedHashMap<>();
        detection.put("id", "det_llm_" + System.currentTimeMillis());
        detection.put("trace_id", logRecord.get("trace_id"));
        detection.put("event_id", logRecord.get("event_id"));
        detection.put("api_path", logRecord.get("api_path"));
        detection.put("op_id", logRecord.get("create_op_id"));
        detection.put("op_name", "");
        detection.put("detect_time", java.time.LocalDateTime.now().format(
                java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        detection.put("detect_source", "LLM");

        List<String> types = new ArrayList<>();
        List<Map<String, Object>> details = new ArrayList<>();
        if (llmResult.getItems() != null) {
            for (LlmService.SensitiveItem item : llmResult.getItems()) {
                types.add(item.getType());
                Map<String, Object> detail = new LinkedHashMap<>();
                detail.put("type", item.getType());
                detail.put("field", item.getField());
                detail.put("value", item.getValue());
                detail.put("confidence", item.getConfidence());
                detail.put("source", "LLM");
                details.add(detail);
            }
        }
        detection.put("sensitive_types", types);
        detection.put("sensitive_details", details);
        detection.put("risk_level", types.size() >= 3 ? "CRITICAL" : types.size() >= 2 ? "HIGH" : "MEDIUM");
        detection.put("deal_status", "0");

        detectionResults.add(detection);
        log.info("Added LLM detection record: {} sensitive types found", types.size());
    }

    private boolean matchLogFilter(Map<String, Object> log, DataQueryRequest request, Set<String> detectedTraceIds) {
        if (request == null) return true;

        if (StringUtils.hasText(request.getDateStart())) {
            String dt = String.valueOf(log.getOrDefault("dt", ""));
            if (dt.compareTo(request.getDateStart()) < 0) return false;
        }
        if (StringUtils.hasText(request.getDateEnd())) {
            String dt = String.valueOf(log.getOrDefault("dt", ""));
            if (dt.compareTo(request.getDateEnd()) > 0) return false;
        }
        if (StringUtils.hasText(request.getApiPath())) {
            String apiPath = String.valueOf(log.getOrDefault("api_path", ""));
            if (!apiPath.contains(request.getApiPath())) return false;
        }
        if (StringUtils.hasText(request.getOpId())) {
            String opId = String.valueOf(log.getOrDefault("create_op_id", ""));
            if (!opId.equals(request.getOpId())) return false;
        }
        if (StringUtils.hasText(request.getDetectStatus())) {
            String traceId = String.valueOf(log.get("trace_id"));
            boolean isDetected = detectedTraceIds.contains(traceId);
            if ("1".equals(request.getDetectStatus()) && !isDetected) return false;
            if ("0".equals(request.getDetectStatus()) && isDetected) return false;
        }
        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean matchDetectionFilter(Map<String, Object> det, DetectionQueryRequest request) {
        if (request == null) return true;

        if (StringUtils.hasText(request.getRiskLevel())) {
            String level = String.valueOf(det.getOrDefault("risk_level", ""));
            if (!level.equals(request.getRiskLevel())) return false;
        }
        if (StringUtils.hasText(request.getSensitiveType())) {
            Object types = det.get("sensitive_types");
            if (types instanceof List) {
                boolean found = ((List<String>) types).stream()
                        .anyMatch(t -> t.contains(request.getSensitiveType()));
                if (!found) return false;
            }
        }
        if (StringUtils.hasText(request.getOpId())) {
            String opId = String.valueOf(det.getOrDefault("op_id", ""));
            if (!opId.equals(request.getOpId())) return false;
        }
        if (StringUtils.hasText(request.getDateStart())) {
            String dt = String.valueOf(det.getOrDefault("detect_time", ""));
            if (dt.compareTo(request.getDateStart()) < 0) return false;
        }
        if (StringUtils.hasText(request.getDateEnd())) {
            String dt = String.valueOf(det.getOrDefault("detect_time", ""));
            if (dt.compareTo(request.getDateEnd()) > 0) return false;
        }
        return true;
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
