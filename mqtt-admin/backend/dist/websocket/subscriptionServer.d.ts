import { Server as HTTPServer } from 'http';
import { MqttManager } from '../mqtt/mqttManager';
export declare class SubscriptionServer {
    private wss;
    private clients;
    constructor(server: HTTPServer, mqttManager: MqttManager);
    private broadcast;
}
//# sourceMappingURL=subscriptionServer.d.ts.map