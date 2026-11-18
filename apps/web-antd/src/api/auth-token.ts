import { useAccessStore } from '@vben/stores';

/**
 * 给 URL 追加 token 查询参数，供无法设置请求头的 EventSource 使用。
 * 已存在的查询参数会保留。
 */
export function appendTokenQuery(
  input: string,
  token: null | string | undefined,
): string {
  if (!token) {
    return input;
  }
  const url = new URL(input, window.location.origin);
  url.searchParams.set('token', token);
  return url.toString();
}

export function authEventSourceUrl(input: string): string {
  const accessStore = useAccessStore();
  return appendTokenQuery(input, accessStore.accessToken);
}
