"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCKER_CONTAINER_NAME = exports.WEBSOCKET_PATH = exports.SERVER_PORT = exports.FILE_PATHS = exports.MQTT_CONFIG = void 0;
exports.MQTT_CONFIG = {
    host: process.env.MQTT_HOST || '27.191.2.71',
    port: Number(process.env.MQTT_PORT || 5502),
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || 'wjm234.CN',
    clientId: process.env.MQTT_CLIENT_ID || `admin-dashboard-${Math.random().toString(16).slice(2)}`
};
exports.FILE_PATHS = {
    config: process.env.MOSQUITTO_CONF || '/mosquitto/config/mosquitto.conf',
    pwfile: process.env.MOSQUITTO_PWFILE || '/mosquitto/config/pwfile',
    aclfile: process.env.MOSQUITTO_ACLFILE || '/mosquitto/config/aclfile'
};
exports.SERVER_PORT = Number(process.env.PORT || 4000);
exports.WEBSOCKET_PATH = '/ws';
exports.DOCKER_CONTAINER_NAME = process.env.MQTT_CONTAINER || 'mqtt-broker';
//# sourceMappingURL=config.js.map