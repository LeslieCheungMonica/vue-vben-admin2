# BizSurvey API 接口文档

> 前缀：`/wape`

---

## 1. 创建业务测绘记录

**POST** `/wape/biz_survey_create`

### 请求体

```json
{
  "system_id": "sys-001",
  "system_name": "订单系统",
  "resource_id": 1,
  "session_id": "sess-xxx"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| system_id | string | 是 | 系统唯一标识 |
| system_name | string | 是 | 系统名称，按此字段去重 |
| resource_id | int | 是 | 关联的资源 ID，通过此 ID 查询 `wape_resource` 表自动获取 `resource_path` |
| session_id | string | 否 | OpenCode session ID |

### 逻辑

1. 按 `system_name` 查询 `biz_survey` 表，如果已存在则直接返回现有记录
2. 通过 `resource_id` 查询 `wape_resource` 表获取 `extracted_path`
3. 插入新记录

### 响应

```json
{
  "status": "completed",
  "id": 1,
  "system_id": "sys-001",
  "message": "业务测绘创建成功"
}
```

---

## 2. 启动 WebServer

**POST** `/wape/web_server_start`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，会转换为 `scan_task_id = "web_{web_id}"` |

### 逻辑

1. 通过 `web_id` (system_id) 查询 `biz_survey` 表，获取 `resource_path`
2. 拼装代码路径：`WAPE_RESOURCE_UPLOAD_ROOT_PATH + resource_path`
3. 调用 `start_server("web_{web_id}", code_path=...)` 启动 OpenCode 服务

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "web_server_id": "web_sys-001",
  "message": "WebServer 启动成功"
}
```

---

## 3. 停止 WebServer

**POST** `/wape/web_server_stop`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "web_server_id": "web_sys-001",
  "message": "WebServer 已停止"
}
```

---

## 4. 检查 WebServer 状态

**POST** `/wape/web_server_status`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

### 逻辑

1. 调用 `get_opencode_url("web_{web_id}")` 获取服务地址
2. 无地址 → `alive: false`
3. 有地址则调用 `client.health()` 验证
4. 异常 → `alive: false`

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "web_server_id": "web_sys-001",
  "alive": true,
  "message": "服务运行中"
}
```

---

## 5. 发送消息

**POST** `/wape/web_server_send_msg`

### 请求体

```json
{
  "web_id": "sys-001",
  "text": "请分析这个系统的业务逻辑"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，用于查找 biz_survey 记录和 server |
| text | string | 是 | 要发送的消息文本 |

### 逻辑

1. 通过 `web_id` (system_id) 查询 `biz_survey` 表，获取 `session_id`
2. 通过 `get_opencode_url("web_{web_id}")` 获取服务端地址
3. 如果 `session_id` 为空，自动创建新 session 并更新到 `biz_survey` 表
4. 调用 `client.send_message(session_id, {"parts": [{"type": "text", "text": text}]})` 发送消息

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "result": { "...": "OpenCode 返回的响应内容" },
  "message": "消息发送成功"
}
```

---

## 6. 异步发送消息

**POST** `/wape/web_server_send_msg_async`

### 请求体

```json
{
  "web_id": "sys-001",
  "text": "请分析这个系统的业务逻辑"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，用于查找 biz_survey 记录和 server |
| text | string | 是 | 要发送的消息文本 |

### 逻辑

1. 通过 `web_id` (system_id) 查询 `biz_survey` 表，获取 `session_id`
2. 通过 `get_opencode_url("web_{web_id}")` 获取服务端地址
3. 如果 `session_id` 为空，自动创建新 session 并更新到 `biz_survey` 表
4. 调用 `client.send_message_async(session_id, {"parts": [{"type": "text", "text": text}]})` 异步发送，不等待响应

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "message": "消息已异步发送"
}
```

---

## 数据库表结构

### biz_survey

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK) | 自增主键 |
| system_id | TEXT | 系统唯一标识 |
| system_name | TEXT | 系统名称 |
| resource_id | INTEGER | 关联资源 ID |
| resource_path | TEXT | 资源路径 |
| session_id | TEXT | OpenCode session ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
