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
