# Mosquitto MQTT Admin Dashboard

A full-stack management console for Mosquitto brokers. It exposes REST + WebSocket APIs for publishing, subscribing, managing users/ACLs/configs, and restarting the broker container, along with a React + Ant Design dashboard.

## Project layout

```
mqtt-admin/
├── backend/       # Express + TypeScript API server
├── frontend/      # React + Ant Design single-page app
├── mosquitto/     # Sample config/pw/acl directories mounted into Mosquitto
├── docker-compose.yml
├── API.md         # REST/WebSocket reference
└── README.md
```

## Requirements

- Node.js 18+
- npm 9+
- Mosquitto broker reachable from the backend (defaults to `localhost:1883`)
- `mosquitto_passwd` CLI available for user management
- Optional: Docker + Docker Compose for containerized deployment

## Backend (Admin Server)

```bash
cd backend
npm install
npm run dev         # starts on http://localhost:4000
npm run build && npm start  # production build
```

Environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `MQTT_HOST` | `27.191.2.71` | Broker hostname/IP |
| `MQTT_PORT` | `5502` | Broker port |
| `MQTT_USERNAME` | `admin` | MQTT username |
| `MQTT_PASSWORD` | `wjm234.CN` | MQTT password |
| `MOSQUITTO_CONF` | `/mosquitto/config/mosquitto.conf` | mosquitto.conf path |
| `MOSQUITTO_PWFILE` | `/mosquitto/config/pwfile` | pwfile path |
| `MOSQUITTO_ACLFILE` | `/mosquitto/config/aclfile` | aclfile path |
| `MQTT_CONTAINER` | `mqtt-broker` | Docker container name used by `/api/restart` |
| `PORT` | `4000` | HTTP/WebSocket listener |

## Frontend (React Dashboard)

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173 (connects to backend :4000)
npm run build       # production build into dist/
```

Set `VITE_API_BASE` and `VITE_WS_URL` to point to the backend when building for production (default `http://localhost:4000` and `ws://localhost:4000/ws`).

## Docker Compose

A ready-to-run stack is provided:

```bash
cd mqtt-admin
docker compose up --build
```

- Mosquitto broker: `localhost:1883`
- Backend API/WebSocket: `localhost:4000`
- Frontend dashboard: `http://localhost:3000`

The compose file mounts `./mosquitto/config|data|log` into the Mosquitto container so edits performed via the dashboard are persistent.

## How to start the Admin system

1. Prepare Mosquitto config/pw/acl files under `mosquitto/config/` (samples included).
2. Start the backend (`npm run dev` or via Docker) so it can connect to the broker.
3. Start the frontend (`npm run dev`) and open the dashboard in your browser.
4. Configure the MQTT connection credentials on the backend via environment variables if your broker uses authentication.

For endpoint details refer to [API.md](API.md).
