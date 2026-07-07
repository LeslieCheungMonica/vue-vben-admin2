package com.asiainfo.crm.security.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    /**
     * Type of response chunk: thinking, analysis, data, answer, done
     */
    private String type;

    private String content;
}
