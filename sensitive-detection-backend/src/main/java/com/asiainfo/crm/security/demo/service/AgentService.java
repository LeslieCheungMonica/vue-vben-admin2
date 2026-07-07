package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.dto.ChatRequest;
import com.asiainfo.crm.security.demo.dto.ChatResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
public class AgentService {

    private final DataService dataService;
    private final LlmService llmService;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public AgentService(DataService dataService, LlmService llmService, ObjectMapper objectMapper) {
        this.dataService = dataService;
        this.llmService = llmService;
        this.objectMapper = objectMapper;
    }

    public ChatResponse chatSync(ChatRequest request) {
        String message = request.getMessage();
        // Execute the full pipeline synchronously, collect all data, then let LLM answer
        String collectedData = collectDataForQuestion(message);
        String answer;
        if (llmService.isEnabled()) {
            answer = llmService.agentChat(message, collectedData);
            if (answer == null) answer = generateStaticAnswer(message);
        } else {
            answer = generateStaticAnswer(message);
        }
        return ChatResponse.builder().type("answer").content(answer).build();
    }

    public SseEmitter chatStream(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(180000L);
        executor.execute(() -> {
            try {
                String message = request.getMessage();

                // Step 1: Thinking — let LLM describe what it's analyzing
                sendEvent(emitter, "thinking", generateThinking(message));
                Thread.sleep(500);

                // Step 2: Determine which tools to call based on question analysis
                List<ToolStep> toolsToCall = planToolCalls(message);

                // Step 3-4: Execute each tool, send SSE events
                StringBuilder allToolResults = new StringBuilder();
                for (int i = 0; i < toolsToCall.size(); i++) {
                    ToolStep step = toolsToCall.get(i);

                    // Analysis: which tool we're calling and why
                    sendEvent(emitter, "analysis", step.description);
                    Thread.sleep(300);

                    // Data: execute the tool and show real results
                    String result = executeTool(step.toolName);
                    sendEvent(emitter, "data", result);
                    Thread.sleep(300);

                    allToolResults.append("\n---\n工具: ").append(step.toolName).append("\n结果:\n").append(result);
                }

                // Step 5: Generate final answer — use LLM with all collected data
                String answer;
                if (llmService.isEnabled()) {
                    sendEvent(emitter, "thinking", "正在综合分析所有数据，生成回答...");
                    Thread.sleep(200);
                    String fullContext = buildFullSystemContext() + allToolResults.toString();
                    answer = llmService.agentChat(message, fullContext);
                    if (answer == null) answer = generateStaticAnswer(message);
                } else {
                    answer = generateStaticAnswer(message);
                }

                sendEvent(emitter, "answer", answer);
                sendEvent(emitter, "done", "");
                emitter.complete();
            } catch (Exception e) {
                log.error("SSE error", e);
                try { emitter.completeWithError(e); } catch (Exception ignored) {}
            }
        });
        emitter.onTimeout(() -> log.warn("SSE timeout"));
        return emitter;
    }

    // ==================== Thinking Generation ====================

    private String generateThinking(String message) {
        // Use LLM to generate a natural thinking description
        if (llmService.isEnabled()) {
            String prompt = "用户问了一个关于敏感信息检测系统的问题：\"" + message + "\"\n" +
                    "请用1-2句话简要描述你正在分析什么。例如：" +
                    "\"正在分析用户关于数据概况的问题，需要先获取系统统计数据和近期检测趋势\"。只输出思考描述，不要输出其他内容。";
            String result = llmService.chat("你是敏感信息检测系统的智能安全助手，正在分析用户问题。", prompt);
            if (result != null && !result.isEmpty()) {
                // Clean up — remove possible quotes or extra formatting
                return result.trim().replaceAll("^\"|\"$", "").replaceAll("^「|」$", "");
            }
        }
        // Fallback
        if (containsAny(message, "数据", "情况", "概况", "统计", "今天")) return "正在分析用户关于数据概况的问题，需要查询系统统计数据和近期检测趋势";
        if (containsAny(message, "高危", "风险", "接口")) return "正在定位高危接口，需要查询风险接口列表和关联检测详情";
        if (containsAny(message, "敏感", "分布", "类型")) return "正在分析敏感信息分布，需要查询各类型的检测统计和风险等级分布";
        if (containsAny(message, "建议", "安全", "整改")) return "正在评估整体安全状况，需要先了解风险概况再制定针对性建议";
        return "正在分析用户问题，确定需要查询的数据范围";
    }

    // ==================== Tool Call Planning ====================

    private static class ToolStep {
        String toolName;
        String description;
        ToolStep(String toolName, String description) {
            this.toolName = toolName;
            this.description = description;
        }
    }

    private List<ToolStep> planToolCalls(String message) {
        List<ToolStep> steps = new ArrayList<>();

        if (containsAny(message, "数据", "情况", "概况", "统计", "今天", "概览", "总")) {
            steps.add(new ToolStep("query_statistics", "查询系统统计数据 — 日志总量、检测数量、风险接口数"));
            steps.add(new ToolStep("query_detections", "查询近期检测结果 — 了解敏感信息检出趋势"));
        }

        if (containsAny(message, "高危", "风险", "接口", "危险")) {
            steps.add(new ToolStep("query_risk_interfaces", "查询风险接口列表 — 按风险分数排序获取高危接口"));
            if (!containsAny(message, "数据", "情况", "概况", "统计")) {
                steps.add(new ToolStep("query_statistics", "查询系统统计数据 — 作为风险评估的上下文"));
            }
        }

        if (containsAny(message, "敏感", "分布", "类型", "信息") && !containsAny(message, "高危", "风险", "接口")) {
            steps.add(new ToolStep("query_detection_by_type", "按敏感类型统计检测分布 — 各类型检出频次"));
            steps.add(new ToolStep("query_detections", "查询检测结果详情 — 关联风险等级和检测来源"));
        }

        if (containsAny(message, "建议", "安全", "整改", "处理", "改进", "优化")) {
            if (steps.isEmpty()) {
                steps.add(new ToolStep("query_statistics", "查询系统统计数据 — 了解整体风险状况"));
            }
            steps.add(new ToolStep("query_risk_interfaces", "查询风险接口列表 — 定位主要风险来源"));
        }

        // If no specific question matched, do a general overview
        if (steps.isEmpty()) {
            steps.add(new ToolStep("query_statistics", "查询系统统计数据 — 获取系统整体概况"));
            steps.add(new ToolStep("query_detections", "查询检测结果列表 — 了解检测发现"));
        }

        return steps;
    }

    // ==================== Tool Execution ====================

    @SuppressWarnings("unchecked")
    private String executeTool(String toolName) {
        try {
            StringBuilder sb = new StringBuilder();

            if (toolName.equals("query_statistics")) {
                Map<String, Object> stats = dataService.getStatistics();
                sb.append("系统统计数据：\n");
                sb.append("  总日志数: ").append(stats.get("totalLogs")).append("\n");
                sb.append("  检测结果数: ").append(stats.get("totalDetections")).append("\n");
                sb.append("  风险接口数: ").append(stats.get("totalRisks")).append("\n");
                if (stats.get("riskDistribution") instanceof Map) {
                    sb.append("  风险等级分布: ").append(formatMap((Map<String, Object>) stats.get("riskDistribution"))).append("\n");
                }
                if (stats.get("sensitiveTypeDistribution") instanceof Map) {
                    sb.append("  敏感类型分布: ").append(formatMap((Map<String, Object>) stats.get("sensitiveTypeDistribution"))).append("\n");
                }
                if (stats.get("dealStatusDistribution") instanceof Map) {
                    sb.append("  确认状态分布: ").append(formatMap((Map<String, Object>) stats.get("dealStatusDistribution"))).append("\n");
                }

            } else if (toolName.equals("query_risk_interfaces")) {
                List<Map<String, Object>> risks = dataService.getPrivacyInterfaceRisks();
                sb.append("风险接口列表（共").append(risks.size()).append("个）：\n");
                risks.stream().sorted((a, b) -> {
                    int sa = a.get("risk_score") != null ? ((Number) a.get("risk_score")).intValue() : 0;
                    int sb2 = b.get("risk_score") != null ? ((Number) b.get("risk_score")).intValue() : 0;
                    return Integer.compare(sb2, sa);
                }).forEach(r -> sb.append("  ").append(r.get("service_name"))
                        .append(" | ").append(r.get("risk_level"))
                        .append(" | 分数: ").append(r.get("risk_score"))
                        .append(" | 类型: ").append(r.get("sensitive_types")).append("\n"));

            } else if (toolName.equals("query_detections")) {
                List<Map<String, Object>> dets = dataService.getDetectionResults();
                sb.append("检测结果（共").append(dets.size()).append("条）：\n");
                dets.stream().limit(15).forEach(d -> sb.append("  ").append(d.get("api_path"))
                        .append(" | ").append(d.get("risk_level"))
                        .append(" | 类型: ").append(d.get("sensitive_types"))
                        .append(" | 来源: ").append(d.get("detect_source")).append("\n"));
                if (dets.size() > 15) sb.append("  ...及其他 ").append(dets.size() - 15).append(" 条\n");

            } else if (toolName.equals("query_logs")) {
                List<Map<String, Object>> logs = dataService.getFullChainLogs();
                sb.append("全链路日志（共").append(logs.size()).append("条，展示前10条）：\n");
                logs.stream().limit(10).forEach(l -> sb.append("  ").append(l.get("trace_id"))
                        .append(" | ").append(l.get("api_path"))
                        .append(" | 操作员: ").append(l.get("create_op_id")).append("\n"));

            } else if (toolName.equals("query_detection_by_type")) {
                List<Map<String, Object>> dets = dataService.getDetectionResults();
                Map<String, Long> typeCount = new LinkedHashMap<>();
                for (Map<String, Object> d : dets) {
                    Object types = d.get("sensitive_types");
                    if (types instanceof List) {
                        for (Object t : (List<?>) types) typeCount.merge(String.valueOf(t), 1L, Long::sum);
                    }
                }
                sb.append("按敏感类型统计：\n");
                typeCount.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .forEach(e -> sb.append("  ").append(e.getKey()).append(": ").append(e.getValue()).append("次\n"));

            } else {
                // Default: return statistics
                Map<String, Object> stats = dataService.getStatistics();
                sb.append("系统概况：日志 ").append(stats.get("totalLogs"))
                        .append(" 条，检测 ").append(stats.get("totalDetections"))
                        .append(" 条，风险接口 ").append(stats.get("totalRisks")).append(" 个\n");
            }
            return sb.toString();
        } catch (Exception e) {
            return "工具执行出错: " + e.getMessage();
        }
    }

    private String formatMap(Map<String, Object> map) {
        if (map == null) return "无";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(", ");
            sb.append(e.getKey()).append("=").append(e.getValue());
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }

    // ==================== SSE Helper ====================

    private void sendEvent(SseEmitter emitter, String type, String content) throws IOException {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("type", type);
        data.put("content", content);
        String json;
        try { json = objectMapper.writeValueAsString(data); }
        catch (Exception e) { json = "{\"type\":\"" + type + "\",\"content\":\"" + content.replace("\"", "'") + "\"}"; }
        emitter.send(SseEmitter.event().data(json));
    }

    // ==================== Data Collection ====================

    private String buildFullSystemContext() {
        StringBuilder sb = new StringBuilder();
        Map<String, Object> stats = dataService.getStatistics();
        sb.append("总日志数: ").append(stats.get("totalLogs"));
        sb.append(", 检测数: ").append(stats.get("totalDetections"));
        sb.append(", 风险接口数: ").append(stats.get("totalRisks"));
        sb.append("\n风险分布: ").append(stats.get("riskDistribution"));
        sb.append("\n敏感类型分布: ").append(stats.get("sensitiveTypeDistribution"));
        return sb.toString();
    }

    private String collectDataForQuestion(String message) {
        StringBuilder sb = new StringBuilder(buildFullSystemContext());
        List<ToolStep> tools = planToolCalls(message);
        for (ToolStep step : tools) {
            sb.append("\n---\n工具: ").append(step.toolName).append("\n结果:\n").append(executeTool(step.toolName));
        }
        return sb.toString();
    }

    // ==================== Static Answer Fallback ====================

    @SuppressWarnings("unchecked")
    private String generateStaticAnswer(String message) {
        StringBuilder sb = new StringBuilder("基于当前系统数据分析，为您提供以下信息:\n\n");
        List<Map<String, Object>> logs = dataService.getFullChainLogs();
        List<Map<String, Object>> dets = dataService.getDetectionResults();
        List<Map<String, Object>> risks = dataService.getPrivacyInterfaceRisks();

        if (containsAny(message, "今天","概况","统计","情况","总","数据")) {
            sb.append("## 数据概况\n");
            sb.append("- 全链路日志: ").append(logs.size()).append(" 条\n");
            sb.append("- 检测结果: ").append(dets.size()).append(" 条\n");
            sb.append("- 风险接口: ").append(risks.size()).append(" 个\n\n");
            long crit = risks.stream().filter(r -> "CRITICAL".equals(r.get("risk_level"))).count();
            long high = risks.stream().filter(r -> "HIGH".equals(r.get("risk_level"))).count();
            sb.append("## 风险摘要\n");
            sb.append("- CRITICAL: ").append(crit).append(" 个, HIGH: ").append(high).append(" 个\n\n");
            if (crit > 0) sb.append("**注意**: 存在CRITICAL级别风险！\n\n");
        }
        if (containsAny(message, "检测","敏感")) {
            Map<String, Long> tc = new LinkedHashMap<>();
            for (Map<String, Object> d : dets) { if (d.get("sensitive_types") instanceof List) for (Object t : (List<?>)d.get("sensitive_types")) tc.merge(String.valueOf(t), 1L, Long::sum); }
            sb.append("## 敏感信息检测\n共 ").append(dets.size()).append(" 条, 类型分布:\n");
            tc.entrySet().stream().sorted(Map.Entry.<String,Long>comparingByValue().reversed()).forEach(e -> sb.append("- ").append(e.getKey()).append(": ").append(e.getValue()).append("次\n"));
            sb.append("\n");
        }
        if (containsAny(message, "风险","高危","接口")) {
            sb.append("## 接口风险评估\n共 ").append(risks.size()).append(" 个风险接口\n");
            risks.stream().sorted((a,b) -> Integer.compare(b.get("risk_score") != null ? ((Number)b.get("risk_score")).intValue() : 0, a.get("risk_score") != null ? ((Number)a.get("risk_score")).intValue() : 0)).limit(5)
                    .forEach(r -> sb.append("- **").append(r.get("service_name")).append("** (").append(r.get("risk_level")).append(", ").append(r.get("risk_score")).append("分)\n"));
            sb.append("\n");
        }
        if (containsAny(message, "建议","整改","处理")) {
            sb.append("## 安全建议\n1. CRITICAL接口立即实施脱敏\n2. 增加统一脱敏网关\n3. 高频访问监控防批量抓取\n4. 建立接口敏感数据分级台账\n5. 定期运行检测任务持续监控\n\n");
        }
        if (sb.length() == "基于当前系统数据分析，为您提供以下信息:\n\n".length()) {
            sb.append("## 系统概况\n日志 ").append(logs.size()).append(" 条, 检测 ").append(dets.size()).append(" 条, 风险接口 ").append(risks.size()).append(" 个\n\n您可以问:\n- 今天数据情况如何?\n- 有哪些高危接口?\n- 敏感信息分布?\n- 有什么安全建议?\n");
        }
        sb.append("\n---\n*更新时间: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("*");
        return sb.toString();
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        for (String k : keywords) if (lower.contains(k.toLowerCase())) return true;
        return false;
    }
}
