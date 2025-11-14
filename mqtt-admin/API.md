# MQTT Admin API

Base URL: `http://localhost:4000`

## Overview

### GET `/api/overview`
Returns broker metrics and $SYS snapshot.

Response:
```json
{
  "clientsConnected": 8,
  "messageRate": 1.4,
  "subscriptionCount": 12,
  "history": [ { "timestamp": 1714128000000, "count": 42 } ],
  "sysInfo": { "$SYS/broker/version": "Mosquitto 2.0" }
}
```

### GET `/api/clients`
List known clients discovered from `$SYS/broker/connection/#`.

Response:
```json
[
  {
    "clientId": "sensor-1",
    "username": "sensor",
    "address": "192.168.1.10:42344",
    "state": "1",
    "lastSeen": 1714128000000
  }
]
```

## Messaging

### POST `/api/publish`
Publish a message via Mosquitto.

Body:
```json
{ "topic": "home/temp", "payload": "25", "qos": 0, "retain": false }
```

### WebSocket `/ws`
- Send `{ "action": "subscribe", "topics": ["home/#"] }` to start streaming.
- Send `{ "action": "unsubscribe", "topics": ["home/#"] }` to stop.
- Messages arrive as `{ "type": "message", "topic": "home/temp", "payload": "...", "timestamp": 1714128000000 }`.

## Topics

### GET `/api/topics`
Returns collected topics.

Response:
```json
{
  "list": ["home/temp", "home/humidity"],
  "tree": [{ "key": "home", "title": "home", "children": [ { "key": "home/temp", "title": "temp" } ] }]
}
```

## Users

### GET `/api/users`
Read `/mosquitto/config/pwfile`.

### POST `/api/users`
Add or update user using `mosquitto_passwd -b`.
Body: `{ "username": "admin", "password": "secret" }`

### DELETE `/api/users/:username`
Remove a user via `mosquitto_passwd -D`.

## ACL

### GET `/api/acl`
Parse `/mosquitto/config/aclfile` into entries.

### POST `/api/acl`
Persist ACL entries.
Body:
```json
{
  "entries": [
    { "user": "sensor", "access": "read", "topic": "home/#" }
  ]
}
```

## Configuration

### GET `/api/conf`
Read `/mosquitto/config/mosquitto.conf` into key/value map.

### POST `/api/conf`
Write configuration map back to file.

## Broker control

### POST `/api/restart`
Runs `docker restart mqtt-broker` to reboot the container (requires Docker socket access).
