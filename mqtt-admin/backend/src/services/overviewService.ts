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
  history: { timestamp: number; count: number }[];
}

export class OverviewService {
  private sysInfo: Record<string, string> = {};
  private clients: Map<string, ClientInfo> = new Map();
  private messageTimestamps: number[] = [];
  private history: { timestamp: number; count: number }[] = [];

  recordMessage(topic: string) {
    if (!topic.startsWith('$SYS')) {
      const now = Date.now();
      this.messageTimestamps.push(now);
      this.messageTimestamps = this.messageTimestamps.filter((ts) => now - ts < 5 * 60 * 1000);

      const bucket = now - (now % 60000);
      const last = this.history[this.history.length - 1];
      if (last && last.timestamp === bucket) {
        last.count += 1;
      } else {
        this.history.push({ timestamp: bucket, count: 1 });
      }
      this.history = this.history.filter((entry) => now - entry.timestamp < 5 * 60 * 1000);
    }
  }

  updateSys(topic: string, payload: string) {
    this.sysInfo[topic] = payload;
    const match = topic.match(/^\$SYS\/broker\/connection\/([^\/]+)\/(.+)$/);
    if (match) {
      const [, clientIdRaw, key] = match;
      if (!clientIdRaw) return;
      const existing = this.clients.get(clientIdRaw);
      const client: ClientInfo = existing ? { ...existing } : { clientId: clientIdRaw, lastSeen: Date.now() };
      if (key === 'state') {
        client.state = payload;
        client.lastSeen = Date.now();
      } else if (key === 'address') {
        client.address = payload;
      } else if (key === 'username') {
        client.username = payload;
      }
      this.clients.set(clientIdRaw, client);
    }
  }

  getClients(): ClientInfo[] {
    return Array.from(this.clients.values()).map((client) => ({
      ...client,
      lastSeen: client.lastSeen || Date.now()
    }));
  }

  getOverview(topicCount: number): OverviewPayload {
    const now = Date.now();
    this.messageTimestamps = this.messageTimestamps.filter((ts) => now - ts < 60000);
    const messageRate = this.messageTimestamps.length / 60;
    const clientsConnected = Number(this.sysInfo['$SYS/broker/clients/connected'] || this.getClients().filter((c) => c.state === '1').length || 0);
    const subscriptionCount = Number(this.sysInfo['$SYS/broker/subscriptions/count'] || topicCount || 0);
    return {
      clientsConnected,
      messageRate: Number(messageRate.toFixed(3)),
      subscriptionCount,
      sysInfo: this.sysInfo,
      history: this.history
    };
  }
}
