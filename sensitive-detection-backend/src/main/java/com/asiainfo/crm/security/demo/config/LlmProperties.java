package com.asiainfo.crm.security.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * LLM 模型配置（复用原项目 LlmProperties 模式）
 */
@Data
@Component
@ConfigurationProperties(prefix = "llm")
public class LlmProperties {

    /** 是否启用 LLM（关闭则走本地写死逻辑） */
    private boolean enabled = false;

    /** 连接超时（毫秒） */
    private int connectTimeout = 10000;

    /** 读取超时（毫秒） */
    private int readTimeout = 120000;

    /** API 地址（OpenAI 兼容格式） */
    private String apiUrl = "https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions";

    /** API Key */
    private String apiKey = "";

    /** 默认模型 */
    private String defaultModel = "astron-code-latest";

    /** 可用模型列表 */
    private List<String> models = new ArrayList<>();

    public LlmProperties() {
        models.add("astron-code-latest");
    }
}
