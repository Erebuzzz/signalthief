# Local Device Pairing

The desktop worker exposes a localhost bridge. The bridge is designed for web and extension clients that need to request local extraction without giving the cloud backend access to cookies, browser sessions, or large media streams.

## Default Endpoint

```text
http://127.0.0.1:43173
```

Override with:

```text
SIGNALTHIEF_DESKTOP_HOST=127.0.0.1
SIGNALTHIEF_DESKTOP_PORT=43173
```

## Pairing Flow

1. Start pairing:

```http
POST /pair/start
Content-Type: application/json

{
  "clientName": "SignalThief Web",
  "origin": "http://localhost:5173"
}
```

2. Show the returned `pairingCode` to the user.

3. Confirm pairing:

```http
POST /pair/confirm
Content-Type: application/json

{
  "pairingId": "returned-pairing-id",
  "pairingCode": "ABC123"
}
```

4. Store the returned session token in client memory or short-lived local storage.

5. Call protected routes:

```http
Authorization: Bearer <sessionToken>
```

## Protected Routes

| Route | Purpose |
| --- | --- |
| `GET /health` | Device status and capabilities |
| `POST /api/extract` | Local metadata extraction |
| `POST /api/download` | Local download and conversion |
| `POST /api/jobs` | Local job creation |
| `GET /api/jobs/:id` | Local job status |
| `POST /api/jobs/:id/cancel` | Cancel local job |

## Security Notes

- The worker binds to `127.0.0.1` by default.
- Pairing codes expire after five minutes.
- Session tokens expire after twelve hours.
- The backend should never receive long-lived user cookies.
- The bridge should validate the origin before broader production use.
