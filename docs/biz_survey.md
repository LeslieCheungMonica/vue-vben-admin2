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

## 7. 新建会话

**POST** `/wape/web_server_create_session`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，用于查找 biz_survey 记录和 server |

### 逻辑

1. 通过 `web_id` (system_id) 查询 `biz_survey` 表，获取当前 `session_id` 和 `session_his`
2. 通过 `get_opencode_url("web_{web_id}")` 获取服务端地址
3. 调用 `client.create_session()` 创建新会话
4. 更新 `biz_survey` 表的 `session_id` 为新会话 ID
5. 更新 `session_his`：将旧 `session_id` 以逗号分隔追加到原值（去重处理）

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "session_id": "new-session-xxx",
  "session_his": "old-session-xxx",
  "message": "新会话创建成功"
}
```

---

## 9. 获取 3D 模块数据

**POST** `/wape/moudles_3d`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，用于查找 biz_survey 记录和 source_path |

### 逻辑

1. 通过 `web_id` (resource_id) 查询 `biz_survey` 表，获取 `resource_path` 作为 `source_path`
2. 拼接完整路径：`WAPE_RESOURCE_UPLOAD_ROOT_PATH + resource_path`
3. 定位其下 `_deep-code-sdd` 目录
4. 递归遍历该目录，找出所有 `modules.json` 文件并解析
5. 将每个文件的 JSON 内容组装为一个大数组（若为数组则展开合并，若为对象则追加）

### 响应

```json
{
    "status": "completed",
    "modules": [
        {
            "generated_at": "2026-08-10T10:19:58+0800",
            "modules": [
                {
                    "name": "entmembermgr",
                    "path": "src/com/ai/apaas/custmgr/svc/entmembermgr",
                    "purpose": "企业成员管理（集团成员新增/删除/变更/批量导入/审批中心/二次短信确认/资料修改表/同步）",
                    "primary_files": [
                        "AddEnterpriseMemberSVC.java",
                        "BatchAddEntMemberSVC.java",
                        "UpdateEnterpriseMemberSVC.java",
                        "DeleteEnterpriseSVC.java",
                        "AddEntMemberApprovalCentreSVC.java",
                        "DirectOperateEntMemberSVC.java",
                        "CallbackEntMemberSVC.java",
                        "SmsOperEntMemberSVC.java",
                        "AddEntMemberEditInfoSVC.java",
                        "syncAllUtil/syncAllUtil.java"
                    ],
                    "functions": [
                        {
                            "name": "AddEnterpriseMemberSVC.doService",
                            "file": "AddEnterpriseMemberSVC.java",
                            "params": "ServiceRequest",
                            "returns": "void",
                            "confidence": "confirmed"
                        },
                        {
                            "name": "AddEnterpriseMemberSVC.genOrderHisInfo",
                            "file": "AddEnterpriseMemberSVC.java",
                            "params": "ServiceRequest,String,DataContainer,String,String,String",
                            "returns": "void",
                            "confidence": "confirmed"
                        }
                    ],
                    "core_functions": [
                        {
                            "function": "syncAllUtil.syncAllGroup",
                            "function_desc": "全网集团注册同步(BBOSS)、多级条件(客户经理校验/ACTION新增修改/信用等级与行业类别映射/关键人遍历、DataList超长分",
                            "core_function_reason": "全网集团注册同步(BBOSS)、多级条件(客户经理校验/ACTION新增修改/信用等级与行业类别映射/关键人遍历、DataList超长分段keyMan1/2)、含2层嵌套循环(关键人for+行业类别for)、外部服务调用(CsfCaller queryEntInfoByBBOSS/IBOSSCaller/DBUtil SQL)、圈复杂度极高(147KB工具类)",
                            "file_path": "/Users/liyanhui/work/code-review-agent-datas/code-review-agent/codes/crm-customer5/v5/CRM-yunnan-CustomerCentre-07/src/com/ai/apaas/custmgr/svc/entmembermgr/syncAllUtil/syncAllUtil.java",
                            "frontend_file_path": []
                        },
                        {
                            "function": "OperationEntMemberApprovalCentreTQSVC.doService",
                            "function_desc": "特权变更流程中心审批发起、多方法分发",
                            "core_function_reason": "特权变更流程中心审批发起、多方法分发(callApprovalCentre ADD/DEL/BatCH)、含2层嵌套条件(OPER_TYPE+流程条件COND_KEY 1-6)、外部服务调用(CsfCaller AP.approval.flowInstance/BusiFrame.ftpmgr/IEntMemberEditSV)、圈复杂度高",
                            "file_path": "/Users/liyanhui/work/code-review-agent-datas/code-review-agent/codes/crm-customer5/v5/CRM-yunnan-CustomerCentre-07/src/com/ai/apaas/custmgr/svc/entmembermgr/OperationEntMemberApprovalCentreTQSVC.java",
                            "frontend_file_path": [
                                "html/customer/cs/entmembermgr/addmember/ChGrpMemberTQ.page",
                                "html/customer/cs/entmembermgr/addmember/EnterpriseMemberTQ.page"
                            ]
                        }
                    ],
                    "entities": [
                        {
                            "name": "CB_ENTERPRISE_MEMBER",
                            "fields": [
                                {
                                    "name": "GROUP_MEB_ID",
                                    "type": "long",
                                    "required": true
                                }
                            ],
                            "confidence": "inferred"
                        },
                        {
                            "name": "CB_ENTERPRISE_MEMBER_REL",
                            "fields": [
                                {
                                    "name": "GROUP_MEB_REL_ID",
                                    "type": "long",
                                    "required": true
                                }
                            ],
                            "confidence": "inferred"
                        },
                        {
                            "name": "CB_ENTMEMBER_EDIT",
                            "fields": [
                                {
                                    "name": "APPLAY_ID",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "name": "SMS_PORT_ID",
                                    "type": "string",
                                    "required": true
                                }
                            ],
                            "confidence": "confirmed"
                        },
                        {
                            "name": "CB_ENTERPRISE_KEYMAN",
                            "fields": [
                                {
                                    "name": "FAMILY_PHONE",
                                    "type": "string",
                                    "required": true
                                }
                            ],
                            "confidence": "confirmed"
                        },
                        {
                            "name": "CB_IMPORT_DATA",
                            "fields": [
                                {
                                    "name": "IMPORT_ID",
                                    "type": "string",
                                    "required": true
                                }
                            ],
                            "confidence": "confirmed"
                        },
                        {
                            "name": "CB_IMPORT_BAT",
                            "fields": [
                                {
                                    "name": "IMPORT_ID",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "name": "DEAL_STATE",
                                    "type": "string",
                                    "required": true
                                }
                            ],
                            "confidence": "confirmed"
                        },
                        {
                            "name": "CB_ENT_TOBBOSS",
                            "fields": [
                                {
                                    "name": "TOBBOSS_ID",
                                    "type": "string",
                                    "required": true
                                },
                                {
                                    "name": "ORGA_ENTERPRISE_ID",
                                    "type": "string",
                                    "required": true
                                }
                            ],
                            "confidence": "confirmed"
                        }
                    ],
                    "business_rules": [
                        {
                            "description": "同一集团虚拟用户判断：qryANCenter(accessNum)==0 且成员客户≠集团客户时禁止新增成员",
                            "location": "AddEnterpriseMemberSVC.doService L145 / UpdateEnterpriseMemberSVC L122",
                            "confidence": "confirmed"
                        },
                        {
                            "description": "成员申请详情按4000字节分段,超3段(12000字符)报错",
                            "location": "AddEntMemberEditInfoSVC.StringSubsection L77-80",
                            "confidence": "confirmed"
                        }
                    ],
                    "dependencies": [
                        "CustomerCentre.custmgr.ICCOutOperateSV.sendSingleSms",
                        "CustomerCentre.custmgr.ICCIBOSSOutOperateSV.ecBbossSync"
                    ],
                    "algorithms": [
                        {
                            "name": "成员申请详情分段算法(StringSubsection)",
                            "desc": "按字符双字节计数(中文字符记2字节)将长字符串按4000字节分段为最多3段,存入APPLAY_DETIAL1..3",
                            "confidence": "confirmed"
                        },
                        {
                            "name": "CRMFlowCode→审批条件表达式映射",
                            "desc": "1-6映射COND_KEY T0/T1,决定流程走向与是否二次确认",
                            "confidence": "confirmed"
                        },
                        {
                            "name": "批量同步分批算法",
                            "desc": "每10条为一组同步集团成员(OcCall.syncCustGroupMember)",
                            "confidence": "confirmed"
                        },
                        {
                            "name": "信用/客户级别→BBOSS编码映射",
                            "desc": "A1→01,A2→02,B1→03,B2→04,C→05,D→06",
                            "confidence": "confirmed"
                        },
                        {
                            "name": "删旧增新式成员变更",
                            "desc": "修改成员时置旧记录过期并新增记录,同步时按MODIFY_TAG区分",
                            "confidence": "confirmed"
                        }
                    ],
                    "complexity": "high"
                }
            ]
        }
    ],
    "message": "模块数据加载成功"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态，恒为 `completed` |
| modules | array | 所有 modules.json 组装后的 JSON 数组；未找到 `_deep-code-sdd` 目录时返回空数组 |
| message | string | 提示信息 |

---


---

## 10. 终止会话

**POST** `/wape/session_abort`

### 请求体

```json
{
  "web_id": "sys-001"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| web_id | string | 是 | 系统 ID，用于查找 biz_survey 记录和 server |

### 逻辑

1. 通过 `web_id` (resource_id) 查询 `biz_survey` 表，获取当前 `session_id`
2. 通过 `get_opencode_url("web_{web_id}")` 获取服务端地址
3. 调用 `client.abort_session(session_id)` 中止正在运行的会话

### 响应

```json
{
  "status": "completed",
  "web_id": "sys-001",
  "aborted": true,
  "message": "会话已终止"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态，恒为 `completed` |
| web_id | string | 系统 ID |
| aborted | boolean | 是否成功终止会话 |
| message | string | 提示信息 |

---

## 11. 更新业务测绘记录

**POST** `/wape/biz_survery_update`

### 请求体

```json
{
  "system_name": "订单系统",
  "resource_id": 2
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| system_name | string | 是 | 系统名称，用于定位要更新的 biz_survey 记录 |
| resource_id | int | 是 | 新的资源 ID，通过此 ID 查询 `wape_resource` 表自动获取新的 `resource_path` |

### 逻辑

1. 通过 `system_name` 查询 `biz_survey` 表，定位最近的记录
2. 通过 `resource_id` 查询 `wape_resource` 表获取新的 `resource_path`
3. 更新该记录的 `resource_id` 和 `resource_path` 字段及 `updated_at`

### 响应

```json
{
  "status": "completed",
  "system_name": "订单系统",
  "resource_id": 2,
  "resource_path": "path/to/resource",
  "message": "业务测绘更新成功"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态，恒为 `completed` |
| system_name | string | 系统名称 |
| resource_id | int | 更新后的资源 ID |
| resource_path | string | 更新后的资源路径 |
| message | string | 提示信息 |

---

## 12. 测绘列表

**POST** `/wape/biz_survey_list`

无请求体。

### 逻辑

查询 `biz_survey` 表，按 `id` 降序返回所有记录，排除 `system_id` 字段。

### 响应

```json
{
  "status": "completed",
  "records": [
    {
      "id": 1,
      "system_name": "订单系统",
      "resource_id": 1,
      "resource_path": "path/to/resource",
      "session_id": "sess-xxx",
      "session_his": "sess-xxx",
      "created_at": "2026-08-10 12:00:00",
      "updated_at": "2026-08-10 12:00:00"
    }
  ],
  "message": "测绘列表查询成功"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 状态，恒为 `completed` |
| records | array | 测绘记录数组（不含 system_id） |
| message | string | 提示信息 |

`records` 中每项字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 自增主键 |
| system_name | string | 系统名称 |
| resource_id | int | 关联资源 ID |
| resource_path | string | 资源路径 |
| session_id | string | 当前 OpenCode session ID |
| session_his | string | 历史 session ID |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

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
| session_id | TEXT | 当前 OpenCode session ID |
| session_his | TEXT | 历史 session ID（逗号分隔） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |
