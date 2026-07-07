package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

@Data
public class ModelUpdateRequest {

    private String id;

    private Boolean enabled;

    private Double confidence;

    private Integer priority;

    private String description;
}
