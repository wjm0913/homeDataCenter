import EventEmitter from 'events';
import { IClientPublishOptions } from 'mqtt';
import { TopicCollector } from '../services/topicCollector';
import { OverviewService } from '../services/overviewService';
export declare class MqttManager extends EventEmitter {
    private topics;
    private overview;
    private client?;
    private subscriptions;
    private readonly reservedTopics;
    private connected;
    constructor(topics: TopicCollector, overview: OverviewService);
    private connect;
    publish(topic: string, payload: string, options: IClientPublishOptions): void;
    subscribe(topic: string): void;
    unsubscribe(topic: string): void;
    connectionInfo(): {
        host: string;
        port: number;
        username: string;
        connected: boolean;
    };
}
//# sourceMappingURL=mqttManager.d.ts.map