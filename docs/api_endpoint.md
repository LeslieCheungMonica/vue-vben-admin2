# API Endpoint 接口文档

## 概述

API Endpoint 模块提供对 API 端点任务的管理功能，包括创建、查询、更新、删除、启动和停止任务。

## 接口列表

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api_endpoint/api_endpoint_task_list` | POST | 获取任务列表 |
| `/api_endpoint/api_endpoint_task_create` | POST | 创建任务 |
| `/api_endpoint/api_endpoint_task_delete` | POST | 删除任务 |
| `/api_endpoint/api_endpoint_task_update` | POST | 更新任务 |
| `/api_endpoint/api_endpoint_task_start` | POST | 启动任务 |
| `/api_endpoint/api_endpoint_task_stop` | POST | 停止任务 |
| `/api_endpoint/api_endpoint_task_detail` | POST | 获取任务详情 |

---

## 1. 获取任务列表

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_list`

**请求体:** 无

### 响应

```json
{
  "status": "completed",
  "total": 1,
  "items": [
    {
      "id": 1,
      "task_id": "api_20240717120000_abc123",
      "task_name": "测试任务",
      "resource_id": 1,
      "main_domain": "example.com",
      "resource_path": "/path/to/code",
      "status": "wait-to-start",
      "created_at": "2024-07-17 12:00:00"
    }
  ]
}
```

---

## 2. 创建任务

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_create`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_name | string | 是 | 任务名称 |
| resource_id | integer | 是 | 资源ID |
| main_domain | string | 否 | 主域名 |
| resource_path | string | 否 | 资源路径 |

**示例:**
```json
{
  "task_name": "API扫描任务",
  "resource_id": 1,
  "main_domain": "example.com",
  "resource_path": "/codes/project1"
}
```

### 响应

```json
{
  "status": "completed",
  "task_id": "api_20240717120000_abc123",
  "task_name": "API扫描任务",
  "message": "任务创建成功"
}
```

---

## 3. 删除任务

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_delete`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |

**示例:**
```json
{
  "task_id": "api_20240717120000_abc123"
}
```

### 响应

```json
{
  "status": "completed",
  "message": "任务已删除: api_20240717120000_abc123"
}
```

---

## 4. 更新任务

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_update`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |
| task_name | string | 否 | 任务名称 |
| main_domain | string | 否 | 主域名 |
| resource_path | string | 否 | 资源路径 |
| status | string | 否 | 任务状态 |

**示例:**
```json
{
  "task_id": "api_20240717120000_abc123",
  "task_name": "新任务名称",
  "status": "processing"
}
```

### 响应

```json
{
  "status": "completed",
  "message": "任务已更新"
}
```

---

## 5. 启动任务

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_start`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |

**示例:**
```json
{
  "task_id": "api_20240717120000_abc123"
}
```

### 响应

```json
{
  "status": "processing",
  "message": "任务已提交: api_20240717120000_abc123"
}
```

---

## 6. 停止任务

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_stop`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |

**示例:**
```json
{
  "task_id": "api_20240717120000_abc123"
}
```

### 响应

```json
{
  "status": "completed",
  "message": "任务已停止: api_20240717120000_abc123"
}
```

---

## 7. 获取任务详情

### 请求

**接口:** `POST /api_endpoint/api_endpoint_task_detail`

**请求体:**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务ID |

**示例:**
```json
{
  "task_id": "api_20240717120000_abc123"
}
```

### 响应

```json
{
  "status": "completed",
  "task_id": "api_20240717120000_abc123",
  "task_name": "API扫描任务",
  "resource_id": 1,
  "main_domain": "example.com",
  "resource_path": "/codes/project1",
  "task_status": "completed",
  "created_at": "2024-07-17 12:00:00",
  "csv_content": "路径,方法,接口说明,所属模块\n/api/v1/user/list,GET,\"获取用户列表\",用户模块\n/api/v1/user/create,POST,\"创建用户\",用户模块\n/api/v1/order/detail,GET,\"获取订单详情\",订单模块"
}
```

---

## 数据模型

### ApiEndpointTaskItem

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键ID |
| task_id | string | 任务唯一标识 |
| task_name | string | 任务名称 |
| resource_id | integer | 资源ID |
| main_domain | string | 主域名 |
| resource_path | string | 资源路径 |
| status | string | 任务状态 |
| created_at | string | 创建时间 |

### ApiEndpointTaskDetailResponse

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 响应状态 |
| task_id | string | 任务唯一标识 |
| task_name | string | 任务名称 |
| resource_id | integer | 资源ID |
| main_domain | string | 主域名 |
| resource_path | string | 资源路径 |
| task_status | string | 任务状态 |
| created_at | string | 创建时间 |
| deliverables | dict | 目录下的 JSON 文件内容 |
| csv_content | string | api-endpoint.csv 文件内容 |

### 任务状态说明

| 状态 | 说明 |
|------|------|
| wait-to-start | 等待启动 |
| processing | 处理中 |
| completed | 已完成 |
| failed | 失败 |
| stopped | 已停止 |
