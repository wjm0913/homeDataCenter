const express = require('express');
const mqtt = require('mqtt');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

// MQTT 连接配置
const MQTT_CONFIG = {
  host: '27.191.2.71',
  port: 5502,
  username: 'admin',
  password: 'wjm234.CN'
};

// 静态文件服务
app.use(express.static('public'));
app.use(express.json());

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动 HTTP 服务器
const server = app.listen(PORT, () => {
  console.log(`🌐 MQTT Web UI 运行在 http://localhost:${PORT}`);
  console.log(`📡 MQTT 服务器: mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`);
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 存储活跃的 MQTT 客户端连接
const mqttClients = new Map();

wss.on('connection', (ws) => {
  console.log('🔌 新的 WebSocket 客户端已连接');

  let mqttClient = null;
  let clientId = `web_client_${Date.now()}`;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'connect':
          // 连接到 MQTT 服务器
          const config = data.config || MQTT_CONFIG;
          mqttClient = mqtt.connect(`mqtt://${config.host}:${config.port}`, {
            username: config.username,
            password: config.password,
            clientId: clientId,
            clean: true,
            reconnectPeriod: 1000
          });

          mqttClients.set(clientId, mqttClient);

          mqttClient.on('connect', () => {
            console.log(`✅ MQTT 客户端 ${clientId} 已连接`);
            ws.send(JSON.stringify({
              type: 'connected',
              clientId: clientId,
              message: 'MQTT 连接成功'
            }));
          });

          mqttClient.on('error', (err) => {
            console.error(`❌ MQTT 错误 (${clientId}):`, err.message);
            ws.send(JSON.stringify({
              type: 'error',
              message: `MQTT 错误: ${err.message}`
            }));
          });

          mqttClient.on('message', (topic, payload) => {
            const msg = {
              type: 'message',
              topic: topic,
              payload: payload.toString(),
              timestamp: new Date().toISOString()
            };
            ws.send(JSON.stringify(msg));
          });

          mqttClient.on('close', () => {
            console.log(`🔌 MQTT 客户端 ${clientId} 已断开`);
            ws.send(JSON.stringify({
              type: 'disconnected',
              message: 'MQTT 连接已断开'
            }));
          });
          break;

        case 'subscribe':
          if (mqttClient && mqttClient.connected) {
            const topic = data.topic;
            mqttClient.subscribe(topic, (err) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `订阅失败: ${err.message}`
                }));
              } else {
                console.log(`📨 订阅主题: ${topic}`);
                ws.send(JSON.stringify({
                  type: 'subscribed',
                  topic: topic,
                  message: `已订阅主题: ${topic}`
                }));
              }
            });
          }
          break;

        case 'unsubscribe':
          if (mqttClient && mqttClient.connected) {
            const topic = data.topic;
            mqttClient.unsubscribe(topic, (err) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `取消订阅失败: ${err.message}`
                }));
              } else {
                console.log(`📤 取消订阅主题: ${topic}`);
                ws.send(JSON.stringify({
                  type: 'unsubscribed',
                  topic: topic,
                  message: `已取消订阅: ${topic}`
                }));
              }
            });
          }
          break;

        case 'publish':
          if (mqttClient && mqttClient.connected) {
            const { topic, payload, qos, retain } = data;
            mqttClient.publish(topic, payload, {
              qos: qos || 0,
              retain: retain || false
            }, (err) => {
              if (err) {
                ws.send(JSON.stringify({
                  type: 'error',
                  message: `发布失败: ${err.message}`
                }));
              } else {
                console.log(`📤 发布消息到 ${topic}: ${payload}`);
                ws.send(JSON.stringify({
                  type: 'published',
                  topic: topic,
                  message: '消息发布成功'
                }));
              }
            });
          }
          break;

        case 'disconnect':
          if (mqttClient) {
            mqttClient.end();
            mqttClients.delete(clientId);
          }
          break;
      }
    } catch (err) {
      console.error('❌ WebSocket 消息处理错误:', err);
      ws.send(JSON.stringify({
        type: 'error',
        message: err.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket 客户端已断开');
    if (mqttClient) {
      mqttClient.end();
      mqttClients.delete(clientId);
    }
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket 错误:', err);
  });
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  mqttClients.forEach((client) => {
    client.end();
  });
  wss.close();
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});