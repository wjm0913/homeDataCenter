// WebSocket 连接
let ws = null;
let isConnected = false;
let subscribedTopics = new Set();
let messageCount = 0;

// DOM 元素
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const subscribeBtn = document.getElementById('subscribeBtn');
const publishBtn = document.getElementById('publishBtn');
const mqttHost = document.getElementById('mqttHost');
const mqttPort = document.getElementById('mqttPort');
const mqttUsername = document.getElementById('mqttUsername');
const mqttPassword = document.getElementById('mqttPassword');
const subscribeTopic = document.getElementById('subscribeTopic');
const subscribedList = document.getElementById('subscribedList');
const publishTopic = document.getElementById('publishTopic');
const publishPayload = document.getElementById('publishPayload');
const publishQos = document.getElementById('publishQos');
const publishRetain = document.getElementById('publishRetain');
const messagesContainer = document.getElementById('messagesContainer');
const logContainer = document.getElementById('logContainer');
const clearMessagesBtn = document.getElementById('clearMessagesBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const autoScroll = document.getElementById('autoScroll');

// 初始化 WebSocket 连接到后端
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    addLog('WebSocket 连接已建立', 'success');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };

  ws.onerror = (error) => {
    addLog('WebSocket 错误', 'error');
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    addLog('WebSocket 连接已关闭', 'warning');
    if (isConnected) {
      updateConnectionStatus(false);
    }
  };
}

// 处理 WebSocket 消息
function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'connected':
      updateConnectionStatus(true);
      addLog(`✅ ${data.message}`, 'success');
      break;

    case 'disconnected':
      updateConnectionStatus(false);
      addLog(`🔌 ${data.message}`, 'warning');
      subscribedTopics.clear();
      updateSubscribedList();
      break;

    case 'subscribed':
      subscribedTopics.add(data.topic);
      updateSubscribedList();
      addLog(`📨 ${data.message}`, 'success');
      break;

    case 'unsubscribed':
      subscribedTopics.delete(data.topic);
      updateSubscribedList();
      addLog(`📤 ${data.message}`, 'info');
      break;

    case 'published':
      addLog(`📤 ${data.message}`, 'success');
      break;

    case 'message':
      addMessage(data.topic, data.payload, data.timestamp);
      break;

    case 'error':
      addLog(`❌ ${data.message}`, 'error');
      break;

    default:
      console.log('未知消息类型:', data);
  }
}

// 更新连接状态
function updateConnectionStatus(connected) {
  isConnected = connected;

  if (connected) {
    statusIndicator.classList.add('connected');
    statusText.textContent = '已连接';
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    subscribeBtn.disabled = false;
    publishBtn.disabled = false;
  } else {
    statusIndicator.classList.remove('connected');
    statusText.textContent = '未连接';
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    subscribeBtn.disabled = true;
    publishBtn.disabled = true;
  }
}

// 连接到 MQTT
function connectMQTT() {
  const config = {
    host: mqttHost.value.trim(),
    port: parseInt(mqttPort.value),
    username: mqttUsername.value.trim(),
    password: mqttPassword.value.trim()
  };

  if (!config.host || !config.port) {
    addLog('❌ 请填写服务器地址和端口', 'error');
    return;
  }

  addLog(`🔌 正在连接到 mqtt://${config.host}:${config.port}...`, 'info');

  ws.send(JSON.stringify({
    type: 'connect',
    config: config
  }));
}

// 断开 MQTT 连接
function disconnectMQTT() {
  ws.send(JSON.stringify({
    type: 'disconnect'
  }));
  updateConnectionStatus(false);
  subscribedTopics.clear();
  updateSubscribedList();
}

// 订阅主题
function subscribe() {
  const topic = subscribeTopic.value.trim();

  if (!topic) {
    addLog('❌ 请输入主题名称', 'error');
    return;
  }

  if (subscribedTopics.has(topic)) {
    addLog(`⚠️ 已订阅主题: ${topic}`, 'warning');
    return;
  }

  ws.send(JSON.stringify({
    type: 'subscribe',
    topic: topic
  }));
}

// 取消订阅
function unsubscribe(topic) {
  ws.send(JSON.stringify({
    type: 'unsubscribe',
    topic: topic
  }));
}

// 发布消息
function publish() {
  const topic = publishTopic.value.trim();
  const payload = publishPayload.value;
  const qos = parseInt(publishQos.value);
  const retain = publishRetain.checked;

  if (!topic) {
    addLog('❌ 请输入主题名称', 'error');
    return;
  }

  if (!payload) {
    addLog('❌ 请输入消息内容', 'error');
    return;
  }

  ws.send(JSON.stringify({
    type: 'publish',
    topic: topic,
    payload: payload,
    qos: qos,
    retain: retain
  }));
}

// 更新已订阅主题列表
function updateSubscribedList() {
  subscribedList.innerHTML = '';

  if (subscribedTopics.size === 0) {
    subscribedList.innerHTML = '<li style="color: #9ca3af; padding: 10px;">暂无订阅</li>';
    return;
  }

  subscribedTopics.forEach(topic => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="topic-name">${escapeHtml(topic)}</span>
      <button onclick="unsubscribe('${escapeHtml(topic)}')">取消订阅</button>
    `;
    subscribedList.appendChild(li);
  });
}

// 添加消息到消息列表
function addMessage(topic, payload, timestamp) {
  // 移除空状态提示
  const emptyState = messagesContainer.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  messageCount++;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message-item';

  const time = new Date(timestamp).toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  messageDiv.innerHTML = `
    <div class="message-header">
      <span class="message-topic">${escapeHtml(topic)}</span>
      <span class="message-time">${time}</span>
    </div>
    <div class="message-payload">${escapeHtml(payload)}</div>
  `;

  messagesContainer.appendChild(messageDiv);

  // 限制消息数量，避免内存溢出
  if (messageCount > 100) {
    const firstMessage = messagesContainer.querySelector('.message-item');
    if (firstMessage) {
      firstMessage.remove();
      messageCount--;
    }
  }

  // 自动滚动到底部
  if (autoScroll.checked) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addLog(`📥 收到消息 [${topic}]`, 'info');
}

// 添加日志
function addLog(message, type = 'info') {
  const logDiv = document.createElement('div');
  logDiv.className = `log-item ${type}`;

  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  logDiv.textContent = `[${time}] ${message}`;
  logContainer.appendChild(logDiv);

  // 限制日志数量
  const logItems = logContainer.querySelectorAll('.log-item');
  if (logItems.length > 50) {
    logItems[0].remove();
  }

  // 自动滚动到底部
  logContainer.scrollTop = logContainer.scrollHeight;
}

// 清空消息
function clearMessages() {
  messagesContainer.innerHTML = '<div class="empty-state">暂无消息，等待接收...</div>';
  messageCount = 0;
  addLog('🗑️ 已清空消息列表', 'info');
}

// 清空日志
function clearLog() {
  logContainer.innerHTML = '<div class="log-item info">日志已清空</div>';
}


// HTML 转义，防止 XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 事件监听
connectBtn.addEventListener('click', connectMQTT);
disconnectBtn.addEventListener('click', disconnectMQTT);
subscribeBtn.addEventListener('click', subscribe);
publishBtn.addEventListener('click', publish);
clearMessagesBtn.addEventListener('click', clearMessages);
clearLogBtn.addEventListener('click', clearLog);

// 回车键快捷操作
subscribeTopic.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !subscribeBtn.disabled) {
    subscribe();
  }
});

publishPayload.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && e.ctrlKey && !publishBtn.disabled) {
    publish();
  }
});

// 初始化
window.addEventListener('load', () => {
  initWebSocket();
  updateSubscribedList();
  addLog('🌐 MQTT Web UI 已启动', 'success');
});
