import { requestClient } from '#/api/request';

export namespace SensitiveReportApi {
  export interface ReportGenerateRequest {
    startTime?: string;
    endTime?: string;
    includeDetails?: boolean;
  }

  export interface ReportSummary {
    totalApis: number;
    totalDetections: number;
    highRiskApis: number;
    sensitiveTypes: number;
  }

  export interface RiskBreakdown {
    level: string;
    count: number;
    percentage: number;
  }

  export interface TopRiskyApi {
    apiPath: string;
    detectionCount: number;
    riskLevel: string;
    sensitiveTypes: string[];
  }

  export interface ReportDetail {
    id: string;
    generateTime: string;
    dataRange: string;
    summary: ReportSummary;
    riskBreakdown: RiskBreakdown[];
    typeDistribution: { type: string; count: number; percentage: number }[];
    topRiskyApis: TopRiskyApi[];
    recommendations: string[];
  }
}

/** 生成评估报告 */
export async function generateReportApi(
  data?: SensitiveReportApi.ReportGenerateRequest,
) {
  return requestClient.post<SensitiveReportApi.ReportDetail>(
    '/native-security/report/generate', data, { timeout: 60_000 },
  );
}

/** 获取报告详情 */
export async function reportDetailApi(data: { id: string }) {
  return requestClient.post<SensitiveReportApi.ReportDetail>(
    '/native-security/report/detail', data,
  );
}
