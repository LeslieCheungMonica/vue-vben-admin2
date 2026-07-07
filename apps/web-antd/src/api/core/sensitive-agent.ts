import { requestClient } from '#/api/request';

export namespace SensitiveAgentApi {
  export interface ChatRequest {
    message: string;
    sessionId?: string;
  }

  export interface ChatStep {
    type: 'thinking' | 'analysis' | 'data' | 'answer' | 'done';
    content: string;
  }

  export interface ChatSyncResponse {
    steps: ChatStep[];
    answer: string;
  }
}

/** 同步聊天（非流式回退） */
export async function chatSyncApi(data: SensitiveAgentApi.ChatRequest) {
  return requestClient.post<SensitiveAgentApi.ChatSyncResponse>(
    '/native-security/agent/chat/sync', data,
  );
}
