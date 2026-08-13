import { baseRequestClient } from '#/api/request';

// baseRequestClient 返回的 AxiosResponse 结构
interface ApiResponse<T> {
  data: T;
}

export namespace ResourceApi {
  export interface ResourceItem {
    id: number;
    code: string;
    version: string;
    description: string;
    extracted_path: string;
    system_name?: string;
    agent_name?: string;
    agent_type?: string;
    target_system?: string;
    task_description?: string;
    code_path?: string;
    code_language?: string;
    kb_source?: string;
    kb_url?: string;
    doc_list?: string;
    biz_arch_graph?: string;
    core_biz_modules?: string;
    core_data_tables?: string;
    git_repo?: string;
    git_branch?: string;
    git_username?: string;
    git_password?: string;
    task_id?: string;
  }

  export interface ResourceListResult {
    status: string;
    items: ResourceItem[];
    message: string;
  }

  export interface ResourceUploadResult {
    status: string;
    extracted_path: string;
    message: string;
  }

  export interface ResourceDeleteResult {
    status: string;
    message: string;
  }
}

export async function getResourceListApi(code?: string, version?: string) {
  const params: Record<string, string> = {};
  if (code) params.code = code;
  if (version) params.version = version;
  const { data } = await baseRequestClient.post<
    ApiResponse<ResourceApi.ResourceListResult>
  >('/wape/resource_list', params);
  return data;
}

export async function uploadResourceApi(formData: FormData) {
  const { data } = await baseRequestClient.post<
    ApiResponse<ResourceApi.ResourceUploadResult>
  >('/wape/resource_upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function saveAgentConfigApi(
  code: string,
  version: string,
  params: {
    agent_name?: string;
    agent_type?: string;
    target_system?: string;
    task_description?: string;
    code_language?: string;
    kb_source?: string;
    kb_url?: string;
    doc_list?: string;
    biz_arch_graph?: string;
    core_biz_modules?: string;
    core_data_tables?: string;
  },
) {
  const formData = new FormData();
  formData.append('code', code);
  formData.append('version', version);
  if (params.agent_name) formData.append('agent_name', params.agent_name);
  if (params.agent_type) formData.append('agent_type', params.agent_type);
  if (params.target_system) formData.append('target_system', params.target_system);
  if (params.task_description) formData.append('task_description', params.task_description);
  if (params.code_language) formData.append('code_language', params.code_language);
  if (params.kb_source) formData.append('kb_source', params.kb_source);
  if (params.kb_url) formData.append('kb_url', params.kb_url);
  if (params.doc_list) formData.append('doc_list', params.doc_list);
  if (params.biz_arch_graph) formData.append('biz_arch_graph', params.biz_arch_graph);
  if (params.core_biz_modules) formData.append('core_biz_modules', params.core_biz_modules);
  if (params.core_data_tables) formData.append('core_data_tables', params.core_data_tables);
  const { data } = await baseRequestClient.post<
    ApiResponse<ResourceApi.ResourceUploadResult>
  >('/wape/resource_upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function saveAgentConfigKejiApi(params: {
  id: number;
  agent_name?: string;
  agent_type?: string;
  target_system?: string;
  task_description?: string;
  version?: string;
  code_path?: string;
  code_language?: string;
  git_repo?: string;
  git_branch?: string;
  git_username?: string;
  git_password?: string;
  kb_source?: string;
  kb_url?: string;
  doc_list?: string;
  biz_arch_graph?: string;
  core_biz_modules?: string;
  core_data_tables?: string;
}) {
  const { data } = await baseRequestClient.post<
    ApiResponse<ResourceApi.ResourceUploadResult>
  >('/wape/resource_update_keji', params);
  return data;
}

export async function deleteResourceApi(id: number) {
  const { data } = await baseRequestClient.post<
    ApiResponse<ResourceApi.ResourceDeleteResult>
  >('/wape/resource_delete', { id });
  return data;
}

export async function bizSurveyCreateApi(params: {
  system_id: string;
  system_name?: string;
  resource_id: number;
  resource_path?: string;
  session_id?: string;
}) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/biz_survey_create', params);
  return data;
}

export async function webServerStartApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_start', { web_id });
  return data;
}

export async function webServerSendMsgApi(web_id: string, text: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_send_msg', { web_id, text });
  return data;
}

export async function webServerSendMsgAsyncApi(web_id: string, text: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_send_msg_async', { web_id, text });
  return data;
}

export async function webServerStatusApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_status', { web_id });
  return data;
}

export async function webServerCreateSessionApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_create_session', { web_id });
  return data;
}

export async function webServerStopApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/web_server_stop', { web_id });
  return data;
}

export async function sessionAbortApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>('/wape/session_abort', { web_id });
  return data;
}

export interface BizSurveyRecord {
  id: number;
  system_name: string;
  resource_id: number;
  resource_path: string;
  session_id?: string;
  session_his?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BizSurveyListResult {
  status: string;
  records: BizSurveyRecord[];
  message: string;
}

export async function bizSurveyListApi() {
  const { data } = await baseRequestClient.post<ApiResponse<BizSurveyListResult>>(
    '/wape/biz_survey_list',
  );
  return data;
}

export interface BizSurveyUpdateResult {
  status: string;
  system_name: string;
  resource_id: number;
  resource_path: string;
  message: string;
}

export async function bizSurveyUpdateApi(system_name: string, resource_id: number) {
  const { data } = await baseRequestClient.post<ApiResponse<BizSurveyUpdateResult>>(
    '/wape/biz_survery_update',
    { system_name, resource_id },
  );
  return data;
}

export interface CoreFunctionBiz {
  biz_title: string;
  biz_file_path: string;
}

export interface CoreFunctionItem {
  fucntion_name: string;
  file_path: string;
  bizs: CoreFunctionBiz[];
}

export interface CoreFunctionModule {
  module_name: string;
  functions: CoreFunctionItem[];
}

export interface CoreFunctionSaveParams {
  system_name: string;
  modules: CoreFunctionModule[];
}

export async function coreFunctionSaveApi(params: CoreFunctionSaveParams) {
  const { data } = await baseRequestClient.post<ApiResponse<any>>(
    '/wape/core_function_save',
    params,
  );
  return data;
}

export interface CoreFunctionRecord {
  id: number;
  system_name: string;
  module_name: string;
  fucntion_name: string;
  file_path: string;
  biz_title: string;
  biz_file_path: string;
  created_at?: string;
}

export interface CoreFunctionListResult {
  status: string;
  records: CoreFunctionRecord[];
  message: string;
}

export async function coreFunctionListApi(system_name: string) {
  const { data } = await baseRequestClient.post<ApiResponse<CoreFunctionListResult>>(
    '/wape/core_function_list',
    { system_name },
  );
  return data;
}

export interface Modules3dResult {
  status: string;
  modules: any[];
  message: string;
}

export async function moudles3dApi(web_id: string) {
  const { data } = await baseRequestClient.post<ApiResponse<Modules3dResult>>(
    '/wape/moudles_3d',
    { web_id },
  );
  return data;
}
