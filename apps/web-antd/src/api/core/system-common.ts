import { baseRequestClient } from '#/api/request';

/**
 * /auth 与 /system 两组接口的公共请求工具。
 *
 * 后端统一响应格式：
 *   成功：{"code": 0, "data": {...}, "message": ""}
 *   失败：{"code": N, "message": "错误信息"}
 *
 * 使用不做响应拦截的 baseRequestClient，在 systemPost 中手动解包。
 */
interface EnvelopeResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function systemPost<T>(
  url: string,
  data?: Record<string, any>,
): Promise<T> {
  const response = (await baseRequestClient.post(
    url,
    data ?? {},
  )) as { data: EnvelopeResponse<T> };
  const envelope = response.data;
  if (envelope?.code !== 0) {
    throw envelope ?? { message: '请求失败' };
  }
  return envelope.data;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface StatusResult {
  message: string;
  status: string;
}

export function toPageResult<T>(
  raw: any,
  mapItem: (item: any) => T,
): PageResult<T> {
  return {
    items: (raw?.items ?? []).map((item: any) => mapItem(item)),
    page: raw?.page ?? 1,
    pageSize: raw?.page_size ?? 20,
    total: raw?.total ?? 0,
    totalPages: raw?.total_pages ?? 0,
  };
}

const STATUS_TEXT: Record<number, string> = {
  400: '请求参数错误',
  401: '未登录或登录已过期',
  403: '无权限执行该操作',
  404: '资源不存在',
  409: '数据冲突',
  413: '请求体过大',
  422: '请求参数校验失败',
  500: '服务器内部错误',
};

/** 统一提示文案，避免各页面散落硬编码字符串 */
export const SYSTEM_MESSAGES = {
  createSuccess: '新增成功',
  deleteConfirmSuffix: '？',
  deleteSuccess: '删除成功',
  loadFailed: '数据获取失败',
  saveSuccess: '保存成功',
  statusDisabled: '停用成功',
  statusEnabled: '启用成功',
  submitFailed: '操作失败，请稍后重试',
} as const;

/**
 * 提取后端错误信息。
 * RequestClient 在失败时抛出的是 `error.response.data`（即响应体本身），
 * 因此这里同时兼容「响应体」与「axios error」两种形态。
 */
export function extractApiError(
  error: unknown,
  fallback = '请求失败，请稍后重试',
): string {
  const err = error as any;
  const bodies = [err, err?.response?.data];

  for (const body of bodies) {
    if (!body) {
      continue;
    }
    if (typeof body === 'string') {
      return body;
    }
    // 统一响应格式：{code: N, message: "..."}
    if (
      typeof body.code === 'number' &&
      body.code !== 0 &&
      typeof body.message === 'string' &&
      body.message
    ) {
      return body.message;
    }
    if (typeof body.detail === 'string' && body.detail) {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail.length > 0) {
      const messages = body.detail
        .map((item: any) => item?.msg ?? '')
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('；');
      }
    }
    if (typeof body.message === 'string' && body.message) {
      return body.message;
    }
    if (typeof body.error === 'string' && body.error) {
      return body.error;
    }
  }

  const status = err?.response?.status ?? err?.status;
  if (status && STATUS_TEXT[status]) {
    return STATUS_TEXT[status];
  }
  return err?.message || fallback;
}
