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

查询已上传的资源列表，可选按 `code` 和 `version` 过滤。自动关联 `wape_resource_keji` 表返回科技资源扩展字段。

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
      "extracted_path": "/tmp/resource_uploads/myapp/v1.0/myapp",
      "agent_name": "电商安全扫描",
      "agent_type": "漏洞扫描与渗透攻击测试",
      "target_system": "电商平台",
      "task_description": "对电商平台核心模块进行安全审计",
      "code_path": "/data/projects/myapp",
      "code_language": "Java,JavaScript",
      "kb_source": "文档库",
      "kb_url": "https://wiki.example.com/security",
      "doc_list": "[{\"name\":\"接口文档.docx\",\"synced\":true}]",
      "biz_arch_graph": "",
      "core_biz_modules": "[\"用户管理\",\"订单管理\",\"支付系统\"]",
      "core_data_tables": "[{\"en\":\"sys_user\",\"cn\":\"用户表\"},{\"en\":\"sys_order\",\"cn\":\"订单表\"}]",
      "git_repo": "https://github.com/example/myapp.git",
      "git_branch": "main",
      "git_username": "",
      "git_password": ""
    }
  ],
  "message": ""
}
```

---

## 3b. 科技资源更新

**POST** `/wape/resource_update_keji`

更新或新增科技资源信息。按 `id` 查询，存在则更新（仅传需要修改的字段），不存在则新增。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 资源 ID |
| agent_name | string | 否 | 智能体名称 |
| agent_type | string | 否 | 智能体类型：`漏洞扫描` 或 `漏洞扫描与渗透攻击测试` |
| target_system | string | 否 | 目标系统 |
| task_description | string | 否 | 任务描述 |
| version | string | 否 | 版本号 |
| code_path | string | 否 | 代码路径 |
| code_language | string | 否 | 代码语言，多选用逗号分隔 |
| kb_source | string | 否 | 知识库来源：`文档库` 或 `自定义上传` |
| kb_url | string | 否 | 知识库地址 |
| doc_list | string | 否 | 文档列表，JSON 格式 |
| biz_arch_graph | string | 否 | 业务架构图 |
| core_biz_modules | string | 否 | 核心业务模块，JSON 数组格式 |
| core_data_tables | string | 否 | 核心数据表，JSON 格式 |
| git_repo | string | 否 | 仓库地址（Git 地址） |
| git_branch | string | 否 | Git 分支 |
| git_username | string | 否 | Git 用户名 |
| git_password | string | 否 | Git 密码 |

```bash
curl -X POST http://127.0.0.1:7654/wape/resource_update_keji \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "agent_name": "更新后的智能体名称",
    "agent_type": "漏洞扫描",
    "version": "v2.0",
    "code_language": "Java,Python",
    "git_repo": "https://github.com/example/myapp.git",
    "git_branch": "main"
  }'
```

```json
{
  "status": "completed",
  "message": "资源已更新: id=1"
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

## 7. 任务执行阶段查询

**POST** `/wape/task_stage`

查询任务当前执行阶段，返回各阶段的运行状态、session信息等。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_stage \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101"}'
```

```json
{
  "status": "completed",
  "mertic_status": {
    "running": 1,
    "wait": 3,
    "finish": 1
  },
  "run_status": [
    {
      "stage": "pre_recon",
      "status": "running",
      "session_id": "sess_xxx",
      "created": 1783421575474,
      "updated": 1783421735474
    },
    {
      "stage": "recon",
      "status": "finish",
      "session_id": "sess_yyy",
      "created": 1783421575474,
      "updated": 1783421735474
    },
    {
      "stage": "recon_graph",
      "status": "wait"
    },
    {
      "stage": "biz_recon",
      "status": "wait"
    },
    {
      "stage": "biz_vuln",
      "status": "wait"
    }
  ],
  "message": "查询成功"
}
```

**返回字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| mertic_status | object | 统计信息 |
| mertic_status.running | int | 运行中的阶段数 |
| mertic_status.wait | int | 待运行的阶段数 |
| mertic_status.finish | int | 已完成的阶段数 |
| run_status | array | 各阶段详细状态 |
| run_status[].stage | string | 阶段名称：pre_recon/recon/recon_graph/biz_recon/biz_vuln |
| run_status[].status | string | 阶段状态：running/wait/finish |
| run_status[].session_id | string | OpenCode会话ID |
| run_status[].created | int | 会话创建时间(毫秒时间戳) |
| run_status[].updated | int | 会话更新时间(毫秒时间戳) |

**阶段列表：** `pre_recon` → `recon` → `recon_graph` → `biz_recon` → `biz_vuln`

**状态说明：**
- `running`: 运行中
- `wait`: 待运行
- `finish`: 已完成

---

## 8. 任务删除

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

## 9. 任务停止

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

## 10. 任务编辑

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

## 11. 任务状态说明

| 状态 | 说明 |
|------|------|
| `wait-to-start` | 已创建，等待启动 |
| `running` | 正在后台执行 |
| `stopped` | 已手动停止 |
| `run-except` | 执行异常 |

---

## 12. 事件流

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

## 13. 报告 PDF 预览

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

## 13b. 报告 HTML 预览

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

## 14. 下载报告压缩包

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

## 15. 健康检查

**GET** `/wape/health`

```bash
curl http://127.0.0.1:7654/wape/health
```

```json
{
  "status": "ok"
}

---

## 16. 认证漏洞列表查询

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

## 17. 业务面测绘数据

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

## 18. 业务漏洞列表查询

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

## 19. 业务漏洞利用列表查询

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

## 20. 业务漏洞报告 PDF 预览

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

## 20b. 业务漏洞报告 HTML 预览

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

## 21. 业务漏洞利用报告 PDF 预览

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

## 21b. 业务漏洞利用报告 HTML 预览

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

## 22. 业务线扫描范围选择

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

## 23. 业务线扫描范围选择列表

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

## 24. 通用漏洞列表查询

**POST** `/wape/common_vuln_list`

查询指定任务的通用漏洞列表，支持 5 类漏洞类型。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task_id | string | 是 | 任务 ID |
| vuln_type | string | 是 | 漏洞类型：`auth`、`authz`、`injection`、`ssrf`、`xss` |

**vuln_type 对应表:**

| vuln_type | 数据库表 |
|----------|----------|
| `auth` | wape_auth_vuln_detail |
| `authz` | wape_authz_vuln_detail |
| `injection` | wape_injection_vuln_detail |
| `ssrf` | wape_ssrf_vuln_detail |
| `xss` | wape_xss_vuln_detail |

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

## 25. 图片转 Base64

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

## 26. COSMIC 任务创建

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

## 27. 任务会话消息查询（分页）

**POST** `/wape/task_session_messages`

查询指定任务的所有 AI 会话消息记录，按 message 维度分页返回。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| task_id | string | 是 | — | 任务 ID |
| page | int | 否 | 1 | 页码 |
| page_size | int | 否 | 20 | 每页消息数（最大 200） |

```bash
curl -X POST http://127.0.0.1:7654/wape/task_session_messages \
  -H "Content-Type: application/json" \
  -d '{"task_id": "wape-20250516010101", "page": 1, "page_size": 20}'
```

```json
{
  "status": "completed",
  "items": [
    {
      "session_id": "abc123",
      "stage": "pre_recon",
      "data": { "parts": [{"type": "text", "text": "..."}] },
      "time_created": 1747357261
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8,
  "message": "共 150 条消息，当前第 1/8 页"
}
```
