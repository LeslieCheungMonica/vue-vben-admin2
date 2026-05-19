# WAPE API 接口文档

**基础 URL:** `http://<host>:7654/wape`

---

## 1. 资源上传

**POST** `/wape/resource_upload`

上传 ZIP 文件到服务端，自动解压并记录到数据库。相同 `code` + `version` 会自动更新。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | ZIP 文件 |
| code | string | 是 | 资源标识 |
| version | string | 是 | 版本号 |
| description | string | 否 | 资源描述 |

```bash
curl -X POST http://127.0.0.1:7654/wape/resource_upload \
  -F "file=@/path/to/myapp.zip" \
  -F "code=myapp" \
  -F "version=v1.0" \
  -F "description=电商平台核心模块"
```

```json
{
  "status": "completed",
  "extracted_path": "/tmp/resource_uploads/myapp/v1.0/myapp",
  "message": "资源上传并解压完成: /tmp/resource_uploads/myapp/v1.0/myapp"
}
```

`extracted_path` 自动检测：若 zip 包含唯一根目录则指向该目录，否则指向 `code/version` 目录。

---

## 2. 资源删除

**POST** `/wape/resource_delete`

删除指定资源记录及对应的磁盘文件。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 资源 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/resource_delete \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

```json
{
  "status": "completed",
  "message": "资源已删除: id=1"
}
```

---

## 3. 资源列表查询

**POST** `/wape/resource_list`

查询已上传的资源列表，可选按 `code` 和 `version` 过滤。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 否 | 按资源标识过滤 |
| version | string | 否 | 按版本号过滤 |

```bash
curl -X POST http://127.0.0.1:7654/wape/resource_list \
  -H "Content-Type: application/json" \
  -d '{"code": "myapp"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "id": 1,
      "code": "myapp",
      "version": "v1.0",
      "description": "电商平台核心模块",
      "extracted_path": "/tmp/resource_uploads/myapp/v1.0/myapp"
    }
  ],
  "message": ""
}
```

---

## 4. 扫描任务创建

**POST** `/wape/task_create`

根据已上传的资源创建扫描任务，返回生成的 `task_id`。任务状态初始为 `wait-to-start`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| resource_id | int | 是 | 资源 ID |
| task_name | string | 是 | 任务名称 |
| web_url | string | 是 | 目标 Web 地址 |
| code_desc | string | 是 | 项目描述 |
| scan_scope | string | 是 | 扫描范围，逗号分隔：`auth`,`zuthz`,`inject`,`ssrf`,`xxs`,`biz` |
| focus | string | 否 | 重点关注领域 |
| login_flow | string | 否 | 登录流程说明 |
| success_condition | string | 否 | 登录成功判断条件 |
| core_biz_domain | string | 否 | 核心业务域 |
| core_biz_sub_domain_demo | string | 否 | 子业务域示例 |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_create \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": 1,
    "task_name": "myapp-安全扫描",
    "web_url": "https://example.com",
    "code_desc": "电商平台项目",
    "scan_scope": "auth,biz,inject",
    "focus": "认证授权",
    "login_flow": "表单登录，输入用户名密码后提交POST /api/login",
    "success_condition": "返回200且body包含token字段",
    "core_biz_domain": "订单系统",
    "core_biz_sub_domain_demo": "创建订单、支付回调"
  }'
```

```json
{
  "status": "completed",
  "task_id": "wape-20250516010101",
  "task_name": "myapp-安全扫描",
  "message": "任务创建成功"
}
```

---

## 5. 启动扫描任务

**POST** `/wape/task_start`

异步启动扫描任务，状态更新为 `running`。后台依次执行各阶段，结果写入 `wape_task_detail` 表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_start \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "processing",
  "message": "任务已提交: wape-20250516010101"
}
```

**后台阶段:**
| 阶段 | 模块 | 说明 | 条件 |
|------|------|------|------|
| pre_recon | `WapePreRecon` | 预侦察，分析源码提取安全架构 | 始终执行 |
| recon | `WapeRecon` | 侦察，关联外部扫描与代码 | 始终执行 |
| recon_graph | `ReconGraphGen` | 生成 mermaid 架构图 | 始终执行 |
| auth_vuln | `WapeAuthVuln` | 认证漏洞分析 | `scan_scope` 含 `auth` |
| auth_vuln_exploit | `WapeAuthVulnExploit` | 认证漏洞利用 | `scan_scope` 含 `auth` |

各阶段生成的 md 文件自动转 pdf。异常时状态更新为 `run-except`。

---

## 6. 任务列表查询

**POST** `/wape/task_list`

查询扫描任务列表，支持按 task_id 模糊搜索。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id_keyword | string | 否 | 任务 ID 模糊搜索关键字 |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_list \
  -H "Content-Type: application/json" \
  -d '{"task_id_keyword": "wape-2025"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "task_id": "wape-20250516010101",
      "task_name": "myapp-安全扫描",
      "resource_id": 1,
      "web_url": "https://example.com",
      "code_desc": "电商平台项目",
      "scan_scope": "auth,biz,inject",
      "focus": "认证授权",
      "login_flow": "",
      "success_condition": "",
      "core_biz_domain": "",
      "core_biz_sub_domain_demo": "",
      "resource_path": "/tmp/resource_uploads/myapp/v1.0/myapp",
      "status": "running",
      "created_at": "2025-05-16 01:01:01"
    }
  ]
}
```

---

## 7. 任务删除

**POST** `/wape/task_delete`

删除指定任务及关联的 detail 记录。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_delete \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "message": "任务已删除: wape-20250516010101"
}
```

---

## 8. 任务停止

**POST** `/wape/task_stop`

停止指定扫描任务，关闭 opencode 服务，并将状态改为 `stopped`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_stop \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "message": "任务已停止: wape-20250516010101"
}
```

---

## 9. 任务编辑

**POST** `/wape/task_update`

修改任务的配置信息，仅传需要修改的字段（未传或空值的字段保持不变）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| task_name | string | 否 | 任务名称 |
| web_url | string | 否 | 目标 Web 地址 |
| code_desc | string | 否 | 项目描述 |
| scan_scope | string | 否 | 扫描范围 |
| focus | string | 否 | 重点关注领域 |
| login_flow | string | 否 | 登录流程 |
| success_condition | string | 否 | 登录成功条件 |
| core_biz_domain | string | 否 | 核心业务域 |
| core_biz_sub_domain_demo | string | 否 | 子业务域示例 |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_update \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "wape-20250516010101",
    "task_name": "新任务名称",
    "web_url": "https://new.example.com",
    "focus": "新的关注领域"
  }'
```

```json
{
  "status": "completed",
  "message": "任务已更新: wape-20250516010101"
}
```

---

## 10. 任务状态说明

| 状态 | 说明 |
|------|------|
| `wait-to-start` | 已创建，等待启动 |
| `running` | 正在后台执行 |
| `stopped` | 已手动停止 |
| `run-except` | 执行异常 |

---

## 11. 事件流

**GET** `/wape/event_stream/{task_id}`

实时返回 opencode 服务端事件流（SSE 格式）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |

```bash
curl -N http://127.0.0.1:7654/wape/event_stream/wape-20250516010101
```

响应为 `text/event-stream` 格式的持续流：

```
data: {"type": "message", "content": "..."}
```

---

## 12. 报告 PDF 预览

**GET** `/wape/report_pdf/{task_id}/{stage}`

在浏览器中直接展示指定阶段的漏洞报告 PDF。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| stage | path | 是 | 阶段标识 |

支持的 `stage` 值：

| stage | 文件 |
|-------|------|
| `pre_recon` | 预侦察报告 |
| `recon` | 侦察报告 |
| `recon_graph` | 架构图 |
| `auth_vuln` | 认证漏洞分析 |
| `auth_vuln_exploit` | 认证漏洞利用证据 |
| `biz_recon` | 业务侦察报告 |

```bash
# 直接浏览器打开即可预览
open http://127.0.0.1:7654/wape/report_pdf/wape-20250516010101/recon
```

---

## 13. 健康检查

**GET** `/wape/health`

```bash
curl http://127.0.0.1:7654/wape/health
```

```json
{
  "status": "ok"
}

---

## 14. 认证漏洞列表查询

**POST** `/wape/auth_vuln_list`

查询指定任务的认证漏洞列表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/auth_vuln_list \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "id": 1,
      "task_id": "wape-20250516010101",
      "vuln_type": "session hijacking",
      "create_time": "2025-05-16 02:30:00",
      "vuln_id": "AUTH-001",
      "title": "会话固定攻击",
      "severity": "high",
      "status": "confirmed",
      "vuln_detail": "...",
      "location": "...",
      "blockers": "...",
      "impact": "...",
      "prerequisites": "...",
      "exploit_steps": "...",
      "evidence": "..."
    }
  ],
  "message": "查询到 1 条漏洞"
}
```

---

## 15. 业务面测绘数据

**POST** `/wape/biz_data`

查询业务面测绘的 JSON 数据。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/biz_data \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "data": [
    {
      "api": [...]
    },
    {
      "menu": [...]
    }
  ],
  "message": "读取到 2 个模块"
}
```

---

## 16. 业务漏洞列表查询

**POST** `/wape/biz_vuln_list`

查询指定任务的业务漏洞扫描结果列表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/biz_vuln_list \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "id": 1,
      "task_id": "wape-20250516010101",
      "stage": "biz-vuln-ETL作业管理-作业画布",
      "status": "success",
      "res": "ETL作业管理-作业画布",
      "created_at": "2025-05-16 03:00:00"
    }
  ],
  "message": "查询到 1 条记录"
}
```

---

## 17. 业务漏洞利用列表查询

**POST** `/wape/biz_vuln_exploit_list`

查询指定任务的业务漏洞利用结果列表。

| 参数 | 类型 | 必填 | 说明|
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| biz_name | string | 是 | 业务模块名称 |

```bash
curl -X POST http://127.0.0.1:7654/wape/biz_vuln_exploit_list \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101", "biz_name": "ETL作业管理-作业画布"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "id": 1,
      "task_id": "wape-20250516010101",
      "biz_name": "ETL作业管理-作业画布",
      "vuln_type": "业务逻辑",
      "create_time": "2025-05-16 03:00:00",
      "vuln_id": "BIZ-VULN-01",
      "title": "价格篡改",
      "severity": "高",
      "status": "成功利用",
      "category": "业务逻辑",
      "vuln_detail": "...",
      "location": "xxx.vue",
      "blockers": "",
      "impact": "支付金额篡改",
      "prerequisites": "需要登录",
      "exploit_steps": "1. xxx\n2. xxx",
      "evidence": "xxx"
    }
  ],
  "message": "查询到 1 条记录"
}
```

---

## 18. 业务漏洞报告 PDF 预览

**GET** `/wape/biz_report_pdf/{task_id}/{biz_name)`

查看指定业务模块的漏洞报告 PDF。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| biz_name | path | 是 | 业务模块名称 |

```bash
# 浏览器直接打开
open http://127.0.0.1:7654/wape/biz_report_pdf/wape-20250516010101/ETL作业管理-作业画布
```
```
