package com.asiainfo.crm.security.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private String reportId;

    private String generateTime;

    private Summary summary;

    private RiskBreakdown riskBreakdown;

    private List<TypeDistribution> sensitiveTypeDistribution;

    private List<TopRiskInterface> topRiskyInterfaces;

    private List<String> recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Integer totalLogsAnalyzed;
        private Integer totalDetections;
        private Integer totalRisks;
        private String overallRiskLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskBreakdown {
        private Integer critical;
        private Integer high;
        private Integer medium;
        private Integer low;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TypeDistribution {
        private String type;
        private Integer count;
        private Double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopRiskInterface {
        private String serviceName;
        private String serviceRoute;
        private Integer riskScore;
        private String riskLevel;
        private String sensitiveTypes;
    }
}
