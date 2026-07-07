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
public class StructuredRiskData {

    /**
     * Display mode determines which sections to render in the frontend:
     * "overview"   — statistics + risk level defs + all risk interfaces table
     * "risk_only"  — risk level defs + filtered risk interfaces (CRITICAL/HIGH only)
     * "type_dist"  — sensitive type distribution chart (no interface table)
     * "suggestion" — risk level defs + top risky interfaces (no full table)
     */
    private String displayMode;

    private List<RiskLevelDef> riskLevelDefs;
    private List<RiskInterfaceItem> riskInterfaces;
    private Map<String, Object> statistics;
    private List<SensitiveTypeDistribution> sensitiveTypeDistribution;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskLevelDef {
        private String level;
        private String name;
        private String color;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskInterfaceItem {
        private String id;
        private String serviceName;
        private String serviceRoute;
        private String riskLevel;
        private Integer riskScore;
        private String sensitiveTypes;
        private String sensitiveSummary;
        private Integer detectCount;
        private String detectSource;
        private Double confidence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SensitiveTypeDistribution {
        private String type;
        private String name;
        private Long count;
        private String color;
    }
}
