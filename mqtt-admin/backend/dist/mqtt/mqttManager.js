"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttManager = void 0;
const events_1 = __importDefault(require("events"));
const mqtt_1 = __importDefault(require("mqtt"));
const config_1 = require("../config");
class MqttManager extends events_1.default {
    constructor(topics, overview) {
        super();
        this.topics = topics;
        this.overview = overview;
        this.subscriptions = new Set();
        this.reservedTopics = new Set(['$SYS/#', '#']);
        this.connected = false;
        this.connect();
    }
    connect() {
        const options = {
            clientId: config_1.MQTT_CONFIG.clientId,
            reconnectPeriod: 3000
        };
        if (config_1.MQTT_CONFIG.username)
            options.username = config_1.MQTT_CONFIG.username;
        if (config_1.MQTT_CONFIG.password)
            options.password = config_1.MQTT_CONFIG.password;
        const url = `mqtt://${config_1.MQTT_CONFIG.host}:${config_1.MQTT_CONFIG.port}`;
        this.client = mqtt_1.default.connect(url, options);
        this.client.on('connect', () => {
            this.connected = true;
            this.subscribe('$SYS/#');
            this.subscribe('#');
        });
        this.client.on('message', (topic, payload) => {
            const text = payload.toString();
            this.overview.recordMessage(topic);
            if (topic.startsWith('$SYS/')) {
                this.overview.updateSys(topic, text);
            }
            else {
                this.topics.add(topic);
            }
            this.emit('message', { topic, payload: text });
        });
        this.client.on('error', (err) => {
            this.connected = false;
            this.emit('error', err);
        });
        this.client.on('close', () => {
            this.connected = false;
        });
    }
    publish(topic, payload, options) {
        if (!this.client)
            throw new Error('MQTT client not initialized');
        this.client.publish(topic, payload, options);
    }
    subscribe(topic) {
        if (!this.client)
            return;
        if (this.subscriptions.has(topic))
            return;
        this.subscriptions.add(topic);
        this.client.subscribe(topic, (err) => {
            if (err) {
                this.subscriptions.delete(topic);
            }
        });
    }
    unsubscribe(topic) {
        if (!this.client)
            return;
        if (!this.subscriptions.has(topic))
            return;
        if (this.reservedTopics.has(topic))
            return;
        this.client.unsubscribe(topic, () => this.subscriptions.delete(topic));
    }
    connectionInfo() {
        return {
            host: config_1.MQTT_CONFIG.host,
            port: config_1.MQTT_CONFIG.port,
            username: config_1.MQTT_CONFIG.username,
            connected: this.connected
        };
    }
}
exports.MqttManager = MqttManager;
//# sourceMappingURL=mqttManager.js.map