import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import { WEBSOCKET_PATH } from '../config';
import { MqttManager } from '../mqtt/mqttManager';

interface WsClient {
  socket: WebSocket;
  topics: Set<string>;
}

function matchTopic(filter: string, topic: string): boolean {
  const filterParts = filter.split('/');
  const topicParts = topic.split('/');
  for (let i = 0; i < filterParts.length; i++) {
    const current = filterParts[i];
    if (current === '#') return true;
    if (topicParts[i] === undefined) return false;
    if (current === '+') continue;
    if (topicParts[i] !== current) return false;
  }
  return filterParts.length === topicParts.length;
}

export class SubscriptionServer {
  private wss: WebSocketServer;
  private clients: Set<WsClient> = new Set();

  constructor(server: HTTPServer, mqttManager: MqttManager) {
    this.wss = new WebSocketServer({ server, path: WEBSOCKET_PATH });

    mqttManager.on('message', ({ topic, payload }) => {
      this.broadcast(topic, payload);
    });

    this.wss.on('connection', (socket) => {
      const client: WsClient = { socket, topics: new Set() };
      this.clients.add(client);

      socket.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.action === 'subscribe' && Array.isArray(data.topics)) {
            data.topics.forEach((topic: string) => {
              client.topics.add(topic);
              mqttManager.subscribe(topic);
            });
          }
          if (data.action === 'unsubscribe' && Array.isArray(data.topics)) {
            data.topics.forEach((topic: string) => {
              client.topics.delete(topic);
              mqttManager.unsubscribe(topic);
            });
          }
        } catch (error) {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
        }
      });

      socket.on('close', () => {
        this.clients.delete(client);
      });

      socket.send(JSON.stringify({ type: 'ready' }));
    });
  }

  private broadcast(topic: string, payload: string) {
    const item = { type: 'message', topic, payload, timestamp: Date.now() };
    this.clients.forEach((client) => {
      if (client.topics.size === 0) return;
      const shouldSend = Array.from(client.topics).some((filter) => matchTopic(filter, topic));
      if (shouldSend) {
        client.socket.send(JSON.stringify(item));
      }
    });
  }
}
