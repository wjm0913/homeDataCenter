import cors from 'cors';
import express, { Request, Response } from 'express';
import http from 'http';
import { SERVER_PORT } from './config';
import { TopicCollector } from './services/topicCollector';
import { OverviewService } from './services/overviewService';
import { MqttManager } from './mqtt/mqttManager';
import { SubscriptionServer } from './websocket/subscriptionServer';
import { UserService } from './services/userService';
import { AclService } from './services/aclService';
import { ConfigService } from './services/configService';
import { DockerService } from './services/dockerService';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const topicCollector = new TopicCollector();
const overviewService = new OverviewService();
const mqttManager = new MqttManager(topicCollector, overviewService);
mqttManager.on('error', (err) => {
  console.error('MQTT connection error:', err.message || err);
});

const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get(
  '/api/overview',
  asyncHandler(async (_req: Request, res: Response) => {
    const overview = overviewService.getOverview(topicCollector.list().length);
    res.json({ ...overview, connection: mqttManager.connectionInfo() });
  })
);

app.get(
  '/api/clients',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(overviewService.getClients());
  })
);

app.post(
  '/api/publish',
  asyncHandler(async (req: Request, res: Response) => {
    const { topic, payload, qos = 0, retain = false } = req.body;
    if (!topic) throw new Error('Topic is required');
    mqttManager.publish(topic, typeof payload === 'string' ? payload : JSON.stringify(payload), { qos, retain });
    res.json({ status: 'ok' });
  })
);

app.get(
  '/api/topics',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ list: topicCollector.list(), tree: topicCollector.tree() });
  })
);

app.get(
  '/api/users',
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await UserService.list();
    res.json(users);
  })
);

app.post(
  '/api/users',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;
    await UserService.add(username, password);
    res.json({ status: 'created' });
  })
);

app.delete(
  '/api/users/:username',
  asyncHandler(async (req: Request, res: Response) => {
    const username = req.params.username as string;
    await UserService.remove(username);
    res.json({ status: 'deleted' });
  })
);

app.get(
  '/api/acl',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await AclService.list());
  })
);

app.post(
  '/api/acl',
  asyncHandler(async (req: Request, res: Response) => {
    await AclService.save(req.body.entries || []);
    res.json({ status: 'saved' });
  })
);

app.get(
  '/api/conf',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await ConfigService.read());
  })
);

app.post(
  '/api/conf',
  asyncHandler(async (req: Request, res: Response) => {
    await ConfigService.save(req.body);
    res.json({ status: 'saved' });
  })
);

app.post(
  '/api/restart',
  asyncHandler(async (_req: Request, res: Response) => {
    await DockerService.restart();
    res.json({ status: 'restarted' });
  })
);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const server = http.createServer(app);
new SubscriptionServer(server, mqttManager);

server.listen(SERVER_PORT, () => {
  console.log(`Admin backend running on :${SERVER_PORT}`);
});
