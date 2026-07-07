import { requestClient } from '#/api/request';

export namespace SensitiveModelApi {
  export interface ModelConfig {
    id: string;
    name: string;
    type: 'RULE' | 'LLM';
    sensitive_type: string;
    pattern?: string;
    confidence: number;
    enabled: boolean;
    priority: number;
    description?: string;
    field?: string;
    llm_config?: {
      model: string;
      prompt: string;
      temperature: number;
      max_tokens: number;
    };
    create_time?: string;
    update_time?: string;
  }

  export interface ModelListResponse {
    list: ModelConfig[];
    total: number;
  }

  export interface ModelUpdateRequest {
    id: string;
    name?: string;
    pattern?: string;
    confidence?: number;
    enabled?: boolean;
    description?: string;
    priority?: number;
  }
}

/** 模型列表 */
export async function modelListApi() {
  return requestClient.post<SensitiveModelApi.ModelListResponse>(
    '/native-security/model/list', {},
  );
}

/** 模型详情 */
export async function modelDetailApi(data: { id: string }) {
  return requestClient.post<SensitiveModelApi.ModelConfig>(
    '/native-security/model/detail', data,
  );
}

/** 更新模型配置 */
export async function modelUpdateApi(data: SensitiveModelApi.ModelUpdateRequest) {
  return requestClient.post<any>(
    '/native-security/model/update', data,
  );
}

/** 测试模型 */
export async function modelTestApi(data: { id: string; sampleData: string }) {
  return requestClient.post<any>(
    '/native-security/model/test', data,
  );
}
