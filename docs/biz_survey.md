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
                    },
                    {
                        "name": "AddEnterpriseMemberSVC.qryANCenter",
                        "file": "AddEnterpriseMemberSVC.java",
                        "params": "String",
                        "returns": "String",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "BatchAddEntMemberSVC.doService",
                        "file": "BatchAddEntMemberSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberApprovalCentreSVC.doService",
                        "file": "AddEntMemberApprovalCentreSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberApprovalCentreSVC.callApprovalCentre",
                        "file": "AddEntMemberApprovalCentreSVC.java",
                        "params": "String",
                        "returns": "TreeListPart",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberApprovalCentreSVC.buildGroupBusiExt",
                        "file": "AddEntMemberApprovalCentreSVC.java",
                        "params": "",
                        "returns": "TreePart",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberApprovalCentreSVC.addApprove",
                        "file": "AddEntMemberApprovalCentreSVC.java",
                        "params": "",
                        "returns": "String",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberApprovalCentreSVC.checkApprove",
                        "file": "AddEntMemberApprovalCentreSVC.java",
                        "params": "",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.doService",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.addEntMember",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.delEntMember",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.chEntMember",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.batAddEntMember",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.batDelEntMember",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.sendAddTwoConfirmSMS",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.sendDelTwoConfirmSMS",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.sendChTwoConfirmSMS",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.setRequest",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "TreePart",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DirectOperateEntMemberSVC.changeDealState",
                        "file": "DirectOperateEntMemberSVC.java",
                        "params": "String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "CallbackEntMemberSVC.doService",
                        "file": "CallbackEntMemberSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "SmsOperEntMemberSVC.doService",
                        "file": "SmsOperEntMemberSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "SmsOperEntMemberSVC.batAddEnterpriseMember",
                        "file": "SmsOperEntMemberSVC.java",
                        "params": "TreePart,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "SmsOperEntMemberSVC.batDelEnterpriseMember",
                        "file": "SmsOperEntMemberSVC.java",
                        "params": "TreePart,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "SmsOperEntMemberSVC.delEnterpriseMember",
                        "file": "SmsOperEntMemberSVC.java",
                        "params": "TreePart",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "UpdateEnterpriseMemberSVC.doService",
                        "file": "UpdateEnterpriseMemberSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DeleteEnterpriseSVC.doService",
                        "file": "DeleteEnterpriseSVC.java",
                        "params": "ServiceRequest",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DeleteEnterpriseSVC.queryValidEntKeyman",
                        "file": "DeleteEnterpriseSVC.java",
                        "params": "String,String",
                        "returns": "boolean",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DeleteEnterpriseSVC.validOffer",
                        "file": "DeleteEnterpriseSVC.java",
                        "params": "",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "DeleteEnterpriseSVC.checkOfferIdBySubsId",
                        "file": "DeleteEnterpriseSVC.java",
                        "params": "String",
                        "returns": "Boolean",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberEditInfoSVC.addEntMemberEditInfo",
                        "file": "AddEntMemberEditInfoSVC.java",
                        "params": "",
                        "returns": "String",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "AddEntMemberEditInfoSVC.StringSubsection",
                        "file": "AddEntMemberEditInfoSVC.java",
                        "params": "String,int",
                        "returns": "List<String>",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.syncAllGroup",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "ServiceRequest,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.syncAllGroup",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "DataContainer,String,String,boolean",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.checkBeforeAllGroupSyn",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "ServiceRequest",
                        "returns": "String",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.insertToBboss",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "Map<String,String>",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.updateEnterpriseSynstate",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "DataContainer,String,String",
                        "returns": "void",
                        "confidence": "confirmed"
                    },
                    {
                        "name": "syncAllUtil.setEcSerialNumber",
                        "file": "syncAllUtil/syncAllUtil.java",
                        "params": "DataContainer",
                        "returns": "DataContainer",
                        "confidence": "confirmed"
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
                            },
                            {
                                "name": "PARTY_ID",
                                "type": "long",
                                "required": true
                            },
                            {
                                "name": "ACCESS_NUM",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "CUST_ID",
                                "type": "long",
                                "required": true
                            },
                            {
                                "name": "SUBSCRIBER_INS_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "MEMBER_CUST_ID",
                                "type": "long",
                                "required": true
                            },
                            {
                                "name": "USECUST_ID",
                                "type": "long",
                                "required": false
                            },
                            {
                                "name": "MEMBER_CUST_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "JOIN_TYPE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "JOIN_DATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "JOIN_OP_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "JOIN_ORG_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "DATA_STATUS",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "VALID_DATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "EXPIRE_DATE",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DONE_DATE",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "MGMT_DISTRICT",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "MGMT_COUNTY",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "REGION_ID",
                                "type": "string",
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
                            },
                            {
                                "name": "GROUP_MEB_ID",
                                "type": "long",
                                "required": true
                            },
                            {
                                "name": "PARTY_ID",
                                "type": "long",
                                "required": false
                            },
                            {
                                "name": "MEMBER_KIND",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "MEMBER_BELONG",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "JOIN_TYPE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "JOIN_DATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "VALID_DATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "DATA_STATUS",
                                "type": "string",
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
                            },
                            {
                                "name": "IMPORT_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "GROUP_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "GROUP_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "ACCESS_NUM",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_STATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "DEAL_OP_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_ORG_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_DESC",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_DATE",
                                "type": "date",
                                "required": false
                            },
                            {
                                "name": "CONFIRM_DATE",
                                "type": "date",
                                "required": false
                            },
                            {
                                "name": "DEAL_OPTION",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "FILE_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "FILE_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "BAT_FILE_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "BAT_FILE_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "SUCC_FILE_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "SUCC_FILE_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "APPLAY_DATE",
                                "type": "date",
                                "required": true
                            },
                            {
                                "name": "APPLAY_OP_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "APPLAY_ORG_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "OPER_TYPE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "APPLAY_DETIAL1",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "APPLAY_DETIAL2",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "APPLAY_DETIAL3",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR1",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR2",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR3",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR4",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR5",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR6",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR7",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR8",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR9",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR10",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "CHANNEL_TYPE",
                                "type": "string",
                                "required": false
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
                            },
                            {
                                "name": "ORGA_ENTERPRISE_ID",
                                "type": "long",
                                "required": true
                            },
                            {
                                "name": "KEYMAN_TYPE",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "KEYMAN_NAME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "KEYMAN_DUTY",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "KEYMAN_GENDER",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DOCUMENT_TYPE",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DOCUMENT_NR",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "COMPANY_PHONE",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "CONT_PHONE2",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "EXPIRE_DATE",
                                "type": "date",
                                "required": false
                            },
                            {
                                "name": "DATA_STATUS",
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
                            },
                            {
                                "name": "RSRV_STR1",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR2",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "RSRV_STR3",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_STATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "DEAL_OP_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_TIME",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_ORG_ID",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DEAL_DESC",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "GROUP_MEN_TAG",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "TO_GROUPMEN_TAG",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "SERIAL_NUMBER",
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
                            },
                            {
                                "name": "GROUP_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "EC_USER_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "CUST_NAME",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "CUST_MANAGER_ID",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "ACTION",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "EC_SERIAL_NUMBER",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "FSYNC_STATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "STATE",
                                "type": "string",
                                "required": true
                            },
                            {
                                "name": "DATA_LIST1",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "DATA_LIST2",
                                "type": "string",
                                "required": false
                            },
                            {
                                "name": "CUST_LIST1",
                                "type": "string",
                                "required": false
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
                        "description": "成员加入集团不足30天(仅A~C级集团)且无ENT_MEB_DEL权限禁止删除",
                        "location": "DeleteEnterpriseSVC L91-95",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "成员在集团担任有效关键人(EXPIRE_DATE>SYSDATE且DATA_STATUS=1)禁止删除",
                        "location": "DeleteEnterpriseSVC L87-90 / queryValidEntKeyman",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "车友助理业务(offer 1000012572/1000012573)合约期内禁止退订集团",
                        "location": "DeleteEnterpriseSVC.checkOfferIdBySubsId L345",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "有盖章证明材料(FILE_ID非空)则无需二次确认；否则发送二次确认短信,状态置C等待确认",
                        "location": "DirectOperateEntMemberSVC add/del/chEntMember",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "CRMFlowCode 1/2/3无二次确认,4/5/6有二次确认(COND_KEY T1)",
                        "location": "AddEntMemberApprovalCentreSVC.callApprovalCentre L104-124",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "关键人类型中账务联系人(角色8)为必填(开关ENT_KEYMAN_TYPE_TAG,默认Y),新增/变更时校验",
                        "location": "syncAllUtil.syncAllGroup L395-397",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "证件类型为军队代码(9)时一级行业类别必须在国防(U)大类下",
                        "location": "syncAllUtil.syncAllGroup L297-317",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "集团同步仅限云南省内(集团客户归属省代码=871)",
                        "location": "syncAllUtil.checkBeforeAllGroupSyn",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "AB类/AB类以下集团成员操作(新增/变更/注销)仅允许看管客户经理操作",
                        "location": "CheckChangeEntMemberByABGroupSVC / AddGrpMember.queryGroupInfo",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "集团成员变更集团信息时,若有指定活动生效(checkBeforeChgEntMemActive)禁止变更集团",
                        "location": "CheckBeforeChgEntMemActiveSVC / UpdateEnterpriseMemberSVC L105",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "申请处理状态机:W等待审批/R不通过/C等待二次确认/S非二次成功/F非二次失败/O二次成功/N二次失败/U用户拒绝;仅W状态可受理",
                        "location": "DirectOperateEntMemberSVC L76-79 / CallbackEntMemberSVC",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "修改成员采用删旧增新:老记录置EXPIRE/DATA_STATUS=0,新增新记录",
                        "location": "UpdateEnterpriseMemberSVC L148-155",
                        "confidence": "confirmed"
                    },
                    {
                        "description": "成员申请详情按4000字节分段,超3段(12000字符)报错",
                        "location": "AddEntMemberEditInfoSVC.StringSubsection L77-80",
                        "confidence": "confirmed"
                    }
                ],
                "dependencies": [
                    "com.ai.apaas.core.party.service.interfaces.IEnterpriseOperateSV",
                    "com.ai.apaas.core.party.service.interfaces.IEnterpriseQuerySV",
                    "com.ai.apaas.core.party.service.interfaces.IPartyQuerySV",
                    "com.ai.apaas.core.customer.service.interfaces.ICustomerQuerySV",
                    "com.ai.apaas.core.product.service.interfaces.ISubScriberInstQuerySV",
                    "com.ai.apaas.local.party.service.interfaces.ICbEnterpriseOperateSV",
                    "com.ai.apaas.local.party.common.PartyLocalConstant",
                    "com.ai.apaas.local.party.service.interfaces.ICsBenefitPrjQuerySV",
                    "com.ai.apaas.local.party.service.interfaces.ICsBenefitPrjOperateSV",
                    "com.ai.apaas.local.party.service.interfaces.ICbCmsImportBatQuerySV",
                    "com.ai.apaas.local.party.service.interfaces.ICbCmsImportBatOperateSV",
                    "com.ai.apaas.local.secframe.service.interfaces.IOrgStaffLQuerySV",
                    "com.ai.apaas.local.param.service.interfaces.IBsParaDetailQuerySV",
                    "com.ai.apaas.local.sync.bo.BoSyncCustGroupmemberBean",
                    "com.ai.apaas.custmgr.svc.insvc.OcCall",
                    "com.ai.apaas.busiframe.xcaller.CsfCaller",
                    "com.ai.ipaas.busiframe.util.ExecuteSqlUtil",
                    "com.ai.apaas.busiframe.rocketmq.util.TransactionUtils",
                    "com.ai.apaas.common.rocketmq.RMQMessageInfo",
                    "OrderCentre.enterprise.IUmSubScriberSV.querySubscriberByAccessNum",
                    "OrderCentre.enterprise.IOutEcMemberQuerySV.queryIfDeleteCustRelation",
                    "OrderCentre.person.offer.ISubscriberOfferSV.queryOfferInsByAccessNum",
                    "AP.approval.flowInstance",
                    "CustomerCentre.common.IBatImportQuerySV.batchImportDealNew",
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
