"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const config_1 = require("./config");
const topicCollector_1 = require("./services/topicCollector");
const overviewService_1 = require("./services/overviewService");
const mqttManager_1 = require("./mqtt/mqttManager");
const subscriptionServer_1 = require("./websocket/subscriptionServer");
const userService_1 = require("./services/userService");
const aclService_1 = require("./services/aclService");
const configService_1 = require("./services/configService");
const dockerService_1 = require("./services/dockerService");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '1mb' }));
const topicCollector = new topicCollector_1.TopicCollector();
const overviewService = new overviewService_1.OverviewService();
const mqttManager = new mqttManager_1.MqttManager(topicCollector, overviewService);
mqttManager.on('error', (err) => {
    console.error('MQTT connection error:', err.message || err);
});
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
app.get('/api/overview', asyncHandler(async (_req, res) => {
    const overview = overviewService.getOverview(topicCollector.list().length);
    res.json({ ...overview, connection: mqttManager.connectionInfo() });
}));
app.get('/api/clients', asyncHandler(async (_req, res) => {
    res.json(overviewService.getClients());
}));
app.post('/api/publish', asyncHandler(async (req, res) => {
    const { topic, payload, qos = 0, retain = false } = req.body;
    if (!topic)
        throw new Error('Topic is required');
    mqttManager.publish(topic, typeof payload === 'string' ? payload : JSON.stringify(payload), { qos, retain });
    res.json({ status: 'ok' });
}));
app.get('/api/topics', asyncHandler(async (_req, res) => {
    res.json({ list: topicCollector.list(), tree: topicCollector.tree() });
}));
app.get('/api/users', asyncHandler(async (_req, res) => {
    const users = await userService_1.UserService.list();
    res.json(users);
}));
app.post('/api/users', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    await userService_1.UserService.add(username, password);
    res.json({ status: 'created' });
}));
app.delete('/api/users/:username', asyncHandler(async (req, res) => {
    const username = req.params.username;
    await userService_1.UserService.remove(username);
    res.json({ status: 'deleted' });
}));
app.get('/api/acl', asyncHandler(async (_req, res) => {
    res.json(await aclService_1.AclService.list());
}));
app.post('/api/acl', asyncHandler(async (req, res) => {
    await aclService_1.AclService.save(req.body.entries || []);
    res.json({ status: 'saved' });
}));
app.get('/api/conf', asyncHandler(async (_req, res) => {
    res.json(await configService_1.ConfigService.read());
}));
app.post('/api/conf', asyncHandler(async (req, res) => {
    await configService_1.ConfigService.save(req.body);
    res.json({ status: 'saved' });
}));
app.post('/api/restart', asyncHandler(async (_req, res) => {
    await dockerService_1.DockerService.restart();
    res.json({ status: 'restarted' });
}));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});
const server = http_1.default.createServer(app);
new subscriptionServer_1.SubscriptionServer(server, mqttManager);
server.listen(config_1.SERVER_PORT, () => {
    console.log(`Admin backend running on :${config_1.SERVER_PORT}`);
});
//# sourceMappingURL=index.js.map