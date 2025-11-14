// publisher.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://27.191.2.71:5502", {
  username: "admin",
  password: "wjm234.CN",
});

client.on("connect", () => {
  console.log("🚀 Publisher 已连接 MQTT");
  
  // 每隔 2 秒发一条消息
  setInterval(() => {
    const msg = "node publish: " + new Date().toISOString();
    client.publish("homeassistant/test", msg);
    console.log("📤 已发布:", msg);
  }, 2000);
});

client.on("error", (err) => {
  console.error("❌ Publisher 连接错误:", err);
});
