import { requestClient } from '#/api/request';

export namespace SensitiveKnowledgeApi {
  export interface KnowledgeItem {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    source: string;
    createTime: string;
    updateTime: string;
  }

  export interface KnowledgeListRequest {
    pageNum: number;
    pageSize: number;
    category?: string;
    keyword?: string;
  }

  export interface KnowledgeListResponse {
    list: KnowledgeItem[];
    total: number;
  }

  export interface KnowledgeAddRequest {
    title: string;
    content: string;
    category: string;
    tags: string[];
    source?: string;
  }

  export interface KnowledgeSearchRequest {
    keyword: string;
    topK?: number;
  }

  export interface KnowledgeEnhanceRequest {
    query: string;
    category?: string;
  }

  export interface KnowledgeEnhanceResponse {
    enhanced: boolean;
    newEntries: number;
    message: string;
  }
}

/** 知识列表 */
export async function knowledgeListApi(
  data: SensitiveKnowledgeApi.KnowledgeListRequest,
) {
  return requestClient.post<SensitiveKnowledgeApi.KnowledgeListResponse>(
    '/native-security/knowledge/list', data,
  );
}

/** 知识详情 */
export async function knowledgeDetailApi(data: { id: string }) {
  return requestClient.post<SensitiveKnowledgeApi.KnowledgeItem>(
    '/native-security/knowledge/detail', data,
  );
}

/** 添加知识 */
export async function knowledgeAddApi(
  data: SensitiveKnowledgeApi.KnowledgeAddRequest,
) {
  return requestClient.post<any>(
    '/native-security/knowledge/add', data,
  );
}

/** 搜索知识 */
export async function knowledgeSearchApi(
  data: SensitiveKnowledgeApi.KnowledgeSearchRequest,
) {
  return requestClient.post<SensitiveKnowledgeApi.KnowledgeItem[]>(
    '/native-security/knowledge/search', data,
  );
}

/** AI 知识增强 */
export async function knowledgeEnhanceApi(
  data: SensitiveKnowledgeApi.KnowledgeEnhanceRequest,
) {
  return requestClient.post<SensitiveKnowledgeApi.KnowledgeEnhanceResponse>(
    '/native-security/knowledge/enhance', data, { timeout: 120_000 },
  );
}
