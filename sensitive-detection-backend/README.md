# 敏感检测后端服务 - 启动指南

## 环境要求

| 依赖 | 版本要求 |
|------|---------|
| JDK | 1.8+ |
| Maven | 3.6+ |

## 快速启动

### 方式一：Maven 命令启动（推荐开发使用）

```bash
cd sensitive-detection-backend
mvn spring-boot:run
```

### 方式二：先打包再运行

```bash
cd sensitive-detection-backend
mvn clean package -DskipTests
java -jar target/sensitive-detection-demo-1.0.0-SNAPSHOT.jar
```

### 方式三：IDE 启动

在 IntelliJ IDEA 或 Eclipse 中：

1. 导入项目为 Maven 项目
2. 找到主类 `com.asiainfo.crm.security.demo.DemoApplication`
3. 右键 → Run

## 配置说明

配置文件位于 `src/main/resources/application.properties`，关键配置项：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `server.port` | `8001` | 服务端口 |
| `server.servlet.context-path` | `/api/native-security` | 接口路径前缀 |
| `llm.enabled` | `true` | 是否启用 LLM 检测（设为 `false` 则仅使用规则引擎） |
| `llm.api-url` | 讯飞星火 API | LLM 接口地址 |
| `llm.api-key` | 已配置 | LLM API 密钥 |
| `llm.default-model` | `astron-code-latest` | 默认模型名称 |

## 验证启动成功

服务启动后，访问以下地址验证：

```bash
# 健康检查 - 应返回统计数据
curl -X POST http://localhost:8001/api/native-security/data/statistics

# 模型列表
curl -X POST http://localhost:8001/api/native-security/model/list
```

如果返回 JSON 数据，说明服务启动成功。

## 数据说明

- 本项目使用 **H2 内存数据库**，无需额外安装数据库
- Mock 数据存放在 `src/main/resources/mock-data/` 目录下，启动时自动加载
- 服务重启后数据会重置

## 登录账号（如需直接调用后端）

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| operator | operator123 | 操作员 |

> **注意**：前端通过 Vite 代理访问后端时，不经过后端的登录认证（代理在本地开发时跳过了 auth 拦截）。如果直接调用后端 API 需要登录获取 Token。

## 前端代理配置

前端 Vite 代理已配置在 `apps/web-antd/vite.config.ts`：

```
/api/native-security → http://localhost:8001
```

确保后端在 `8001` 端口启动后，前端开发服务器即可正常代理请求。

## 常见问题

### Q: 端口被占用怎么办？

修改 `application.properties` 中的 `server.port` 为其他端口，同时同步修改前端 `vite.config.ts` 中的代理 target。

### Q: LLM 调用失败？

检查 `application.properties` 中的 `llm.api-key` 是否有效，或将 `llm.enabled` 设为 `false` 仅使用规则引擎检测。

### Q: 数据每次重启都丢失？

这是 H2 内存数据库的正常行为。如需持久化，可切换为 MySQL/PostgreSQL 并修改 `spring.datasource` 配置。
