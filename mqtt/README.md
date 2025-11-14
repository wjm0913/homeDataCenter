# MQTT Web UI 管理界面

一个针对 Eclipse Mosquitto MQTT 服务器的 Web UI 管理界面，提供消息监控、发布、订阅等功能。

## 功能特性

- 🌐 **Web UI 界面** - 现代化的 Web 管理界面
- 📡 **MQTT 连接管理** - 可配置的 MQTT 服务器连接
- 📨 **主题订阅** - 支持订阅/取消订阅多个主题，支持通配符 (#, +)
- 📤 **消息发布** - 发布消息到指定主题，支持 QoS 和 Retain 设置
- 📬 **实时消息监控** - 实时查看接收到的 MQTT 消息
- 📋 **系统日志** - 显示系统运行日志
- 🎨 **美观界面** - 渐变色设计，响应式布局

## 技术栈

- **后端**: Node.js + Express + WebSocket
- **前端**: 原生 HTML/CSS/JavaScript
- **MQTT**: MQTT.js
- **容器化**: Docker

## 快速开始

### 方式一：直接运行

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

3. 打开浏览器访问：`http://localhost:3000`

### 方式二：Docker 运行

1. 构建镜像：
```bash
docker build -t mqtt-web-ui .
```

2. 运行容器：
```bash
docker run -d -p 3000:3000 --name mqtt-web-ui mqtt-web-ui
```

### 方式三：Docker Compose

```bash
docker-compose up -d
```

## 使用说明

### 1. 连接到 MQTT 服务器

在界面顶部的"MQTT 连接配置"区域：
- 填写 MQTT 服务器地址（默认：27.191.2.71）
- 填写端口（默认：5502）
- 填写用户名和密码
- 点击"连接"按钮

### 2. 订阅主题

在"主题订阅"区域：
- 输入主题名称（例如：`test` 或 `home/#`）
- 点击"订阅"按钮
- 已订阅的主题会显示在下方列表中

支持 MQTT 通配符：
- `#` - 多级通配符（例如：`home/#` 匹配 `home/kitchen`, `home/bedroom/temp` 等）
- `+` - 单级通配符（例如：`home/+/temp` 匹配 `home/kitchen/temp`, `home/bedroom/temp` 等）

### 3. 发布消息

在"消息发布"区域：
- 输入主题名称
- 输入消息内容
- 选择 QoS 等级（0, 1, 2）
- 选择是否保留消息（Retain）
- 点击"发布消息"按钮

### 4. 查看消息

所有接收到的消息会显示在"消息监控"区域，包括：
- 主题名称
- 消息内容
- 接收时间

可以点击"清空消息"按钮清除历史消息。

## 测试文件

项目包含两个测试文件用于测试 MQTT 功能：

- `publisher.js` - 消息发布测试（每 2 秒发布一条消息到 test 主题）
- `subscriber.js` - 消息订阅测试（订阅 test 主题并打印收到的消息）

运行测试：
```bash
# 运行发布者
node publisher.js

# 运行订阅者（另开一个终端）
node subscriber.js
```

## 配置

默认配置在 `server.js` 中：

```javascript
const MQTT_CONFIG = {
  host: '27.191.2.71',
  port: 5502,
  username: 'admin',
  password: 'wjm234.CN'
};
```

可以根据需要修改默认配置。

## 端口说明

- Web UI: `3000` - HTTP 服务和 WebSocket 服务
- MQTT: `5502` - Eclipse Mosquitto MQTT 服务端口

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

需要支持 WebSocket 的现代浏览器。

## 安全提示

⚠️ **生产环境建议**：
- 修改默认的 MQTT 用户名和密码
- 使用环境变量管理敏感信息
- 配置 HTTPS 和 WSS（加密连接）
- 限制访问 IP 地址

## 许可证

MIT License