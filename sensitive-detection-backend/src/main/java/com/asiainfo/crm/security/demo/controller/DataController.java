package com.asiainfo.crm.security.demo.controller;

import com.asiainfo.crm.security.demo.dto.DataQueryRequest;
import com.asiainfo.crm.security.demo.dto.DetectionQueryRequest;
import com.asiainfo.crm.security.demo.dto.PageResponse;
import com.asiainfo.crm.security.demo.framework.Result;
import com.asiainfo.crm.security.demo.service.DataService;
import com.asiainfo.crm.security.demo.service.LlmService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/data")
public class DataController {

    private final DataService dataService;
    private final LlmService llmService;

    public DataController(DataService dataService, LlmService llmService) {
        this.dataService = dataService;
        this.llmService = llmService;
    }

    @PostMapping("/logList")
    public Result<PageResponse<Map<String, Object>>> logList(@RequestBody DataQueryRequest request) {
        log.info("Query log list, page={}, size={}", request.getPageNum(), request.getPageSize());
        PageResponse<Map<String, Object>> result = dataService.queryLogList(request);
        return Result.success(result);
    }

    @PostMapping("/logDetail")
    public Result<Map<String, Object>> logDetail(@RequestBody Map<String, String> params) {
        String traceId = params.get("traceId");
        log.info("Query log detail, traceId={}", traceId);
        Map<String, Object> detail = dataService.getLogDetail(traceId);
        return Result.success(detail);
    }

    @PostMapping("/detectionList")
    public Result<PageResponse<Map<String, Object>>> detectionList(@RequestBody DetectionQueryRequest request) {
        log.info("Query detection list, page={}, size={}", request.getPageNum(), request.getPageSize());
        PageResponse<Map<String, Object>> result = dataService.queryDetectionList(request);
        return Result.success(result);
    }

    @PostMapping("/detectionDetail")
    public Result<Map<String, Object>> detectionDetail(@RequestBody Map<String, String> params) {
        String id = params.get("id");
        log.info("Query detection detail, id={}", id);
        Map<String, Object> detail = dataService.getDetectionDetail(id);
        return Result.success(detail);
    }

    @PostMapping("/detectionByTraceId")
    public Result<List<Map<String, Object>>> detectionByTraceId(@RequestBody Map<String, String> params) {
        String traceId = params.get("traceId");
        log.info("Query detection by traceId, traceId={}", traceId);
        List<Map<String, Object>> list = dataService.getDetectionByTraceId(traceId);
        return Result.success(list);
    }

    @PostMapping("/riskList")
    public Result<PageResponse<Map<String, Object>>> riskList(@RequestBody Map<String, Object> params) {
        int pageNum = params.get("pageNum") != null ? ((Number) params.get("pageNum")).intValue() : 1;
        int pageSize = params.get("pageSize") != null ? ((Number) params.get("pageSize")).intValue() : 10;
        log.info("Query risk list, page={}, size={}", pageNum, pageSize);
        PageResponse<Map<String, Object>> result = dataService.queryRiskList(pageNum, pageSize);
        return Result.success(result);
    }

    @PostMapping("/statistics")
    public Result<Map<String, Object>> statistics(@RequestBody(required = false) Map<String, Object> params) {
        log.info("Query statistics");
        Map<String, Object> stats = dataService.getStatistics();
        return Result.success(stats);
    }

    /**
     * 对单条已有日志进行 LLM 检测，并将结果写入 detectionResults
     */
    @PostMapping("/detectLog")
    public Result<Map<String, Object>> detectLog(@RequestBody Map<String, String> params) {
        String traceId = params.get("traceId");
        log.info("Detect single log: traceId={}", traceId);

        Map<String, Object> logRecord = dataService.getLogDetail(traceId);
        String responseStr = String.valueOf(logRecord.getOrDefault("response", ""));

        Map<String, Object> detectResult = new LinkedHashMap<>();
        detectResult.put("trace_id", traceId);
        detectResult.put("api_path", logRecord.get("api_path"));

        // 规则引擎检测
        List<Map<String, Object>> ruleHits = ruleBasedDetect(responseStr);
        detectResult.put("ruleDetect", ruleHits);

        // LLM 检测
        if (llmService.isEnabled() && responseStr.length() > 2) {
            LlmService.PrivacyDetectResult llmResult = llmService.detectPrivacy(responseStr);
            if (llmResult != null) {
                detectResult.put("llmDetect", llmResult);
                if (llmResult.isHas_sensitive()) {
                    // 将检测结果写入 detectionResults，下次查询该日志即为"已检测"
                    dataService.addDetectionRecord(logRecord, llmResult);
                }
            } else {
                detectResult.put("llmDetect", Collections.singletonMap("error", "LLM调用失败"));
            }
        } else {
            detectResult.put("llmDetect", Collections.singletonMap("error", "LLM未启用"));
        }

        return Result.success(detectResult);
    }

    /**
     * 新增一条日志数据并用 LLM 检测敏感信息
     */
    @PostMapping("/addAndDetect")
    public Result<Map<String, Object>> addAndDetect(@RequestBody Map<String, Object> logData) {
        log.info("Add log and detect: apiPath={}", logData.get("api_path"));

        // 1. 补全字段并加入数据集
        Map<String, Object> record = dataService.addLogRecord(logData);

        // 2. 对 response 字段调用 LLM 检测
        Map<String, Object> detectResult = new LinkedHashMap<>();
        detectResult.put("logRecord", record);

        String responseStr = String.valueOf(record.getOrDefault("response", ""));
        if (llmService.isEnabled() && responseStr.length() > 2) {
            LlmService.PrivacyDetectResult llmResult = llmService.detectPrivacy(responseStr);
            detectResult.put("llmDetect", llmResult != null ? llmResult : Collections.singletonMap("error", "LLM检测失败，已降级为规则检测"));
        }

        // 3. 规则引擎检测（兜底/补充）
        List<Map<String, Object>> ruleResults = ruleBasedDetect(responseStr);
        detectResult.put("ruleDetect", ruleResults);

        return Result.success(detectResult);
    }

    /**
     * 批量复检：支持全量或按接口路径筛选，调用 LLM 重新检测
     */
    @PostMapping("/batchRecheck")
    public Result<Map<String, Object>> batchRecheck(@RequestBody Map<String, Object> params) {
        @SuppressWarnings("unchecked")
        List<String> traceIds = (List<String>) params.get("traceIds");
        String apiPathFilter = (String) params.get("apiPath");

        // Build list of trace IDs to recheck
        if ((traceIds == null || traceIds.isEmpty()) && apiPathFilter == null) {
            // 全量复检
            traceIds = new ArrayList<>();
            for (Map<String, Object> log : dataService.getFullChainLogs()) {
                traceIds.add(String.valueOf(log.get("trace_id")));
            }
        } else if (apiPathFilter != null && !apiPathFilter.isEmpty()) {
            // 按接口路径筛选
            traceIds = new ArrayList<>();
            for (Map<String, Object> log : dataService.getFullChainLogs()) {
                String logApiPath = String.valueOf(log.getOrDefault("api_path", ""));
                if (logApiPath.contains(apiPathFilter)) {
                    traceIds.add(String.valueOf(log.get("trace_id")));
                }
            }
        }

        if (traceIds == null) {
            traceIds = new ArrayList<>();
        }

        log.info("Batch recheck: {} records, llmEnabled={}", traceIds.size(), llmService.isEnabled());

        int total = traceIds.size();
        int detected = 0;
        int noSensitive = 0;
        int llmSuccess = 0;
        int llmFail = 0;
        List<Map<String, Object>> details = new ArrayList<>();

        for (String traceId : traceIds) {
            try {
                Map<String, Object> log = dataService.getLogDetail(traceId);
                String responseStr = String.valueOf(log.getOrDefault("response", ""));

                Map<String, Object> item = new LinkedHashMap<>();
                item.put("trace_id", traceId);
                item.put("api_path", log.get("api_path"));

                // 规则检测
                List<Map<String, Object>> ruleHits = ruleBasedDetect(responseStr);
                item.put("ruleHits", ruleHits);

                // LLM 检测
                if (llmService.isEnabled() && responseStr.length() > 2) {
                    LlmService.PrivacyDetectResult llmResult = llmService.detectPrivacy(responseStr);
                    if (llmResult != null) {
                        item.put("llmDetect", llmResult);
                        llmSuccess++;
                        if (llmResult.isHas_sensitive()) {
                            detected++;
                            // 将 LLM 检测结果写入检测列表
                            dataService.addDetectionRecord(log, llmResult);
                        } else {
                            noSensitive++;
                        }
                    } else {
                        item.put("llmDetect", Collections.singletonMap("error", "LLM调用失败"));
                        llmFail++;
                    }
                } else {
                    // 无 LLM 时仅用规则
                    if (!ruleHits.isEmpty()) {
                        detected++;
                    } else {
                        noSensitive++;
                    }
                }

                details.add(item);
            } catch (Exception e) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("trace_id", traceId);
                item.put("error", e.getMessage());
                details.add(item);
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total", total);
        summary.put("detected", detected);
        summary.put("noSensitive", noSensitive);
        summary.put("llmSuccess", llmSuccess);
        summary.put("llmFail", llmFail);
        summary.put("llmEnabled", llmService.isEnabled());
        summary.put("details", details);

        return Result.success(summary);
    }

    /**
     * 基于规则引擎的敏感信息检测
     */
    private List<Map<String, Object>> ruleBasedDetect(String text) {
        List<Map<String, Object>> hits = new ArrayList<>();
        if (text == null || text.isEmpty()) return hits;

        // 手机号: 1[3-9]开头的11位数字
        if (text.matches(".*1[3-9]\\d{9}.*")) {
            hits.add(createHit("PHONE", "正则匹配手机号", 0.98, "RULE"));
        }
        // 身份证: 18位
        if (text.matches(".*[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx].*")) {
            hits.add(createHit("ID_CARD", "正则匹配身份证号", 0.99, "RULE"));
        }
        // 银行卡: 16-19位纯数字
        if (text.matches(".*\\b\\d{16,19}\\b.*")) {
            hits.add(createHit("BANK_CARD", "正则匹配银行卡号", 0.85, "RULE"));
        }
        // 邮箱
        if (text.matches(".*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}.*")) {
            hits.add(createHit("EMAIL", "正则匹配邮箱地址", 0.95, "RULE"));
        }
        return hits;
    }

    private Map<String, Object> createHit(String type, String reason, double confidence, String source) {
        Map<String, Object> hit = new LinkedHashMap<>();
        hit.put("type", type);
        hit.put("reason", reason);
        hit.put("confidence", confidence);
        hit.put("source", source);
        return hit;
    }
}
