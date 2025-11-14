export interface ClientInfo {
    clientId: string;
    username?: string;
    address?: string;
    state?: string;
    lastSeen: number;
}
export interface OverviewPayload {
    clientsConnected: number;
    messageRate: number;
    subscriptionCount: number;
    sysInfo: Record<string, string>;
    history: {
        timestamp: number;
        count: number;
    }[];
}
export declare class OverviewService {
    private sysInfo;
    private clients;
    private messageTimestamps;
    private history;
    recordMessage(topic: string): void;
    updateSys(topic: string, payload: string): void;
    getClients(): ClientInfo[];
    getOverview(topicCount: number): OverviewPayload;
}
//# sourceMappingURL=overviewService.d.ts.map