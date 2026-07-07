import { requestClient } from '#/api/request';

export namespace SensitiveAgentApi {
  export interface ChatRequest {
    message: string;
    sessionId?: string;
  }

  export interface ChatStep {
    type: 'thinking' | 'analysis' | 'data' | 'structured_data' | 'answer' | 'done';
    content: string;
  }

  export interface ChatSyncResponse {
    steps: ChatStep[];
    answer: string;
  }

  export interface RiskLevelDef {
    level: string;
    name: string;
    color: string;
    description: string;
  }

  export interface RiskInterfaceItem {
    id: string;
    serviceName: string;
    serviceRoute: string;
    riskLevel: string;
    riskScore: number;
    sensitiveTypes: string;
    sensitiveSummary: string;
    detectCount: number;
    detectSource: string;
    confidence: number;
  }

  export interface SensitiveTypeDistribution {
    type: string;
    name: string;
    count: number;
    color: string;
  }

  export interface StructuredRiskData {
    displayMode: 'overview' | 'risk_only' | 'type_dist' | 'suggestion';
    riskLevelDefs: RiskLevelDef[];
    riskInterfaces: RiskInterfaceItem[];
    statistics: Record<string, any>;
    sensitiveTypeDistribution: SensitiveTypeDistribution[];
  }
}

/** 同步聊天（非流式回退） */
export async function chatSyncApi(data: SensitiveAgentApi.ChatRequest) {
  return requestClient.post<SensitiveAgentApi.ChatSyncResponse>(
    '/native-security/agent/chat/sync', data,
  );
}
