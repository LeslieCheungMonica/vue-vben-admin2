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
| skip_exploit | string | 否 | 是否跳过利用阶段，`yes` 或 `no`，默认 `no` |

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
    "core_biz_sub_domain_demo": "创建订单、支付回调",
    "skip_exploit": "no"
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
      "api_example": "",
      "skip_exploit": "no",
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
| skip_exploit | string | 否 | 是否跳过利用阶段，`yes` 或 `no` |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_update \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "wape-20250516010101",
    "task_name": "新任务名称",
    "web_url": "https://new.example.com",
    "focus": "新的关注领域",
    "skip_exploit": "yes"
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

## 12b. 报告 HTML 预览

**GET** `/wape/report_html/{task_id}/{stage}`

在浏览器中直接展示指定阶段的漏洞报告 HTML。与 PDF 预览接口参数和 stage 值完全一致。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| stage | path | 是 | 阶段标识 |

```bash
open http://127.0.0.1:7654/wape/report_html/wape-20250516010101/recon
```

---

## 13. 下载报告压缩包

**GET** `/wape/download_report_zip/{task_id}`

打包下载 deliverables 目录下所有 HTML 文件（保留目录结构，仅包含 .md 开头的目录）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |

```bash
curl -o wape-20250516010101_report.zip http://127.0.0.1:7654/wape/download_report_zip/wape-20250516010101
```

返回 ZIP 文件，包含所有 HTML 报告文件，保持原有目录结构。

---

## 14. 健康检查

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

**GET** `/wape/biz_report_pdf/{task_id}/{biz_name}`

查看指定业务模块的漏洞报告 PDF。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| biz_name | path | 是 | 业务模块名称 |

```bash
# 浏览器直接打开
open http://127.0.0.1:7654/wape/biz_report_pdf/wape-20250516010101/ETL作业管理-作业画布
```

---

## 18b. 业务漏洞报告 HTML 预览

**GET** `/wape/biz_report_html/{task_id}/{biz_name}`

查看指定业务模块的漏洞报告 HTML。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| biz_name | path | 是 | 业务模块名称 |

```bash
open http://127.0.0.1:7654/wape/biz_report_html/wape-20250516010101/ETL作业管理-作业画布
```

---

## 19. 业务漏洞利用报告 PDF 预览

**GET** `/wape/biz_exploit_report_pdf/{task_id}/{biz_name}`

查看指定业务模块的漏洞利用报告 PDF。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| biz_name | path | 是 | 业务模块名称 |

```bash
# 浏览器直接打开
open http://127.0.0.1:7654/wape/biz_exploit_report_pdf/wape-20250516010101/ETL作业管理-作业画布
```

---

## 19b. 业务漏洞利用报告 HTML 预览

**GET** `/wape/biz_exploit_report_html/{task_id}/{biz_name}`

查看指定业务模块的漏洞利用报告 HTML。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | path | 是 | 任务 ID |
| biz_name | path | 是 | 业务模块名称 |

```bash
open http://127.0.0.1:7654/wape/biz_exploit_report_html/wape-20250516010101/ETL作业管理-作业画布
```

---

## 20. 业务线扫描范围选择

**POST** `/wape/biz_vuln_scan_scope_select`

用户选择/取消选择业务线扫描范围。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| items | array | 是 | 业务线选择列表 |

**items 元素结构:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| biz_name | string | 是 | 业务模块名称 |
| option | string | 是 | `select` 选中 / `cancel` 取消选中 |
| module_path | string | 否 | 模块路径 |
| domain | string | 否 | 所属域 |

```bash
curl -X POST http://127.0.0.1:7654/wape/biz_vuln_scan_scope_select \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "wape-20250516010101",
    "items": [
      {"biz_name": "ETL作业管理-作业画布", "option": "select", "module_path": "src/views/etl", "domain": "数据平台"},
      {"biz_name": "ETL作业管理-调度配置", "option": "cancel"}
    ]
  }'
```

```json
{
  "status": "completed",
  "message": "处理了 2 条记录"
}
```

---

## 21. 业务线扫描范围选择列表

**POST** `/wape/biz_vuln_scan_scope_select_list`

查询已选中的业务线列表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/biz_vuln_scan_scope_select_list \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "数据平台": [
        {"module_name": "ETL作业管理-作业画布", "module_path": "src/views/etl"},
        {"module_name": "ETL作业管理-调度配置", "module_path": "src/views/schedule"}
      ]
    },
    {
      "用户中心": [
        {"module_name": "用户管理", "module_path": "src/views/user"}
      ]
    }
  ]
}
```

---

## 22. 通用漏洞列表查询

**POST** `/wape/common_vuln_list`

查询指定任务的通用漏洞列表，支持 5 类漏洞类型。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| vuln_type | string | 是 | 漏洞类型：`auth`、`authz`、`injection`、`ssrf`、`xss` |

**vuln_type 对应表:**

| vuln_type | 数据库表 |
|----------|----------|
| `auth` | wape_auth_vuln_exploit_detail |
| `authz` | wape_authz_vuln_exploit_detail |
| `injection` | wape_injection_vuln_exploit_detail |
| `ssrf` | wape_ssrf_vuln_exploit_detail |
| `xss` | wape_xss_vuln_exploit_detail |

```bash
curl -X POST http://127.0.0.1:7654/wape/common_vuln_list \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101", "vuln_type": "auth"}'
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
  "message": "查询到 1 条 auth 漏洞"
}
```

---

## 23. 图片转 Base64

**POST** `/wape/image_to_base64`

将图片文件转换为 Base64 编码。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relative_path | string | 是 | 图片相对路径 |
| task_id | string | 是 | 任务 ID |

文件路径：`{WAPE_ROOT_PATH}/code-review-agent/work/{task_id}/{relative_path}`

```bash
curl -X POST http://127.0.0.1:7654/wape/image_to_base64 \
  -H "Content-Type: application/json" \
  -d '{"relative_path": "deliverables/report.png", "task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "转换成功: /path/to/work/wape-20250516010101/deliverables/report.png"
}
```

---

## 24. COSMIC 任务创建

**POST** `/cosmic/task_create`

创建 COSMIC 功能存在性判定任务。

| 参数 | 类型 | 必填 | 说明 |
|:-----|:-----|:-----|:-----|
| `code_resource_id` | int | 是 | 待分析的代码资源 ID（关联 wape_resource 表） |
| `cosmic_resource_id` | int | 是 | COSMIC Excel 资源 ID（关联 cosmic_resource 表） |
| `task_name` | string | 是 | 任务名称 |
| `sheet_spec` | string | 否 | 指定 Sheet，支持数字索引（如 `"0"`）或 Sheet 名称（如 `"功能点拆分表"`），默认自动匹配 |
| `col_one` | int | 否 | 一级模块列号（0-based），默认 `2`（C 列） |
| `col_two` | int | 否 | 二级模块列号（0-based），默认 `3`（D 列） |
| `col_three` | int | 否 | 三级模块列号（0-based），默认 `4`（E 列） |
| `col_moudle` | int | 否 | 功能过程列号（0-based），默认 `8`（I 列） |

```bash
curl -X POST http://127.0.0.1:7654/cosmic/task_create \
  -H "Content-Type: application/json" \
  -d '{
    "code_resource_id": 1,
    "cosmic_resource_id": 2,
    "task_name": "SDC COSMIC 评估",
    "sheet_spec": "功能点拆分表",
    "col_one": 2,
    "col_two": 3,
    "col_three": 4,
    "col_moudle": 8
  }'
```

```json
{
  "status": "completed",
  "task_id": "cosmic-20260524120000",
  "task_name": "SDC COSMIC 评估",
  "message": "任务创建成功"
}
```

---

## 25. 漏洞详情列表查询（关联利用表）

**POST** `/wape/vuln_detail_list`

根据 `source_table` 查询指定漏洞类型的详情，并 LEFT JOIN 关联的 `*_vuln_exploit_detail` 利用表（`biz` 类型额外通过 `biz_name` 关联）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| source_table | string | 是 | 来源表：`auth`、`authz`、`injection`、`ssrf`、`xss`、`biz` |
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页条数，默认 10 |
| confidence | string | 否 | 按置信度过滤：`高危`、`中危`、`低危` |

**来源表与 title 字段映射：**

| source_table | title 字段来源 |
|-------------|---------------|
| auth | missing_defense |
| authz | guard_evidence |
| injection | mismatch_reason |
| ssrf | missing_defense |
| xss | mismatch_reason |
| biz | missing_defense |

**返回字段说明：**

每条记录包含 detail 表全部字段 + 关联的 exploit 表字段（以 `exploit_` 前缀）。不存在的字段值为 `"NE"`（Not Exist）。

| 字段 | 说明 |
|------|------|
| source_table | 来源表标识 |
| id | 记录 ID |
| task_id | 任务 ID |
| create_time | 创建时间 |
| vuln_id | 漏洞编号 |
| vulnerability_type | 漏洞类型 |
| title | 标题（按上表映射） |
| confidence | 置信度（高危/中危/低危） |
| notes | 备注 |
| externally_exploitable | 是否可外部利用 |
| source_endpoint | 源端点 |
| vulnerable_code_location | 漏洞代码位置 |
| missing_defense | 缺失的防御 |
| exploitation_hypothesis | 利用假设 |
| suggested_exploit_technique | 建议利用技术 |
| endpoint | 端点（authz 表） |
| guard_evidence | 防护缺失证据（authz 表） |
| side_effect | 影响（authz 表） |
| reason | 原因（authz 表） |
| minimal_witness | 最小利用凭证（authz 表） |
| source | 来源（injection/xss 表） |
| combined_sources | 组合来源（injection 表） |
| path | 路径（injection/xss 表） |
| sink_call | 危险函数调用（injection 表） |
| slot_type | 注入槽类型（injection 表） |
| sanitization_observed | 过滤措施（injection 表） |
| concat_occurrences | 拼接位置（injection 表） |
| verdict | 判定（injection/xss 表） |
| mismatch_reason | 不匹配原因（injection/xss 表） |
| witness_payload | 验证 Payload |
| vulnerable_parameter | 漏洞参数（ssrf 表） |
| source_detail | 来源详情（xss 表） |
| sink_function | 危险函数（xss 表） |
| render_context | 渲染上下文（xss 表） |
| encoding_observed | 编码情况（xss 表） |
| biz_name | 业务模块名称（biz 表） |
| frontend_trigger | 前端触发点（biz 表） |
| full_call_chain | 完整调用链（biz 表） |
| exploit_title | 利用标题（关联 exploit 表） |
| exploit_severity | 利用严重级别 |
| exploit_status | 利用状态 |
| exploit_vuln_detail | 利用详情 |
| exploit_location | 利用位置 |
| exploit_blockers | 利用阻碍 |
| exploit_impact | 利用影响 |
| exploit_prerequisites | 利用前提 |
| exploit_steps | 利用步骤 |
| exploit_evidence | 利用证据 |

```bash
curl -X POST http://127.0.0.1:7654/wape/vuln_detail_list \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "wape-20250516010101",
    "source_table": "auth",
    "page": 1,
    "page_size": 10,
    "confidence": "高危"
  }'
```

```json
{
  "status": "completed",
  "items": [
    {
      "source_table": "auth",
      "id": 1,
      "task_id": "wape-20250516010101",
      "create_time": "2025-05-16 02:30:00",
      "vuln_id": "AUTH-VULN-01",
      "vulnerability_type": "认证绕过",
      "title": "自动化测试工号绕过短信验证码",
      "confidence": "高危",
      "notes": "严重后门，任何配置在NO_SMS_ACCESSNUM中的工号都可以绕过验证码",
      "externally_exploitable": "true",
      "source_endpoint": "POST /csf (4A认证)",
      "vulnerable_code_location": "AgentLoginSVC.java:147-159",
      "missing_defense": "自动化测试工号绕过短信验证码",
      "exploitation_hypothesis": "攻击者可以通过配置数据库中的NO_SMS_ACCESSNUM参数...",
      "suggested_exploit_technique": "测试工号_短信验证码绕过",
      "endpoint": "NE",
      "role_context": "NE",
      "guard_evidence": "NE",
      "side_effect": "NE",
      "reason": "NE",
      "minimal_witness": "NE",
      "source": "NE",
      "combined_sources": "NE",
      "path": "NE",
      "sink_call": "NE",
      "slot_type": "NE",
      "sanitization_observed": "NE",
      "concat_occurrences": "NE",
      "verdict": "NE",
      "mismatch_reason": "NE",
      "witness_payload": "NE",
      "vulnerable_parameter": "NE",
      "source_detail": "NE",
      "sink_function": "NE",
      "render_context": "NE",
      "encoding_observed": "NE",
      "biz_name": "NE",
      "frontend_trigger": "NE",
      "full_call_chain": "NE",
      "exploit_title": "",
      "exploit_severity": "",
      "exploit_status": "",
      "exploit_vuln_detail": "",
      "exploit_location": "",
      "exploit_blockers": "",
      "exploit_impact": "",
      "exploit_prerequisites": "",
      "exploit_steps": "",
      "exploit_evidence": ""
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 10,
  "message": "查询成功"
}
```

---

## 26. 复扫任务创建

**POST** `/wape/repeat_task_create`

创建复扫任务，记录到 `wape_repeat_task` 表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 关联的原扫描任务 ID |
| repeat_task_id | string | 否 | 复扫任务 ID，不传自动生成 |
| repeat_task_name | string | 是 | 复扫任务名称 |
| resource_id | int | 是 | 资源 ID |
| resource_path | string | 否 | 资源路径 |
| status | string | 否 | 状态，默认 `wait-to-start` |
| repeat_task_type | string | 否 | 复扫任务类型 |
| vuln_ids | string | 否 | 要复扫的漏洞 ID 列表（逗号分隔） |

```bash
curl -X POST http://127.0.0.1:7654/wape/repeat_task_create \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "wape-20250516010101",
    "repeat_task_name": "认证漏洞复扫",
    "resource_id": 1,
    "repeat_task_type": "auth",
    "vuln_ids": "AUTH-VULN-01,AUTH-VULN-02"
  }'
```

```json
{
  "status": "completed",
  "repeat_task_id": "wape-repeat-20250714010101",
  "repeat_task_name": "认证漏洞复扫",
  "task_id": "wape-20250516010101",
  "message": "复扫任务创建成功"
}
```

---

## 27. 复扫任务启动

**POST** `/wape/repeat_task_start`

异步启动复扫任务，自动从原任务获取 `web_url`、`login_flow`、`success_condition`。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| repeat_task_id | string | 是 | 复扫任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/repeat_task_start \
  -H "Content-Type: application/json" \
  -d '{"repeat_task_id": "wape-repeat-20250714010101"}'
```

```json
{
  "status": "processing",
  "message": "复扫任务已提交: wape-repeat-20250714010101"
}
```

---

## 28. 复扫任务列表查询

**POST** `/wape/repeat_task_list`

查询所有复扫任务，支持按 ID 模糊搜索。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| repeat_task_id_keyword | string | 否 | 按复扫任务 ID 模糊搜索 |

**返回字段说明：**

| 字段 | 说明 |
|------|------|
| repeat_task_id | 复扫任务 ID |
| repeat_task_name | 复扫任务名称 |
| resource_id | 资源 ID |
| resource_path | 资源路径 |
| status | 状态（wait-to-start / running / finish） |
| repeat_task_type | 复扫任务类型 |
| task_id | 关联的原扫描任务 ID |
| vuln_ids | 要复扫的漏洞 ID 列表 |
| created_at | 创建时间 |

```bash
curl -X POST http://127.0.0.1:7654/wape/repeat_task_list \
  -H "Content-Type: application/json" \
  -d '{"repeat_task_id_keyword": "wape-repeat-20250714"}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "repeat_task_id": "wape-repeat-20250714010101",
      "repeat_task_name": "认证漏洞复扫",
      "resource_id": 1,
      "resource_path": "",
      "status": "finish",
      "repeat_task_type": "auth",
      "task_id": "wape-20250516010101",
      "vuln_ids": "AUTH-VULN-01,AUTH-VULN-02",
      "created_at": "2025-07-14 01:01:01"
    }
  ],
  "message": "查询到 1 条记录"
}
```
