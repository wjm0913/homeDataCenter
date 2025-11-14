import EventEmitter from 'events';
import mqtt, { IClientOptions, IClientPublishOptions, MqttClient } from 'mqtt';
import { MQTT_CONFIG } from '../config';
import { TopicCollector } from '../services/topicCollector';
import { OverviewService } from '../services/overviewService';

export class MqttManager extends EventEmitter {
  private client?: MqttClient;
  private subscriptions: Set<string> = new Set();
  private readonly reservedTopics = new Set<string>(['$SYS/#', '#']);
  private connected = false;

  constructor(private topics: TopicCollector, private overview: OverviewService) {
    super();
    this.connect();
  }

  private connect() {
    const options: IClientOptions = {
      clientId: MQTT_CONFIG.clientId,
      reconnectPeriod: 3000
    };
    if (MQTT_CONFIG.username) options.username = MQTT_CONFIG.username;
    if (MQTT_CONFIG.password) options.password = MQTT_CONFIG.password;

    const url = `mqtt://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;
    this.client = mqtt.connect(url, options);

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
      } else {
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

  publish(topic: string, payload: string, options: IClientPublishOptions) {
    if (!this.client) throw new Error('MQTT client not initialized');
    this.client.publish(topic, payload, options);
  }

  subscribe(topic: string) {
    if (!this.client) return;
    if (this.subscriptions.has(topic)) return;
    this.subscriptions.add(topic);
    this.client.subscribe(topic, (err) => {
      if (err) {
        this.subscriptions.delete(topic);
      }
    });
  }

  unsubscribe(topic: string) {
    if (!this.client) return;
    if (!this.subscriptions.has(topic)) return;
    if (this.reservedTopics.has(topic)) return;
    this.client.unsubscribe(topic, () => this.subscriptions.delete(topic));
  }

  connectionInfo() {
    return {
      host: MQTT_CONFIG.host,
      port: MQTT_CONFIG.port,
      username: MQTT_CONFIG.username,
      connected: this.connected
    };
  }
}
