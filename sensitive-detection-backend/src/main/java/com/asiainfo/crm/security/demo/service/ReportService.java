package com.asiainfo.crm.security.demo.service;

import com.asiainfo.crm.security.demo.dto.ReportResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ReportService {

    private final DataService dataService;
    private final Map<String, ReportResponse> reportStore = new ConcurrentHashMap<>();
    private final AtomicInteger reportCounter = new AtomicInteger(0);

    public ReportService(DataService dataService) {
        this.dataService = dataService;
    }

    public ReportResponse generateReport() {
        List<Map<String, Object>> logs = dataService.getFullChainLogs();
        List<Map<String, Object>> detections = dataService.getDetectionResults();
        List<Map<String, Object>> risks = dataService.getPrivacyInterfaceRisks();

        // Summary
        int totalLogs = logs.size();
        int totalDetections = detections.size();
        int totalRisks = risks.size();

        // Risk level breakdown
        Map<String, Long> riskLevelCounts = risks.stream()
                .collect(Collectors.groupingBy(
                        r -> String.valueOf(r.getOrDefault("risk_level", "UNKNOWN")),
                        Collectors.counting()));

        int criticalCount = riskLevelCounts.getOrDefault("CRITICAL", 0L).intValue();
        int highCount = riskLevelCounts.getOrDefault("HIGH", 0L).intValue();
        int mediumCount = riskLevelCounts.getOrDefault("MEDIUM", 0L).intValue();
        int lowCount = riskLevelCounts.getOrDefault("LOW", 0L).intValue();

        String overallRiskLevel;
        if (criticalCount > 0) {
            overallRiskLevel = "CRITICAL";
        } else if (highCount > 0) {
            overallRiskLevel = "HIGH";
        } else if (mediumCount > 0) {
            overallRiskLevel = "MEDIUM";
        } else {
            overallRiskLevel = "LOW";
        }

        // Sensitive type distribution
        Map<String, Long> sensitiveTypeCounts = new LinkedHashMap<>();
        for (Map<String, Object> det : detections) {
            Object types = det.get("sensitive_types");
            if (types instanceof List) {
                for (Object type : (List<?>) types) {
                    sensitiveTypeCounts.merge(String.valueOf(type), 1L, Long::sum);
                }
            }
        }

        long totalTypeCount = sensitiveTypeCounts.values().stream().mapToLong(Long::longValue).sum();
        List<ReportResponse.TypeDistribution> typeDistribution = sensitiveTypeCounts.entrySet().stream()
                .map(e -> ReportResponse.TypeDistribution.builder()
                        .type(e.getKey())
                        .count(e.getValue().intValue())
                        .percentage(totalTypeCount > 0 ? Math.round(e.getValue() * 10000.0 / totalTypeCount) / 100.0 : 0.0)
                        .build())
                .sorted(Comparator.comparing(ReportResponse.TypeDistribution::getCount).reversed())
                .collect(Collectors.toList());

        // Top risky interfaces
        List<ReportResponse.TopRiskInterface> topRiskyInterfaces = risks.stream()
                .sorted((a, b) -> {
                    int scoreA = a.get("risk_score") != null ? ((Number) a.get("risk_score")).intValue() : 0;
                    int scoreB = b.get("risk_score") != null ? ((Number) b.get("risk_score")).intValue() : 0;
                    return Integer.compare(scoreB, scoreA);
                })
                .limit(5)
                .map(r -> ReportResponse.TopRiskInterface.builder()
                        .serviceName(String.valueOf(r.getOrDefault("service_name", "")))
                        .serviceRoute(String.valueOf(r.getOrDefault("service_route", "")))
                        .riskScore(r.get("risk_score") != null ? ((Number) r.get("risk_score")).intValue() : 0)
                        .riskLevel(String.valueOf(r.getOrDefault("risk_level", "")))
                        .sensitiveTypes(String.valueOf(r.getOrDefault("sensitive_types", "")))
                        .build())
                .collect(Collectors.toList());

        // Recommendations
        List<String> recommendations = generateRecommendations(criticalCount, highCount, mediumCount, typeDistribution);

        // Build report
        String reportId = "RPT_" + String.format("%04d", reportCounter.incrementAndGet());
        String generateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        ReportResponse report = ReportResponse.builder()
                .reportId(reportId)
                .generateTime(generateTime)
                .summary(ReportResponse.Summary.builder()
                        .totalLogsAnalyzed(totalLogs)
                        .totalDetections(totalDetections)
                        .totalRisks(totalRisks)
                        .overallRiskLevel(overallRiskLevel)
                        .build())
                .riskBreakdown(ReportResponse.RiskBreakdown.builder()
                        .critical(criticalCount)
                        .high(highCount)
                        .medium(mediumCount)
                        .low(lowCount)
                        .build())
                .sensitiveTypeDistribution(typeDistribution)
                .topRiskyInterfaces(topRiskyInterfaces)
                .recommendations(recommendations)
                .build();

        reportStore.put(reportId, report);
        log.info("Report generated: {}", reportId);

        return report;
    }

    public ReportResponse getReport(String reportId) {
        ReportResponse report = reportStore.get(reportId);
        if (report == null) {
            throw new IllegalArgumentException("Report not found: " + reportId);
        }
        return report;
    }

    private List<String> generateRecommendations(int critical, int high, int medium,
                                                  List<ReportResponse.TypeDistribution> typeDistribution) {
        List<String> recommendations = new ArrayList<>();

        if (critical > 0) {
            recommendations.add("存在CRITICAL级别风险接口，建议立即对相关接口实施敏感数据脱敏处理，限制敏感字段返回。");
        }
        if (high > 0) {
            recommendations.add("HIGH级别风险接口较多，建议在接口响应层增加统一脱敏网关，对身份证号、银行卡号等L1级敏感信息强制掩码。");
        }
        if (medium > 0) {
            recommendations.add("MEDIUM级别风险需关注，建议对地址、邮箱等L2级敏感信息在非授权场景下进行掩码处理。");
        }

        // Type-specific recommendations
        for (ReportResponse.TypeDistribution td : typeDistribution) {
            switch (td.getType()) {
                case "ID_CARD":
                    recommendations.add("身份证号检测频次较高(" + td.getCount() + "次)，建议在所有查询接口中对身份证号实施保留前3后4的脱敏规则。");
                    break;
                case "BANK_CARD":
                    recommendations.add("银行卡号泄露风险存在，建议对涉及银行卡号的接口增加权限校验和脱敏处理。");
                    break;
                case "PHONE":
                    recommendations.add("手机号出现频次最高(" + td.getCount() + "次)，建议在非必要场景下对手机号实施保留前3后4的掩码处理。");
                    break;
                case "ADDRESS":
                    recommendations.add("地址信息检测到LLM识别结果，建议增加地址字段的脱敏规则，保留省市区，隐藏详细门牌号。");
                    break;
                default:
                    break;
            }
        }

        recommendations.add("建议定期运行敏感信息检测任务，持续监控接口敏感数据泄露风险。");
        recommendations.add("建议建立接口敏感数据分级分类台账，对新增接口实施安全评审机制。");

        return recommendations;
    }
}
