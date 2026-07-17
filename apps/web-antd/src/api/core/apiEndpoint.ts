import { baseRequestClient } from '#/api/request';

interface ApiResponse<T> {
  data: T;
}

export namespace ApiEndpointApi {
  export interface TaskItem {
    id: number;
    task_id: string;
    task_name: string;
    resource_id: number;
    main_domain: string;
    resource_path: string;
    status: string;
    created_at: string;
  }

  export interface TaskListResult {
    status: string;
    total?: number;
    items: TaskItem[];
    message?: string;
  }

  export interface TaskCreateResult {
    status: string;
    task_id: string;
    task_name: string;
    message: string;
  }

  export interface TaskActionResult {
    status: string;
    message: string;
  }

  export interface TaskDetailResult {
    status: string;
    task_id: string;
    task_name: string;
    resource_id: number;
    main_domain: string;
    resource_path: string;
    task_status: string;
    created_at: string;
    deliverables?: Record<string, unknown>;
    message?: string;
  }
}

export async function getApiEndpointTaskListApi() {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskListResult>>('/api_endpoint/api_endpoint_task_list');
  return data;
}

export async function createApiEndpointTaskApi(params: {
  task_name: string;
  resource_id: number;
  main_domain?: string;
  resource_path?: string;
}) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskCreateResult>>('/api_endpoint/api_endpoint_task_create', params);
  return data;
}

export async function deleteApiEndpointTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskActionResult>>('/api_endpoint/api_endpoint_task_delete', { task_id: taskId });
  return data;
}

export async function updateApiEndpointTaskApi(params: {
  task_id: string;
  task_name?: string;
  main_domain?: string;
  resource_path?: string;
  status?: string;
}) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskActionResult>>('/api_endpoint/api_endpoint_task_update', params);
  return data;
}

export async function startApiEndpointTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskActionResult>>('/api_endpoint/api_endpoint_task_start', { task_id: taskId });
  return data;
}

export async function stopApiEndpointTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskActionResult>>('/api_endpoint/api_endpoint_task_stop', { task_id: taskId });
  return data;
}

export async function getApiEndpointTaskDetailApi(taskId: string) {
  const { data } = await baseRequestClient.post<ApiResponse<ApiEndpointApi.TaskDetailResult>>('/api_endpoint/api_endpoint_task_detail', { task_id: taskId });
  return data;
}