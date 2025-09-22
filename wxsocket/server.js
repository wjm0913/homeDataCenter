// server.js
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

// 导入 token 白名单：
// - 若 token.js 形如 module.exports = { token: [{ token:'xxx' }] }
// - 或 module.exports = ['xxx', 'yyy']
// 下面做了兼容与默认值兜底
let validTokens = [];
try {
  const mod = require('./token');
  if (Array.isArray(mod)) {
    validTokens = mod;
  } else if (mod && Array.isArray(mod.token)) {
    validTokens = mod.token;
  }
} catch (e) {
  console.warn('未找到 ./token 或格式不正确，当前将不允许任何连接');
}

const PORT = process.env.PORT || 8826;
const WS_PATH = process.env.WS_PATH || '/ws';
const CALLBACK_PATH = process.env.CALLBACK_PATH || '/callback';

const app = express();
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.status(200).send('ok'));

app.post(CALLBACK_PATH, (req, res) => {
  // 1) 立即回应空串（平台对回包时限敏感）
  res.status(200).send('');
  
  // 2) 广播给所有已连接 WS 客户端
  const payload = req.body ?? {};
  const text = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* WebSocket.OPEN */) {
      client.send(text);
    }
  });
});

const server = http.createServer(app);

/** ================== 鉴权相关（Sec-WebSocket-Protocol） ================== **/

// 从 'sec-websocket-protocol' 请求头解析 token
// 约定：前端 new WebSocket(url, ['bearer', token])
function getTokenFromProtocolsHeader(header) {
  if (!header) return null;
  const raw = Array.isArray(header) ? header.join(',') : String(header);
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  // 可选：兼容 "auth,<token>" 的写法
  // if (parts.length >= 1 && parts[0].startsWith('auth,')) {
  //   return parts[0].slice('auth,'.length);
  // }
  return null;
}

// 校验 token：兼容两种白名单结构（字符串数组 / 对象数组）
function isValidTokenString(tk) {
  if (!tk) return false;
  if (!Array.isArray(validTokens) || validTokens.length === 0) return false;
  
  const sample = validTokens[0];
  if (typeof sample === 'string') {
    return validTokens.includes(tk);
  }
  if (sample && typeof sample === 'object') {
    return validTokens.some((item) => item && item.token === tk);
  }
  return false;
}

// 创建 WebSocket 服务器（只改鉴权+子协议协商）
const wss = new WebSocketServer({
  server,
  path: WS_PATH,
  
  // 1) 握手前鉴权：从子协议头读取 token 并验证
  verifyClient: (info, callback) => {
    const header = info.req.headers['sec-websocket-protocol'];
    const token = getTokenFromProtocolsHeader(header);
    
    if (isValidTokenString(token)) {
      console.log('WebSocket 鉴权成功');
      callback(true);
    } else {
      console.log('WebSocket 鉴权失败');
      callback(false, 401, '未授权');
    }
  },
  
  // 2) 子协议协商：必须回传一个客户端提供的协议（这里选 'bearer'）
  // ws@8 传入的是 Set<string>；为兼容，既处理 Set 也处理数组
  handleProtocols: (protocols /* Set<string> | string[] */, _request) => {
    const has =
        protocols && typeof protocols.has === 'function'
            ? protocols.has('bearer')
            : Array.isArray(protocols) && protocols.includes('bearer');
    
    if (has) return 'bearer';
    return false; // 未提供 'bearer' 则拒绝
  },
});

/** ================== 下面保持原逻辑不变 ================== **/

// 可选：打印 upgrade 日志，便于定位
server.on('upgrade', (req) => {
  console.log(
      'HTTP upgrade ->',
      req.url,
      'protocols:',
      req.headers['sec-websocket-protocol'] || '(none)'
  );
});

wss.on('connection', (ws) => {
  console.log('WS connected');
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, () => {
  console.log(`HTTP listening on http://0.0.0.0:${PORT}`);
  console.log(`Callback    POST http://<host>:${PORT}${CALLBACK_PATH}`);
  console.log(`WebSocket   WS   ws://<host>:${PORT}${WS_PATH} (需要鉴权)`);
});
