// ha_switch.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://27.191.2.71:5502", {
  username: "admin",
  password: "wjm234.CN",
});

client.on("connect", () => {
  console.log("🚀 MQTT 已连接 HomeAssistant");
  
  // 发送 HomeAssistant 发现配置（config）
  const configPayload = JSON.stringify({
    name: "garden",
    command_topic: "homeassistant/switch/irrigation/set",
    state_topic: "homeassistant/switch/irrigation/state",
  });
  
  client.publish(
      "homeassistant/switch/irrigation/config",
      configPayload,
      { retain: true }, // HA Discovery 推荐 Retain
      (err) => {
        if (err) console.error("❌ 配置发布失败:", err);
        else console.log("📡 已发布 HA Discovery 配置");
      }
  );
  
  // 订阅指令 topic
  client.subscribe("homeassistant/switch/irrigation/set", (err) => {
    if (err) console.error("❌ 订阅失败:", err);
    else console.log("📨 已订阅 irrigation/set 指令");
  });
});

// 处理收到的消息
client.on("message", (topic, message) => {
  const payload = message.toString();
  
  console.log(`📥 收到指令 [${topic}] : ${payload}`);
  
  // 转发消息到 state topic
  client.publish("homeassistant/switch/irrigation/state", payload, (err) => {
    if (err) console.error("❌ 状态发布失败:", err);
    else console.log(`📤 已更新状态: ${payload}`);
  });
});

// 错误处理
client.on("error", (err) => {
  console.error("❌ 连接错误:", err);
});
