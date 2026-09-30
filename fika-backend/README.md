# Fika Backend MVP

The backend for **Fika**, a social-connection product built around small, real-world meetups. It exposes a REST API and Socket.io rooms for the core loop: discover a Fika, join it, chat, meet, and rate the experience.

## Stack

- Node.js + TypeScript + Express 5
- PostgreSQL + Prisma ORM
- Socket.io for Fika rooms
- Zod request validation, bcrypt password hashing, JWT-backed HTTP-only cookies
- Helmet, CORS credentials configuration, and authentication rate limiting

## Setup

1. Copy `.env.example` to `.env` and set a PostgreSQL `DATABASE_URL` plus a random `SESSION_SECRET` of at least 32 characters.
2. Install dependencies: `npm install`
3. Generate Prisma Client: `npm run prisma:generate`
4. Apply the migration: `npm run prisma:migrate`
5. Seed interests and conversation starters: `npm run prisma:seed`
6. Start the API: `npm run dev`

The default API URL is `http://localhost:4000`. `GET /health` confirms that the HTTP process is up. The application must be connected to PostgreSQL before `npm run dev` can start.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the API with file watching |
| `npm start` | Run the API |
| `npm run build` | Type-check the backend |
| `npm test` | Run unit and service tests |
| `npm run prisma:migrate` | Create/apply a development migration |
| `npm run prisma:seed` | Seed default interests and starters |

## Authentication

`POST /api/auth/register` and `POST /api/auth/login` set the `fika_session` HTTP-only cookie. Frontend requests must send credentials, for example:

```ts
fetch('http://localhost:4000/api/auth/me', { credentials: 'include' });
```

Passwords are bcrypt-hashed and are never selected for public responses. The authenticated user is always inferred from the session cookie—request bodies never decide ownership.

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Amara Mensah",
  "username": "amara_m",
  "email": "amara@example.com",
  "password": "at-least-eight-characters"
}
```

## REST API

All successful responses use `{ "success": true, "data": ..., "message": "..." }`. Failures use `{ "success": false, "message": "...", "errorCode": "..." }` with an appropriate HTTP status.

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Users | `GET /api/users/:id`, `PUT /api/users/me`, `GET/POST /api/users/me/interests`, `DELETE /api/users/me/interests/:interestId` |
| User history & safety | `GET /api/users/me/fikas/upcoming`, `GET /api/users/me/fikas/past`, `GET /api/users/me/blocked`, `POST/DELETE /api/users/:id/block` |
| Interests | `GET /api/interests`, `GET /api/interests/:id` |
| Fikas | `POST/GET /api/fikas`, `GET/PUT/DELETE /api/fikas/:id`, `POST /api/fikas/:id/join`, `POST /api/fikas/:id/leave`, `GET /api/fikas/:id/participants` |
| Room history | `GET /api/fikas/:fikaId/messages` |
| Discovery extras | `GET /api/conversation-starters`, `GET /api/conversation-starters/random`, `GET /api/matching/suggestions` |
| Notifications | `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all` |
| Safety & feedback | `POST /api/ratings`, `POST /api/reports` |

### Fika discovery

`GET /api/fikas` accepts `type`, `date`, `location`, `interest`, `status`, `maxDistance`, `limit`, `page`, and `search`. The response includes host, active-participant count, interest tags, and pagination.

`maxDistance` uses profile coordinates and returns only Fikas within the requested kilometre radius. Coordinates are deliberately omitted from public discovery and detail results; they are available only to a host or active participant.

Example:

```http
GET /api/fikas?type=COFFEE&status=OPEN&limit=12&page=1
```

### Creating a Fika

```http
POST /api/fikas
Cookie: fika_session=...
Content-Type: application/json

{
  "title": "Coffee & tech talk",
  "description": "A relaxed coffee for people building interesting things.",
  "type": "COFFEE",
  "date": "2026-08-20",
  "startTime": "17:00",
  "duration": 60,
  "locationName": "Osu, Accra",
  "maxParticipants": 4,
  "interestIds": ["<technology-interest-id>"]
}
```

The host is created as the first `JOINED` participant. Joining is executed in a serializable Prisma transaction, retried for serialization conflicts, and recalculates `OPEN`/`FULL` status so capacity cannot be exceeded under concurrent requests.

## Socket.io rooms

Connect with the same HTTP-only session cookie and use a room named `fika:{fikaId}`. Socket authentication and every room action verify active Fika participation.

| Client event | Payload | Result |
| --- | --- | --- |
| `join_fika_room` | `{ fikaId }` | Joins the authenticated participant to the room and emits `joined_fika_room` |
| `leave_fika_room` | `{ fikaId }` | Leaves and emits `left_fika_room` |
| `send_message` | `{ fikaId, content }` | Persists the message and emits `new_message` to the room |
| `typing_start` | `{ fikaId }` | Broadcasts typing state to the room |
| `typing_stop` | `{ fikaId }` | Broadcasts stop-typing state |

Failed socket actions emit `fika_error` with a safe `errorCode`; internal errors are never sent to the client.

## Business and safety rules

- A user cannot be an active participant twice; a unique `(fikaId, userId)` constraint protects the record.
- Cancelled and completed Fikas cannot be joined. Participants cannot leave once the Fika is active or completed.
- Only the host may change or cancel a Fika; hosts cancel rather than leave their own Fika.
- Chat requires active participation and message content is trimmed and capped at 1,000 characters.
- Ratings require a completed Fika, two participating users, a 1–5 score, and use a unique reviewer/Fika/reviewed-user constraint.
- Blocks are excluded from matching suggestions and host-based discovery for the blocker.
- General profile location is public only where appropriate. User coordinates are never part of public profiles, and Fika coordinates are gated to active participants/hosts.

## Images

The API stores a validated `profileImage` URL, rather than accepting raw image bytes. This is compatible with direct unsigned Cloudinary uploads (or another media service): upload in the client, then save the resulting secure URL through `PUT /api/users/me`. Cloudinary environment variables are provided for adding a signed upload service later without changing the User model.

## Reminders

`src/services/reminder.service.ts` is isolated from scheduling infrastructure. A future worker can call `queueUpcomingFikaReminders(60)` to create reminder notifications for participants in Fikas starting within the next hour.

## Tests

`npm test` covers request validation, password/credential handling, Fika lifecycle and capacity rules, host authorization, duplicate/full joins, participant-only messaging, and compatibility scoring. Database-connected endpoint tests can be added against a disposable local PostgreSQL database without changing application code.
