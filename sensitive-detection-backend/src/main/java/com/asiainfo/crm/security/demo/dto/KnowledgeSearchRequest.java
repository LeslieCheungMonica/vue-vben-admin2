package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

@Data
public class KnowledgeSearchRequest {

    private String keyword;

    private String category;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
