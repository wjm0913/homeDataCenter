# MQTT Admin Dashboard – AI Reference

这份说明面向需要快速理解项目的 AI/Agent，用来在未来任务中提供上下文（架构、目录、接口与启动方式）。  

## 1. 项目概览

- **功能**：可视化管理 Mosquitto Broker，支持监控、订阅、发布、用户/ACL/配置管理，以及 Docker 容器重启。
- **结构**：
  - `backend/` – Node.js + Express + TypeScript，负责 REST API、WebSocket、MQTT 订阅与文件管理。
  - `frontend/` – React + Vite + Ant Design，SPA 仪表盘。
  - `mosquitto/` – 示例配置、pwfile、aclfile，供本地容器使用。
  - `docker-compose.yml` – Mosquitto + Admin 后端/前端的容器编排。
- **默认 MQTT 目标**：公网 `27.191.2.71:5502`，用户名 `admin`，密码 `wjm234.CN`（可用环境变量覆盖）。

## 2. 主要技术点

### 后端
- `src/index.ts`：注册 API（overview、clients、topics、publish、users、acl、conf、restart）并挂载 `SubscriptionServer`。
- `src/mqtt/mqttManager.ts`：使用 `mqtt.js` 连接 Broker，订阅 `$SYS/#` 与 `#` 采集状态，向 WebSocket 推送数据。
- `src/websocket/subscriptionServer.ts`：维护 WebSocket 客户端，只有显式订阅的主题才会收到消息。
- `src/services/*`：封装 pwfile 操作、ACL 读写、配置文件读写、Docker 重启等逻辑。
- `/api/overview` 同时返回 `$SYS` 摘要、消息速率历史以及当前 MQTT 连接状态。

### 前端
- `src/App.tsx`：布局 + 路由，使用玻璃拟态样式，滚动区域限制在内容区。
- `src/pages/*`：仪表盘、客户端、主题、订阅、发布、用户、ACL、配置、控制等页面。
- `src/hooks/useTopicStream.ts`：WebSocket Hook，支持动态订阅/退订。
- 订阅页、主题页都在 UI 层过滤 `$SYS`，仅显示用户选择的主题。

## 3. 运行方式

### 本地开发
```bash
# 后端
cd mqtt-admin/backend
npm install
npm run dev        # 默认监听 :4000，连接公网 Broker

# 前端
cd ../frontend
npm install
npm run dev        # Vite 默认 :5173
```
可通过 `MQTT_HOST / MQTT_PORT / MQTT_USERNAME / MQTT_PASSWORD` 环境变量切换到其它 Broker。文件路径 `MOSQUITTO_CONF|PWFILE|ACLFILE` 需要真实存在才能读写。

### Docker Compose
```bash
cd mqtt-admin
docker compose up -d --build
```
- 前端：`http://localhost:3000`
- 后端：`http://localhost:4000`（WebSocket `/ws`）
- Mosquitto：`localhost:1883 / 9001`（如仅管理公网 Broker，可移除本地服务）

## 4. 接口摘要

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| GET | `/api/overview` | 返回客户端数、消息速率、订阅数、5 分钟历史、`$SYS` 信息、MQTT 连接状态 |
| GET | `/api/clients` | `$SYS/broker/connection/#` 推导的客户端列表 |
| POST | `/api/publish` | `{ topic, payload, qos, retain }` |
| GET | `/api/topics` | 已观察到的主题列表与树 |
| GET/POST/DELETE | `/api/users` | 基于 `mosquitto_passwd` 的用户 CRUD |
| GET/POST | `/api/acl` | 读写 ACL |
| GET/POST | `/api/conf` | 读写 `mosquitto.conf` |
| POST | `/api/restart` | `docker restart mqtt-broker`（需挂载 docker.sock） |
| WebSocket | `/ws` | `{ action: "subscribe", topics: [] }` or `{ action: "unsubscribe", topics: [] }` |

## 5. 常见改动提示

- **切换 Broker**：修改 `.env` 或 `docker-compose.yml` 的 MQTT_* 变量即可；不需要改代码。
- **UI 风格**：全局样式在 `src/index.css`，卡片/布局使用 `.glass-card`、`.app-*` 类。
- **订阅行为**：当前只有用户显式订阅的主题会收到消息；如需要默认抓取 `$SYS` 或全部主题，需修改 `SubscriptionServer.broadcast`。
- **文件操作**：pwfile/aclfile/mosquitto.conf 必须在容器或宿主可写，可通过挂载远程路径实现。

> 更新本文件时，保持结构清晰、条列化，确保其他 Agent 可以快速读取关键信息。

