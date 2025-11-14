"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionServer = void 0;
const ws_1 = require("ws");
const config_1 = require("../config");
function matchTopic(filter, topic) {
    const filterParts = filter.split('/');
    const topicParts = topic.split('/');
    for (let i = 0; i < filterParts.length; i++) {
        const current = filterParts[i];
        if (current === '#')
            return true;
        if (topicParts[i] === undefined)
            return false;
        if (current === '+')
            continue;
        if (topicParts[i] !== current)
            return false;
    }
    return filterParts.length === topicParts.length;
}
class SubscriptionServer {
    constructor(server, mqttManager) {
        this.clients = new Set();
        this.wss = new ws_1.Server({ server, path: config_1.WEBSOCKET_PATH });
        mqttManager.on('message', ({ topic, payload }) => {
            this.broadcast(topic, payload);
        });
        this.wss.on('connection', (socket) => {
            const client = { socket, topics: new Set() };
            this.clients.add(client);
            socket.on('message', (raw) => {
                try {
                    const data = JSON.parse(raw.toString());
                    if (data.action === 'subscribe' && Array.isArray(data.topics)) {
                        data.topics.forEach((topic) => {
                            client.topics.add(topic);
                            mqttManager.subscribe(topic);
                        });
                    }
                    if (data.action === 'unsubscribe' && Array.isArray(data.topics)) {
                        data.topics.forEach((topic) => {
                            client.topics.delete(topic);
                            mqttManager.unsubscribe(topic);
                        });
                    }
                }
                catch (error) {
                    socket.send(JSON.stringify({ type: 'error', message: 'Invalid payload' }));
                }
            });
            socket.on('close', () => {
                this.clients.delete(client);
            });
            socket.send(JSON.stringify({ type: 'ready' }));
        });
    }
    broadcast(topic, payload) {
        const item = { type: 'message', topic, payload, timestamp: Date.now() };
        this.clients.forEach((client) => {
            if (client.topics.size === 0)
                return;
            const shouldSend = Array.from(client.topics).some((filter) => matchTopic(filter, topic));
            if (shouldSend) {
                client.socket.send(JSON.stringify(item));
            }
        });
    }
}
exports.SubscriptionServer = SubscriptionServer;
//# sourceMappingURL=subscriptionServer.js.map