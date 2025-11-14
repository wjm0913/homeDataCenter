// subscriber.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://27.191.2.71:5502", {
  username: "admin",
  password: "wjm234.CN",
});

client.on("connect", () => {
  console.log("📡 Subscriber 已连接 MQTT");
  
  client.subscribe("test", (err) => {
    if (!err) {
      console.log("📨 已订阅 test 主题，等待消息...");
    }
  });
});

client.on("message", (topic, message) => {
  console.log(`📥 收到消息 [${topic}]: ${message.toString()}`);
});

client.on("error", (err) => {
  console.error("❌ Subscriber 连接错误:", err);
});
