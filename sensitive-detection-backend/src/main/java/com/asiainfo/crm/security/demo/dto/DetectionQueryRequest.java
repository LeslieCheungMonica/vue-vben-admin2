package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

@Data
public class DetectionQueryRequest {

    private String riskLevel;

    private String sensitiveType;

    private String opId;

    private String dateStart;

    private String dateEnd;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
