import { baseRequestClient } from '#/api/request';

interface ApiResponse<T> {
  data: T;
}

export namespace TaskApi {
  export interface TaskItem {
    task_id: string;
    task_name: string;
    resource_id: number;
    web_url: string;
    code_desc: string;
    scan_scope: string;
    focus: string;
    login_flow: string;
    success_condition: string;
    core_biz_domain: string;
    core_biz_sub_domain_demo: string;
    resource_path: string;
    status: 'run-except' | 'running' | 'stopped' | 'wait-to-start';
    created_at: string;
    api_example?: string;
    skip_exploit?: string;
  }

  export interface TaskListResult {
    status: string;
    items: TaskItem[];
    message: string;
  }

  export interface TaskCreateParams {
    resource_id: number;
    task_name: string;
    web_url: string;
    code_desc: string;
    scan_scope: string;
    focus?: string;
    login_flow?: string;
    success_condition?: string;
    core_biz_domain?: string;
    core_biz_sub_domain_demo?: string;
    api_example?: string;
    skip_exploit?: string;
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

  export interface TaskUpdateParams {
    task_id: string;
    task_name?: string;
    web_url?: string;
    code_desc?: string;
    scan_scope?: string;
    focus?: string;
    login_flow?: string;
    success_condition?: string;
    core_biz_domain?: string;
    core_biz_sub_domain_demo?: string;
    api_example?: string;
    skip_exploit?: string;
  }

  export interface AuthVulnItem {
    id: number;
    task_id: string;
    vuln_type: string;
    create_time: string;
    vuln_id: string;
    title: string;
    severity: string;
    status: string;
    vuln_detail: string;
    location: string;
    blockers: string;
    impact: string;
    prerequisites: string;
    exploit_steps: string;
    evidence: string;
  }

  export interface AuthVulnListResult {
    status: string;
    items: AuthVulnItem[];
    message: string;
  }

  export interface BizVulnItem {
    id: number;
    title: string;
    res: string;
  }

  export interface BizVulnListResult {
    status: string;
    items: BizVulnItem[];
    message: string;
  }

  export interface BizVulnExploitItem {
    id: number;
    task_id: string;
    biz_name: string;
    vuln_type: string;
    create_time: string;
    vuln_id: string;
    title: string;
    severity: string;
    status: string;
    category: string;
    vuln_detail: string;
    location: string;
    blockers: string;
    impact: string;
    prerequisites: string;
    exploit_steps: string;
    evidence: string;
  }

  export interface BizVulnExploitListResult {
    status: string;
    items: BizVulnExploitItem[];
    message: string;
  }
}

export type AuthVulnItem = TaskApi.AuthVulnItem;
export type BizVulnExploitItem = TaskApi.BizVulnExploitItem;

export async function getTaskListApi(taskIdKeyword?: string) {
  const params: Record<string, string> = {};
  if (taskIdKeyword) params.task_id_keyword = taskIdKeyword;
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskListResult>
  >('/wape/task_list', params);
  return data;
}

export async function createTaskApi(params: TaskApi.TaskCreateParams) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskCreateResult>
  >('/wape/task_create', params);
  return data;
}

export async function startTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskActionResult>
  >('/wape/task_start', { task_id: taskId });
  return data;
}

export async function stopTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskActionResult>
  >('/wape/task_stop', { task_id: taskId });
  return data;
}

export async function deleteTaskApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskActionResult>
  >('/wape/task_delete', { task_id: taskId });
  return data;
}

export async function updateTaskApi(params: TaskApi.TaskUpdateParams) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.TaskActionResult>
  >('/wape/task_update', params);
  return data;
}

export async function getAuthVulnListApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.AuthVulnListResult>
  >('/wape/auth_vuln_list', { task_id: taskId });
  return data;
}

export async function getBizDataApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ data: any[]; message: string; status: string }>
  >('/wape/biz_data', { task_id: taskId });
  return data;
}

export async function getBizVulnListApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.BizVulnListResult>
  >('/wape/biz_vuln_list', { task_id: taskId });
  return data;
}

export async function bizVulnScanScopeSelectApi(
  taskId: string,
  items: { biz_name: string; option: 'select' | 'cancel'; module_path?: string; domain?: string }[],
) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; message: string }>
  >('/wape/biz_vuln_scan_scope_select', { task_id: taskId, items });
  return data;
}

export async function getBizVulnScanScopeSelectListApi(taskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; items: Record<string, { module_name: string; module_path: string }[]>[] }>
  >('/wape/biz_vuln_scan_scope_select_list', { task_id: taskId });
  return data;
}

export async function getBizVulnExploitListApi(
  taskId: string,
  bizName: string,
) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.BizVulnExploitListResult>
  >('/wape/biz_vuln_exploit_list', {
    task_id: taskId,
    biz_name: bizName,
  });
  return data;
}
