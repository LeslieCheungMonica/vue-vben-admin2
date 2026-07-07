package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class KnowledgeAddRequest {

    private String title;

    private String category;

    private String content;

    private List<String> tags;

    private String source;
}
