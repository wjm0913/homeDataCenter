// ha_switch_set.js
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://27.191.2.71:5502", {
  username: "admin",
  password: "wjm234.CN",
});

// 改这里：你想发 ON 还是 OFF
const payload = process.argv[2] || "OFF";

client.on("connect", () => {
  console.log("✅ 已连接，发送状态：", payload);
  
  client.publish(
      "homeassistant/switch/irrigation/state",
      payload,
      () => {
        console.log("📤 已发布状态：", payload);
        client.end();
      }
  );
});

client.on("error", (err) => {
  console.error("❌ 发布失败:", err);
});
