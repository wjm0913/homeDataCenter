export const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || '27.191.2.71',
  port: Number(process.env.MQTT_PORT || 5502),
  username: process.env.MQTT_USERNAME || 'admin',
  password: process.env.MQTT_PASSWORD || 'wjm234.CN',
  clientId: process.env.MQTT_CLIENT_ID || `admin-dashboard-${Math.random().toString(16).slice(2)}`
};

export const FILE_PATHS = {
  config: process.env.MOSQUITTO_CONF || '/mosquitto/config/mosquitto.conf',
  pwfile: process.env.MOSQUITTO_PWFILE || '/mosquitto/config/pwfile',
  aclfile: process.env.MOSQUITTO_ACLFILE || '/mosquitto/config/aclfile'
};

export const SERVER_PORT = Number(process.env.PORT || 4000);
export const WEBSOCKET_PATH = '/ws';
export const DOCKER_CONTAINER_NAME = process.env.MQTT_CONTAINER || 'mqtt-broker';
