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
[
  {
    "generated_at": "2026-08-11T09:55:49Z",
    "modules": [
      {
        "name": "entmgr",
        "path": "src/com/ai/apaas/custmgr/svc/entmgr/",
        "purpose": "集团客户全生命周期管理：新增、修改、审核、销户、客户经理调配、批量导入、短信审批与全网(BBOSS)同步",
        "primary_files": [
          "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/CancelEnterpriseSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseForAuditPassSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/UpdateSubmitCheckSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEntBaseInfoSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/QueryEnterpriseByParamsSVC.java",
          "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseKeymanSVC.java",
          "src/com/ai/apaas/custmgr/service/interfaces/IEntOperateSV.java",
          "src/com/ai/apaas/custmgr/service/interfaces/IEntQuerySV.java"
        ],
        "functions": [
          {
            "name": "addEnterprise",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse(DATAS)",
            "confidence": "confirmed"
          },
          {
            "name": "modifyEnterpriseInfoForDispatch",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse(SUCCESSA/FAILA/SUCCESSB/FAILAB)",
            "confidence": "confirmed"
          },
          {
            "name": "addToBboss",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java",
            "params": [
              "DataContainer dc"
            ],
            "returns": "void(同步全网集团)",
            "confidence": "confirmed"
          },
          {
            "name": "cancelEnterprise",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/CancelEnterpriseSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "updateSubmitCheck",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/UpdateSubmitCheckSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "addEnterpriseForAuditPass",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseForAuditPassSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "modifyEntBaseInfo",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEntBaseInfoSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "modifyEnterpriseKeyman",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseKeymanSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "queryEnterpriseByParams",
            "file": "src/com/ai/apaas/custmgr/svc/entmgr/QueryEnterpriseByParamsSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse(集团列表)",
            "confidence": "confirmed"
          }
        ],
        "entities": [
          {
            "name": "Enterprise",
            "fields": [
              {
                "name": "GROUP_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "ORGA_ENTERPRISE_ID",
                "type": "long",
                "required": true
              },
              {
                "name": "GROUP_TYPE",
                "type": "String",
                "required": true
              },
              {
                "name": "CLASS_ID",
                "type": "String",
                "required": false
              },
              {
                "name": "GROUP_STATUS",
                "type": "String",
                "required": true
              },
              {
                "name": "CUST_MANAGER_ID",
                "type": "String",
                "required": false
              },
              {
                "name": "BUSI_LICENCE_NO",
                "type": "String",
                "required": false
              },
              {
                "name": "JURISTIC_NAME",
                "type": "String",
                "required": false
              },
              {
                "name": "MP_GROUP_CODE",
                "type": "String",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "EnterpriseKeyman",
            "fields": [
              {
                "name": "KEYMAN_TYPE",
                "type": "String",
                "required": false
              },
              {
                "name": "KEYMAN_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "KEYMAN_DUTY",
                "type": "String",
                "required": false
              },
              {
                "name": "FAMILY_PHONE",
                "type": "String",
                "required": false
              },
              {
                "name": "COMPANY_PHONE",
                "type": "String",
                "required": false
              },
              {
                "name": "DOCUMENT_TYPE",
                "type": "String",
                "required": false
              },
              {
                "name": "DOCUMENT_NR",
                "type": "String",
                "required": false
              },
              {
                "name": "KEYMAN_GENDER",
                "type": "String",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "EntDispLog",
            "fields": [
              {
                "name": "OPER_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "ORGA_ENTERPRISE_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "CUST_MGR_ID_OLD",
                "type": "String",
                "required": false
              },
              {
                "name": "CUST_MGR_ID_NEW",
                "type": "String",
                "required": false
              },
              {
                "name": "DEAL_STATE",
                "type": "String",
                "required": true
              },
              {
                "name": "INSERT_TIME",
                "type": "Date",
                "required": false
              },
              {
                "name": "UPDATE_TIME",
                "type": "Date",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "EntIdInfoProv",
            "fields": [
              {
                "name": "LOG_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "UNIT_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "UNIT_CODE",
                "type": "String",
                "required": true
              },
              {
                "name": "UNIT_ADDR",
                "type": "String",
                "required": false
              },
              {
                "name": "UNIT_LEAD",
                "type": "String",
                "required": false
              },
              {
                "name": "CHECK_TYPE_CODE",
                "type": "String",
                "required": true
              },
              {
                "name": "SOURCE_TYPE",
                "type": "String",
                "required": true
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "EntBase",
            "fields": [
              {
                "name": "BASE_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_ADDR",
                "type": "String",
                "required": false
              }
            ],
            "confidence": "inferred"
          },
          {
            "name": "EnterpriseAdversary",
            "fields": [
              {
                "name": "GROUP_ADVERSARY",
                "type": "String",
                "required": false
              }
            ],
            "confidence": "inferred"
          }
        ],
        "business_rules": [
          {
            "description": "云南归属省代码校验：PROVINCE_CODE=YUNN 时归一化为 871",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseSVC.java:251",
            "confidence": "confirmed"
          },
          {
            "description": "集团编码唯一性：生成后循环查询直至不重复",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseSVC.java:727",
            "confidence": "confirmed"
          },
          {
            "description": "客户证件扫描件不能为空",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/AddEnterpriseSVC.java:668",
            "confidence": "confirmed"
          },
          {
            "description": "客户级别A1->信用01, A2->02, B1->03, B2->04, C->05, D->06",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java:391",
            "confidence": "confirmed"
          },
          {
            "description": "企业规模A->1, B->2, C->3, 默认->1",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java:531",
            "confidence": "confirmed"
          },
          {
            "description": "非云南省内集团不允许发起全网同步",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java:814",
            "confidence": "confirmed"
          },
          {
            "description": "跨省集团(MP_GROUP_CODE非空)需同步BBOSS",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java:236",
            "confidence": "confirmed"
          },
          {
            "description": "全网同步失败可静默(开关ALL_GROUP_ERR_SILENTLY)",
            "location": "src/com/ai/apaas/custmgr/svc/entmgr/ModifyEnterpriseInfoForDispatchSVC.java:673",
            "confidence": "confirmed"
          }
        ],
        "dependencies": [
          "IEnterpriseOperateSV",
          "IEnterpriseQuerySV",
          "ICbEnterpriseOperateSV",
          "ICbEnterpriseQuerySV",
          "IPartyQuerySV",
          "IBsDistrictQuerySV",
          "IOrgStaffLQuerySV",
          "ICustomerQuerySV",
          "IPartyCustMgrStaffQuerySV",
          "OrderCentre.person.IOCOutQuerySV",
          "OrderCentre.person.ICbIllegalCardInfoSV",
          "BusiFrame.ftpmgr.IFtpMgrSV",
          "ICCIBOSSOutOperateSV.ecBbossSync",
          "ICCOutOperateSV.sendSingleSms"
        ],
        "algorithms": [
          "客户级别->信用等级映射",
          "企业规模编码转换",
          "BBOSS地市编码换算",
          "关键人列表>1999字符拆分",
          "调配日志先插后更"
        ],
        "complexity": "high",
        "core_functions": []
      }
    ]
  },
  {
    "generated_at": "2026-08-11T00:00:00Z",
    "modules": [
      {
        "name": "mesop",
        "path": "src/com/ai/apaas/custmgr/svc/mesop/",
        "purpose": "营销维系管理：中小微集团管理、拜访任务（签到/测速/反馈/短信/统计）、集团业务受理单（电子合同）、知识库、宽带地址查询",
        "primary_files": [
          "src/com/ai/apaas/custmgr/service/interfaces/IMesopOperateSV.java",
          "src/com/ai/apaas/custmgr/service/interfaces/IMesopQuerySV.java",
          "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java",
          "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java",
          "src/com/ai/apaas/custmgr/svc/mesop/QueryUnVisitGroupsMesopSVC.java",
          "src/com/ai/apaas/custmgr/svc/mesop/QueryEnterpriseSmallBaseSVC.java",
          "src/com/ai/apaas/custmgr/svc/mesop/AddSmallBusinessEnterpriseSVC.java",
          "src/com/ai/apaas/custmgr/svc/mesop/ModifyToRealEnterpriseSVC.java"
        ],
        "functions": [
          {
            "name": "addGroupElectPactInfo",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse (DATAS)",
            "confidence": "confirmed"
          },
          {
            "name": "addVisitTaskSignIn",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse (DATAS)",
            "confidence": "confirmed"
          },
          {
            "name": "queryUnVisitGroupsMesop",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/QueryUnVisitGroupsMesopSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse (GROUP_TABLE LIST+TOTAL)",
            "confidence": "confirmed"
          },
          {
            "name": "queryEnterpriseSmallBase",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/QueryEnterpriseSmallBaseSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse (DATAS LIST+TOTAL)",
            "confidence": "confirmed"
          },
          {
            "name": "addSmallEnterprise",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/AddSmallEnterpriseSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "modifyToRealEnterprise",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/ModifyToRealEnterpriseSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "addCatolog",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/AddCatologSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "queryStatics",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/QueryStaticsSVC.java",
            "params": [
              "ServiceRequest in"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "queryGroupVisitStats",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/QueryGroupVisitStatsSVC.java",
            "params": [
              "ServiceRequest in"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          },
          {
            "name": "queryWideNetHomeAddr",
            "file": "src/com/ai/apaas/custmgr/svc/mesop/QueryWideNetHomeAddrSVC.java",
            "params": [
              "ServiceRequest request"
            ],
            "returns": "ServiceResponse",
            "confidence": "confirmed"
          }
        ],
        "entities": [
          {
            "name": "Cb_Me_Task",
            "fields": [
              {
                "name": "PLAN_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "PLAN_TITLE",
                "type": "String",
                "required": false
              },
              {
                "name": "TASK_TYPE",
                "type": "String",
                "required": true
              },
              {
                "name": "PLAN_CONTENT",
                "type": "String",
                "required": false
              },
              {
                "name": "END_TIME",
                "type": "Date",
                "required": true
              },
              {
                "name": "EXE_TIME",
                "type": "Date",
                "required": false
              },
              {
                "name": "RECEIVE_STAFF",
                "type": "String",
                "required": true
              },
              {
                "name": "TASK_STATUS",
                "type": "String",
                "required": true
              },
              {
                "name": "APPENDIX3",
                "type": "String",
                "required": false
              },
              {
                "name": "GROUP_CODE",
                "type": "String",
                "required": true
              },
              {
                "name": "APPENDIX1",
                "type": "String",
                "required": false
              },
              {
                "name": "OFFSET_DISTANCE",
                "type": "String",
                "required": false
              },
              {
                "name": "VISIT_LONGTITUDE",
                "type": "String",
                "required": false
              },
              {
                "name": "VISIT_LATITUDE",
                "type": "String",
                "required": false
              },
              {
                "name": "VISIT_TYPE",
                "type": "String",
                "required": true
              },
              {
                "name": "DATA_STATUS",
                "type": "String",
                "required": true
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "Cb_Me_Task_SignIn",
            "fields": [
              {
                "name": "SIGNIN_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "PLAN_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "LINK_NAME",
                "type": "String",
                "required": false
              },
              {
                "name": "LINK_PHONE",
                "type": "String",
                "required": false
              },
              {
                "name": "DESCRIBE",
                "type": "String",
                "required": false
              },
              {
                "name": "REMARKS",
                "type": "String",
                "required": false
              },
              {
                "name": "SIGNIN_TIME",
                "type": "Date",
                "required": true
              },
              {
                "name": "FILE_ID",
                "type": "String",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "Cb_Me_Satisfact_Feedback",
            "fields": [
              {
                "name": "PLAN_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "RECEIVE_STAFF",
                "type": "String",
                "required": true
              },
              {
                "name": "RECEIVE_NAME",
                "type": "String",
                "required": false
              },
              {
                "name": "APPENDIX3",
                "type": "String",
                "required": false
              },
              {
                "name": "REMARKS",
                "type": "String",
                "required": false
              },
              {
                "name": "SMS_TIME",
                "type": "Date",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "Cb_Me_Cust_Location",
            "fields": [
              {
                "name": "GROUP_CODE",
                "type": "String",
                "required": true
              },
              {
                "name": "LONGTITUDE",
                "type": "String",
                "required": true
              },
              {
                "name": "LATITUDE",
                "type": "String",
                "required": true
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "Cm_Group_Elect_Pact",
            "fields": [
              {
                "name": "ELECT_PACT_CODE",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "GROUP_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "CREATE_MONTH",
                "type": "String",
                "required": true
              },
              {
                "name": "BUSI_TYPE",
                "type": "String",
                "required": false
              },
              {
                "name": "BUSI_TEXT",
                "type": "String",
                "required": false
              },
              {
                "name": "ACCEPT_DATE",
                "type": "Date",
                "required": false
              },
              {
                "name": "VALID_DATE",
                "type": "Date",
                "required": false
              },
              {
                "name": "EXPIRE_DATE",
                "type": "Date",
                "required": false
              },
              {
                "name": "PAY_TYPE",
                "type": "String",
                "required": false
              },
              {
                "name": "PAY_MODE",
                "type": "String",
                "required": false
              },
              {
                "name": "PAY_CYCLE",
                "type": "String",
                "required": false
              },
              {
                "name": "INVOICE_TYPE",
                "type": "String",
                "required": false
              },
              {
                "name": "REMIND_SMS",
                "type": "String",
                "required": false
              },
              {
                "name": "PACT_STATUS",
                "type": "String",
                "required": false
              },
              {
                "name": "ESOP_INATCT_ID",
                "type": "String",
                "required": false
              },
              {
                "name": "PRDT_CODE",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR1",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR8",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR9",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR10",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR11",
                "type": "String",
                "required": false
              },
              {
                "name": "RSRV_STR12",
                "type": "String",
                "required": false
              },
              {
                "name": "MGMT_DISTRICT",
                "type": "String",
                "required": false
              },
              {
                "name": "MGMT_COUNTY",
                "type": "String",
                "required": false
              },
              {
                "name": "CREATE_DATE",
                "type": "Date",
                "required": false
              },
              {
                "name": "DONE_DATE",
                "type": "Date",
                "required": false
              }
            ],
            "confidence": "confirmed"
          },
          {
            "name": "Small_Enterprise_Base",
            "fields": [
              {
                "name": "BASE_ID",
                "type": "String",
                "required": true
              },
              {
                "name": "BASE_GROUP_NAME",
                "type": "String",
                "required": true
              },
              {
                "name": "BASE_GROUP_ADDR",
                "type": "String",
                "required": false
              },
              {
                "name": "GROUP_CONTACT",
                "type": "String",
                "required": false
              },
              {
                "name": "CONTACT_NUMBER",
                "type": "String",
                "required": false
              },
              {
                "name": "EMP_NUM_LOCAL",
                "type": "String",
                "required": false
              },
              {
                "name": "SH_NET_INFO",
                "type": "String",
                "required": false
              },
              {
                "name": "SH_OPERATOR",
                "type": "String",
                "required": false
              },
              {
                "name": "FA_OPERATOR",
                "type": "String",
                "required": false
              },
              {
                "name": "FA_NET_INFO",
                "type": "String",
                "required": false
              },
              {
                "name": "COMM_EXPEND_MONTH",
                "type": "String",
                "required": false
              },
              {
                "name": "IS_MULTIPLE_INFO",
                "type": "String",
                "required": false
              },
              {
                "name": "BASE_CALLING_TYPE_CODE",
                "type": "String",
                "required": false
              },
              {
                "name": "USER_DEMAND",
                "type": "String",
                "required": false
              },
              {
                "name": "IDEN_NR",
                "type": "String",
                "required": false
              },
              {
                "name": "DECMAKER_PHONE",
                "type": "String",
                "required": false
              },
              {
                "name": "DECMAKER_NAME",
                "type": "String",
                "required": false
              },
              {
                "name": "REMARKS",
                "type": "String",
                "required": false
              },
              {
                "name": "CREATE_DATE",
                "type": "Date",
                "required": false
              }
            ],
            "confidence": "confirmed"
          }
        ],
        "business_rules": [
          {
            "description": "拜访距离大于500米时任务状态置为4（失效）",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java:104",
            "confidence": "confirmed"
          },
          {
            "description": "满意度短信内容固定为5档评价文本，号码仅保留前11位",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java:167",
            "confidence": "confirmed"
          },
          {
            "description": "计费生效日期为1则失效日期为次年同月，为2则再加1个月",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java:122",
            "confidence": "confirmed"
          },
          {
            "description": "电子合同编号=yyyyMMdd+8位随机数",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java:87",
            "confidence": "confirmed"
          },
          {
            "description": "合同详情按150字符分片存RSRV_STR8~12，超过1000字符提示保存不完全",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java:183",
            "confidence": "confirmed"
          },
          {
            "description": "未拜访集团判定：当月无task_status=1且END_TIME在本月的拜访任务",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/QueryUnVisitGroupsMesopSVC.java:245",
            "confidence": "confirmed"
          },
          {
            "description": "第一次拜访时记录集团经纬度（queryCbMeCustLocationById为空则新增）",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java:129",
            "confidence": "confirmed"
          },
          {
            "description": "无planId时自动新增一条自我拜访任务（VISIT_TYPE=0）",
            "location": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java:112",
            "confidence": "confirmed"
          }
        ],
        "dependencies": [
          "com.ai.apaas.local.customer.service.interfaces.ICmGroupElectPactOperateSV",
          "com.ai.apaas.local.party.service.interfaces.ICbMeTaskOperateSV",
          "com.ai.apaas.local.party.service.interfaces.ICbMeTaskQuerySV",
          "com.ai.apaas.local.customer.service.interfaces.ICbMeTaskSignInOperateSV",
          "com.ai.apaas.core.party.service.interfaces.IEnterpriseQuerySV",
          "com.ai.apaas.local.param.service.interfaces.IBsDistrictQuerySV",
          "OrderCentre.person.IOCOutOperateSV.getEsopEpaData (CsfCaller)",
          "CustomerCentre.custmgr.ICCOutOperateSV.sendSingleSms (CsfCaller)",
          "com.ai.appframe2.bo.DataContainer",
          "com.ai.ipaas.busiframe.xcaller.CsfCaller"
        ],
        "algorithms": [
          "电子合同编号生成：日期+随机数",
          "计费有效期推算（+1年/+1年1月）",
          "拜访距离阈值判定（500m）",
          "合同详情150字符分片",
          "GetBusiText业务类型枚举翻译",
          "当月首末日期计算（getFirstDayOfThisMonth/getMaxDayOfThisMonth）"
        ],
        "complexity": "high",
        "core_functions": [
          {
            "function": "doService",
            "core_function_reason": "新增集团业务受理单核心流程：①调用外部无纸化服务 OrderCentre.person.IOCOutOperateSV.getEsopEpaData（CsfCaller 跨中心调用）；②多分支 if/else if（计费生效日期推算、合同详情按150字符分片6分支）；③多个 for 循环组装合同明细（detailInfo/jsonInfo）；④解析外部返回 ESOP_INATCT_ID 并做失败校验。圈复杂度≥5、包含外部服务调用、≥3层嵌套条件。",
            "file_path": "src/com/ai/apaas/custmgr/svc/mesop/AddGroupElectPactInfoSVC.java",
            "frontend_file": [
              {
                "frontend_file_path": "html/mesop/group/AddSmallBusinessEnterprise.html",
                "frontend_file_title": "集团业务受理/电子合同",
                "frontend_file_desc": "新增中小微企业并受理集团业务（和商务/和对讲等），生成电子合同并联动无纸化系统，与 AddGroupElectPactInfoSVC 对应"
              },
              {
                "frontend_file_path": "html/mesop/group/EnterpriseSale.html",
                "frontend_file_title": "集团业务销售受理",
                "frontend_file_desc": "集团业务销售/受理入口，提交集团业务受理单，调用 addGroupElectPactInfo"
              }
            ]
          },
          {
            "function": "doService",
            "core_function_reason": "未拜访集团查询核心流程：①for 循环遍历客户经理名下全部集团（queryEnterpriseByParams4Mesop）；②循环内嵌套执行原生 SQL（ExecuteSqlUtil.getDcs('CP') 查询当月拜访任务）判断是否已拜访；③嵌套条件（groups!=null、GROUP_ID非空、dcs==null||length==0）组装未拜访集团及经纬度；④调用 getFirstDayOfThisMonth/getMaxDayOfThisMonth 计算当月首末日作为 SQL 参数。包含≥2层循环、≥3层嵌套条件、原生SQL执行。",
            "file_path": "src/com/ai/apaas/custmgr/svc/mesop/QueryUnVisitGroupsMesopSVC.java",
            "frontend_file": [
              {
                "frontend_file_path": "html/mesop/visit/groupVisit.html",
                "frontend_file_title": "集团拜访（未拜访列表）",
                "frontend_file_desc": "展示客户经理当月未经拜访的集团列表及位置，调用 queryUnVisitGroupsMesop"
              }
            ]
          },
          {
            "function": "doService",
            "core_function_reason": "集团中小微企业摸底信息查询核心流程：①for 循环遍历查询结果（queryEnterpriseSmallBase）；②循环内大量 if/else if 枚举翻译（运营商1~5、网络覆盖0/1、需求类型1~4、行业类型 StaticUtil）——超过3层嵌套条件；③分页计算（startIndex/endIndex，setNeedCount/setNoPage）；④组装 JSON 列表 + TOTAL。包含≥3层嵌套条件、复杂数据映射转换。",
            "file_path": "src/com/ai/apaas/custmgr/svc/mesop/QueryEnterpriseSmallBaseSVC.java",
            "frontend_file": [
              {
                "frontend_file_path": "html/mesop/group/SmallBusinessCustomersMana.html",
                "frontend_file_title": "中小微企业摸底查询",
                "frontend_file_desc": "查询集团中小微企业摸底信息列表，调用 queryEnterpriseSmallBase"
              },
              {
                "frontend_file_path": "html/mesop/group/SmallBusinessCustomersQry.html",
                "frontend_file_title": "中小微企业查询",
                "frontend_file_desc": "中小微企业信息查询入口，对应 queryEnterpriseSmallBase 展示"
              }
            ]
          },
          {
            "function": "doService",
            "core_function_reason": "拜访任务签到核心流程：①外部短信服务调用（for 循环内逐个 CsfCaller.call CustomerCentre.custmgr.ICCOutOperateSV.sendSingleSms 发送满意度调查短信）；②if(planId==null) 新增任务 else 改状态的双分支业务逻辑；③循环处理5个号码字段并嵌套长度校验（≥11截取前11位）；④嵌套查询关键人（queryEnterpriseKeymanByFamilyPhone）填充反馈记录；⑤签到信息与反馈表多表写入。包含外部服务调用、≥2层循环、≥3层嵌套条件。",
            "file_path": "src/com/ai/apaas/custmgr/svc/mesop/AddVisitTaskSignInSVC.java",
            "frontend_file": [
              {
                "frontend_file_path": "html/mesop/visit/visitManage.html",
                "frontend_file_title": "拜访任务管理",
                "frontend_file_desc": "拜访任务列表与签到管理，调用 addVisitTaskSignIn 完成客户经理拜访签到"
              },
              {
                "frontend_file_path": "html/mesop/visit/groupVisit.html",
                "frontend_file_title": "集团拜访",
                "frontend_file_desc": "集团拜访签到与满意度调查入口，对应 addVisitTaskSignIn 与短信发送"
              }
            ]
          }
        ]
      }
    ]
  }
]
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
