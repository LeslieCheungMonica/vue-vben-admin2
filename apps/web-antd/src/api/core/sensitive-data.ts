import { requestClient } from '#/api/request';

export namespace SensitiveDataApi {
  export interface PageRequest {
    pageNum: number;
    pageSize: number;
  }

  export interface LogListRequest extends PageRequest {
    startTime?: string;
    endTime?: string;
    apiPath?: string;
    opId?: string;
    detectStatus?: string;
  }

  export interface LogDetail {
    traceId: string;
    apiPath: string;
    opId: string;
    opName: string;
    requestResult: string;
    costTimeMs: number;
    requestHeader: string;
    requestBody: string;
    responseHeader: string;
    responseBody: string;
    createTime: string;
  }

  export interface DetectionListRequest extends PageRequest {
    riskLevel?: string;
    sensitiveType?: string;
    opId?: string;
    startTime?: string;
    endTime?: string;
  }

  export interface SensitiveDetail {
    type: string;
    originalValue: string;
    maskedValue: string;
    confidence: number;
    source: string;
  }

  export interface DetectionDetail {
    id: string;
    traceId: string;
    apiPath: string;
    opName: string;
    sensitiveTypes: string[];
    riskLevel: string;
    detectTime: string;
    dealStatus: string;
    details: SensitiveDetail[];
  }

  export interface RiskListRequest extends PageRequest {
    riskLevel?: string;
  }

  export interface StatisticsRequest {
    startTime?: string;
    endTime?: string;
  }

  export interface StatisticsData {
    totalLogs: number;
    detectionCount: number;
    highRiskCount: number;
    knowledgeCount: number;
    riskDistribution: { level: string; count: number }[];
    typeDistribution: { type: string; count: number }[];
    recentDetections: DetectionDetail[];
  }

  export interface PageResponse<T> {
    list: T[];
    total: number;
  }

  export interface BatchRecheckRequest {
    traceIds?: string[];
    apiPath?: string;
  }

  export interface BatchRecheckResult {
    total: number;
    detected: number;
    safe: number;
    llmSuccess: number;
    llmFail: number;
    details: {
      traceId: string;
      ruleHit: boolean;
      llmDetected: boolean;
      sensitiveTypes: string[];
    }[];
  }
}

/** 日志列表 */
export async function logListApi(data: SensitiveDataApi.LogListRequest) {
  return requestClient.post<SensitiveDataApi.PageResponse<SensitiveDataApi.LogDetail>>(
    '/native-security/data/logList', data,
  );
}

/** 日志详情 */
export async function logDetailApi(data: { traceId: string }) {
  return requestClient.post<SensitiveDataApi.LogDetail>(
    '/native-security/data/logDetail', data,
  );
}

/** 检测结果列表 */
export async function detectionListApi(
  data: SensitiveDataApi.DetectionListRequest,
) {
  return requestClient.post<SensitiveDataApi.PageResponse<SensitiveDataApi.DetectionDetail>>(
    '/native-security/data/detectionList', data,
  );
}

/** 检测结果详情 */
export async function detectionDetailApi(data: { id: string }) {
  return requestClient.post<SensitiveDataApi.DetectionDetail>(
    '/native-security/data/detectionDetail', data,
  );
}

/** 根据 traceId 查询检测结果 */
export async function detectionByTraceIdApi(data: { traceId: string }) {
  return requestClient.post<SensitiveDataApi.DetectionDetail[]>(
    '/native-security/data/detectionByTraceId', data,
  );
}

/** 风险接口列表 */
export async function riskListApi(data: SensitiveDataApi.RiskListRequest) {
  return requestClient.post<SensitiveDataApi.PageResponse<any>>(
    '/native-security/data/riskList', data,
  );
}

/** 统计数据 */
export async function statisticsApi(data?: SensitiveDataApi.StatisticsRequest) {
  return requestClient.post<SensitiveDataApi.StatisticsData>(
    '/native-security/data/statistics', data,
  );
}

/** 新增日志并检测 */
export async function addAndDetectApi(data: Record<string, any>) {
  return requestClient.post<any>(
    '/native-security/data/addAndDetect', data, { timeout: 120_000 },
  );
}

/** 对单条日志进行检测 */
export async function detectLogApi(data: { traceId: string }) {
  return requestClient.post<any>(
    '/native-security/data/detectLog', data, { timeout: 120_000 },
  );
}

/** 批量复检 */
export async function batchRecheckApi(data: SensitiveDataApi.BatchRecheckRequest) {
  return requestClient.post<SensitiveDataApi.BatchRecheckResult>(
    '/native-security/data/batchRecheck', data, { timeout: 300_000 },
  );
}
