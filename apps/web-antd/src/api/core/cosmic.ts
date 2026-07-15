import { baseRequestClient } from '#/api/request';

interface ApiResponse<T> {
  data: T;
}

export namespace CosmicApi {
  export interface ResourceItem {
    id: number;
    file_name: string;
    real_file_name: string;
    file_path: string;
    file_size: number;
    description: string;
    created_at: string;
  }

  export interface ResourceListResult {
    status: string;
    items: ResourceItem[];
  }

  export interface ResourceUploadResult {
    status: string;
    file_path: string;
    file_name: string;
    message: string;
  }

  export interface ResourceDeleteResult {
    status: string;
    message: string;
  }

  export interface TaskItem {
    id: number;
    task_id: string;
    task_name: string;
    code_resource_id: number;
    cosmic_resource_id: number;
    status: string;
    created_at: string;
  }

  export interface TaskListResult {
    status: string;
    items: TaskItem[];
    message: string;
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

  export interface EvidenceDetail {
    exists: boolean;
    reason?: string;
    searched_keywords?: string[];
    searched_paths?: string[];
    file_path?: string | null;
    line_start?: number | null;
    line_end?: number | null;
    code_snippet?: string | null;
    component_name?: string | null;
    route_path?: string | null;
    missing_reason?: string | null;
    api?: string;
    handler?: string;
    service_name?: string;
    line?: number;
    method?: string;
  }

  export interface Evidence {
    input_path: string;
    exists: boolean;
    reason: string;
    conclusion?: string;
    summary?: {
      frontend_status?: string;
      backend_status?: string;
      overall?: string;
    };
    evidence?: {
      frontend?: EvidenceDetail;
      backend?: EvidenceDetail;
    };
    business_context?: {
      service_responsibility?: string;
      data_flow?: string;
      related_modules?: string[];
      note?: string;
    };
    searched_info?: {
      frontend_keywords?: string[];
      frontend_paths?: string[];
      backend_keywords?: string[];
      backend_paths?: string[];
    };
    confidence?: number;
    recommendation?: string;
  }

  export interface TaskDetailNode {
    name: string;
    children?: TaskDetailNode[];
    evidence?: Evidence;
  }

export interface TaskDetailResult {
  status: string;
  total?: number;
  tree?: TaskDetailNode[];
  message?: string;
}
}

export async function getCosmicResourceListApi() {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.ResourceListResult>
  >('/cosmic/resource_list');
  return data;
}

export async function uploadCosmicResourceApi(formData: FormData) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.ResourceUploadResult>
  >('/cosmic/resource_upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteCosmicResourceApi(id: number) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.ResourceDeleteResult>
  >('/cosmic/resource_delete', { id });
  return data;
}

export async function getCosmicTaskListApi() {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskListResult>
  >('/cosmic/task_list');
  return data;
}

export async function createCosmicTaskApi(params: {
  code_resource_id: number;
  cosmic_resource_id: number;
  task_name: string;
  sheet_index?: number;
  col_level1?: number;
  col_level2?: number;
  col_level3?: number;
  col_func?: number;
}) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskCreateResult>
  >('/cosmic/task_create', params);
  return data;
}

export async function startCosmicTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskActionResult>
  >('/cosmic/task_start', { task_id: taskId });
  return data;
}

export async function stopCosmicTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskActionResult>
  >('/cosmic/task_stop', { task_id: taskId });
  return data;
}

export async function deleteCosmicTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskActionResult>
  >('/cosmic/task_delete', { task_id: taskId });
  return data;
}

export async function updateCosmicTaskApi(params: {
  task_id: string;
  task_name?: string;
  code_resource_id?: number;
  cosmic_resource_id?: number;
  sheet_spec?: number;
  col_one?: number;
  col_two?: number;
  col_three?: number;
  col_moudle?: number;
}) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskCreateResult>
  >('/cosmic/task_update', params);
  return data;
}

export async function exportCosmicReportApi(taskId: string) {
  return baseRequestClient.post<Blob>(
    '/cosmic/report_excel',
    { task_id: taskId },
    { responseType: 'blob' },
  );
}

export async function getCosmicTaskDetailApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<CosmicApi.TaskDetailResult>
  >('/cosmic/task_detail', { task_id: taskId });
  return data;
}