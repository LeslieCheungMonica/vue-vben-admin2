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

export interface VulnDetailItem {
  source_table: string;
  id: number;
  task_id: string;
  create_time: string;
  vuln_id: string;
  vulnerability_type: string;
  title: string;
  confidence: string;
  notes: string;
  externally_exploitable: string;
  source_endpoint: string;
  vulnerable_code_location: string;
  missing_defense: string;
  exploitation_hypothesis: string;
  suggested_exploit_technique: string;
  endpoint: string;
  guard_evidence: string;
  side_effect: string;
  reason: string;
  minimal_witness: string;
  source: string;
  combined_sources: string;
  path: string;
  sink_call: string;
  slot_type: string;
  sanitization_observed: string;
  concat_occurrences: string;
  verdict: string;
  mismatch_reason: string;
  witness_payload: string;
  vulnerable_parameter: string;
  source_detail: string;
  sink_function: string;
  render_context: string;
  encoding_observed: string;
  biz_name: string;
  frontend_trigger: string;
  full_call_chain: string;
  exploit_title: string;
  exploit_severity: string;
  exploit_status: string;
  exploit_vuln_detail: string;
  exploit_location: string;
  exploit_blockers: string;
  exploit_impact: string;
  exploit_prerequisites: string;
  exploit_steps: string;
  exploit_evidence: string;
}

export interface VulnDetailListResult {
  status: string;
  items: VulnDetailItem[];
  total: number;
  page: number;
  page_size: number;
  message: string;
}

export async function getVulnDetailListApi(
  taskId: string,
  sourceTable: string,
  page: number = 1,
  pageSize: number = 10,
  confidence?: string,
) {
  const params: Record<string, any> = {
    task_id: taskId,
    source_table: sourceTable,
    page,
    page_size: pageSize,
  };
  if (confidence && confidence !== 'all') params.confidence = confidence;
  const { data } = await baseRequestClient.post<
    ApiResponse<VulnDetailListResult>
  >('/wape/vuln_detail_list', params);
  return data;
}

export interface RepeatTaskItem {
  repeat_task_id: string;
  repeat_task_name: string;
  resource_id: number;
  resource_path: string;
  status: string;
  repeat_task_type: string;
  task_id: string;
  vuln_ids: string;
  created_at: string;
}

export async function startRepeatTaskApi(repeatTaskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; message: string }>
  >('/wape/repeat_task_start', { repeat_task_id: repeatTaskId });
  return data;
}

export async function updateRepeatTaskApi(params: {
  repeat_task_id: string;
  repeat_task_name?: string;
  resource_id?: number;
  resource_path?: string;
  status?: string;
  repeat_task_type?: string;
  vuln_ids?: string;
}) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; message: string }>
  >('/wape/repeat_task_update', params);
  return data;
}

export async function deleteRepeatTaskApi(repeatTaskId: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; message: string }>
  >('/wape/repeat_task_delete', { repeat_task_id: repeatTaskId });
  return data;
}

export async function createRepeatTaskApi(params: {
  task_id: string;
  repeat_task_name: string;
  resource_id: number;
  repeat_task_type: string;
  vuln_ids?: string;
}) {
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; repeat_task_id: string; repeat_task_name: string; task_id: string; message: string }>
  >('/wape/repeat_task_create', params);
  return data;
}

export async function getRepeatTaskListApi(taskId: string, keyword?: string) {
  const params: Record<string, string> = { task_id: taskId };
  if (keyword) params.repeat_task_id_keyword = keyword;
  const { data } = await baseRequestClient.post<
    ApiResponse<{ status: string; items: RepeatTaskItem[]; message: string }>
  >('/wape/repeat_task_list', params);
  return data;
}

export async function getCommonVulnListApi(taskId: string, vulnType: string) {
  const { data } = await baseRequestClient.post<
    ApiResponse<TaskApi.AuthVulnListResult>
  >('/wape/common_vuln_list', { task_id: taskId, vuln_type: vulnType });
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
