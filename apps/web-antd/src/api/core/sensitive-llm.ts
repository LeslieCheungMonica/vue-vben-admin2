import { requestClient } from '#/api/request';

export namespace SensitiveLlmApi {
  export interface LlmConfig {
    provider: string;
    modelName: string;
    apiUrl: string;
    apiKey: string;
    temperature: number;
    maxTokens: number;
  }
}

/** 获取 LLM 配置 */
export async function getLlmConfigApi() {
  return requestClient.post<SensitiveLlmApi.LlmConfig>(
    '/native-security/llm/config',
  );
}

/** 更新 LLM 配置 */
export async function updateLlmConfigApi(data: Partial<SensitiveLlmApi.LlmConfig>) {
  return requestClient.post<any>(
    '/native-security/llm/updateConfig', data,
  );
}

/** 测试 LLM 连接 */
export async function testLlmConnectionApi(data?: Record<string, any>) {
  return requestClient.post<{ success: boolean; message: string }>(
    '/native-security/llm/test', data,
  );
}
