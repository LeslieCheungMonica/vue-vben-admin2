package com.asiainfo.crm.security.demo.dto;

import lombok.Data;

@Data
public class DataQueryRequest {

    private String dateStart;

    private String dateEnd;

    private String apiPath;

    private String opId;

    private String detectStatus;

    private Integer pageNum = 1;

    private Integer pageSize = 10;
}
