package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

import java.util.Map;

@Data
public class PageRequest {

    private Integer pageNum = 1;

    private Integer pageSize = 10;

    private Map<String, Object> filters;
}
