# Voting Platform API Reference

This document covers every endpoint for the **i-Sabi voting platform**.  
It is intended for engineers building the **mobile app** and the **event owner dashboard**.

---

## Base URL

```
/api
```

## Authentication

Routes marked **auth** require a valid JWT:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Public routes require no token.

---

## Existing Endpoints (unchanged)

These endpoints existed before this update and are **fully backward compatible** — no changes required on the client side.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/submit-vote` | ✅ | In-app vote using wallet balance |
| `PUT` | `/submit-vote-no-token` | ❌ | Vote without auth (legacy) |
| `PUT` | `/submit-vote-web` | ✅ | Web vote using wallet balance |
| `GET` | `/get-my-votes` | ✅ | All votes cast by the logged-in user |
| `GET` | `/get-my-vote-stats` | ✅ | Most recent voted event + total spent |
| `GET` | `/get-my-vote-statistics` | ✅ | Aggregate vote counts and spend |
| `GET` | `/get-my-vote-transactions` | ✅ | Full paginated vote history |
| `GET` | `/who-voted-for-me/:eventId` | ❌ | Voter list for a contestant |
| `GET` | `/v2/vote/:eventId` | ❌ | Multi-contestant voting page data |
| `GET` | `/v2/vote/:eventId/leaderboard` | ❌ | Live leaderboard for an event |
| `GET` | `/v2/vote/receipt` | ❌ | Receipt for a completed vote transaction |
| `POST` | `/v2/vote/initiate` | ❌ | Initiate Paystack payment for votes |
| `GET` | `/v2/vote/verify` | ❌ | Verify Paystack payment + credit votes |
| `POST` | `/v2/vote/webhook/paystack` | ❌ | Paystack webhook (server-to-server) |

---

## New Endpoints

### 1. Single-Contestant Page

```
GET /v2/vote/contestant/:contestantId
```

**Auth:** None  
**Use case:** Mobile app / web — render the full voting page for one contestant.

Returns everything needed in a single call.

**Response**

```json
{
  "contestant": {
    "_id": "...",
    "fullname": "Ada Okonkwo",
    "nickname": "Ada",
    "image_url": "https://...",
    "vote_count": 4820,
    "my_code": 7
  },
  "event": {
    "_id": "...",
    "eventName": "Campus Queen 2025",
    "image_url": "https://...",
    "companyName": "UniLag Events",
    "aboutEvent": "Annual beauty and talent pageant.",
    "startDate": "2025-11-01T00:00:00.000Z",
    "startTime": "10:00 AM",
    "costPerVote": 50
  },
  "packages": [
    {
      "_id": "pkg_001",
      "name": "Fan Pack",
      "description": "Support your favourite!",
      "votes": 10,
      "price": 450,
      "isSoldOut": false,
      "available": null
    },
    {
      "_id": "pkg_002",
      "name": "Super Fan",
      "description": "Go all in.",
      "votes": 50,
      "price": 2000,
      "isSoldOut": false,
      "available": 12
    }
  ],
  "topSupporters": [
    { "voterName": "Tunde B.", "totalVotes": 200 },
    { "voterName": "Ngozi A.", "totalVotes": 150 }
  ],
  "goalProgress": {
    "goal": 10000,
    "current": 4820,
    "pct": 48.2
  }
}
```

> `goalProgress` is `null` when the event owner has not set a vote target.  
> `available` in packages is `null` for unlimited packages.

---

### 2. List Vote Packages

```
GET /v2/vote/:eventId/packages?contestantId=<id>
```

**Auth:** None  
**Use case:** Fetch available bundles for a dropdown / package picker.  
`contestantId` is optional — omit to get all active packages for the event.

**Response**

```json
{
  "packages": [
    {
      "_id": "pkg_001",
      "eventId": "...",
      "contestantId": "...",
      "name": "Fan Pack",
      "description": "Support your favourite!",
      "votes": 10,
      "price": 450,
      "active": true,
      "totalSlots": 0,
      "soldSlots": 0,
      "availableSlots": null,
      "isSoldOut": false
    }
  ]
}
```

---

### 3. Initiate Vote Payment (upgraded)

```
POST /v2/vote/initiate
```

**Auth:** None  
**Use case:** Start a Paystack payment. Use `packageId` to buy a bundle, or `votes` for a custom count.

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventId` | String | ✅ | |
| `contestantId` | String | ✅ | |
| `voterName` | String | ✅ | |
| `voterEmail` | String | ✅ | |
| `packageId` | String | ⚠️ | Required when `votes` is omitted |
| `votes` | Number | ⚠️ | Required when `packageId` is omitted |
| `voterPhone` | String | ❌ | |
| `message` | String | ❌ | Support message shown in emails |
| `referrer` | String | ❌ | Share-link / UTM source |
| `channel` | String | ❌ | `"app"` \| `"web"` \| `"share"` — defaults to `"web"` |

> When `packageId` is supplied, `votes` and price are taken from the package record. The `votes` field is ignored.

**Response**

```json
{
  "message": "Payment initiated.",
  "reference": "vote_1717600000_a1b2c3d4",
  "amount": 450,
  "votes": 10,
  "costPerVote": 45,
  "contestant": { "_id": "...", "fullname": "Ada Okonkwo" },
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "..."
}
```

Redirect the user to `authorization_url` to complete payment.

---

### 4. Verify Payment + Credit Votes

```
GET /v2/vote/verify?reference=<reference>
```

**Auth:** None  
**Use case:** Call this from the Paystack redirect callback URL.

On success, votes are credited atomically and two emails are sent automatically:
- **Voter** receives a receipt (votes, amount, reference, their message)
- **Event owner** receives a notification (voter name, votes, running total)

**Response**

```json
{
  "status": "success",
  "message": "10 vote(s) successfully credited to <contestantId>.",
  "votes": 10,
  "amount": 450,
  "reference": "vote_1717600000_a1b2c3d4",
  "voterName": "Tunde Bakare"
}
```

| Status | Meaning |
|--------|---------|
| `success` | Votes credited, emails sent |
| `already_completed` | Duplicate call — idempotent, safe to ignore |
| `payment_failed` | Paystack did not confirm the charge |
| `amount_mismatch` | Paid less than the expected amount |

---

## Event Owner Endpoints

All endpoints below require an event owner JWT.

---

### 5. Create Vote Package

```
POST /v2/vote/packages
```

**Auth:** ✅ Event owner  
**Use case:** Define a vote bundle voters can pick on the voting page.

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `eventId` | String | ✅ | |
| `contestantId` | String | ✅ | |
| `name` | String | ✅ | e.g. `"Fan Pack"` |
| `votes` | Number | ✅ | Votes granted per purchase |
| `price` | Number | ✅ | Total price in Naira |
| `description` | String | ❌ | |
| `totalSlots` | Number | ❌ | `0` = unlimited (default) |

**Response**

```json
{
  "message": "Vote package created.",
  "package": { "_id": "...", "name": "Fan Pack", "votes": 10, "price": 450, ... }
}
```

---

### 6. Update Vote Package

```
PATCH /v2/vote/packages/:id
```

**Auth:** ✅ Event owner  
**Use case:** Edit price, name, slot cap, or pause/resume a package.

**Request body** — send only the fields to change:

| Field | Type |
|-------|------|
| `name` | String |
| `description` | String |
| `price` | Number |
| `votes` | Number |
| `totalSlots` | Number |
| `active` | Boolean |

**Response**

```json
{
  "message": "Vote package updated.",
  "package": { ... }
}
```

---

### 7. Delete Vote Package

```
DELETE /v2/vote/packages/:id
```

**Auth:** ✅ Event owner  
**Use case:** Remove a package from the voting page.

Soft-delete — sets `active: false`. Historical `soldSlots` data is preserved for reporting.

**Response**

```json
{ "message": "Vote package deactivated." }
```

---

### 8. List Contestants

```
GET /get-contestant/:eventId
```

**Auth:** ✅ Event owner  
**Use case:** Fetch all contestants for a voting event (dashboard view, edit contestants, build leaderboard UI).

**Response**

```json
{
  "contestant": [
    {
      "_id": "...",
      "event_id": "...",
      "fullname": "Ada Okonkwo",
      "nickname": "Ada",
      "image_url": "https://...",
      "my_code": 7,
      "vote_count": 4820,
      "date": "2025-10-01T00:00:00.000Z"
    }
  ],
  "cost_per_vote": 50,
  "eventData": {
    "_id": "...",
    "eventName": "Campus Queen 2025",
    "status": "APPROVED"
  }
}
```

---

### 9. Add Contestant

```
POST /create-contestant
```

**Auth:** ✅ Event owner  
**Use case:** Register a new contestant under a voting event.

**Request body**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `event_id` | String | ✅ | The voting event's `_id` |
| `fullname` | String | ✅ | Contestant's full name |
| `nickname` | String | ✅ | Short display name shown on voting page |
| `image_url` | String | ✅ | Hosted photo URL |

**Response**

```json
{
  "message": "Contestant created.",
  "contestant": {
    "_id": "...",
    "event_id": "...",
    "fullname": "Ada Okonkwo",
    "nickname": "Ada",
    "image_url": "https://...",
    "my_code": 7,
    "vote_count": 0,
    "date": "2025-10-01T00:00:00.000Z"
  }
}
```

---

### 10. Remove Contestant

```
DELETE /delete-contestant/:id
```

**Auth:** ✅ Event owner  
**Use case:** Remove a contestant from the event. `:id` is the contestant's `_id`.

Soft-delete — contestant is deactivated and hidden from the public voting page. Historical vote data is preserved.

**Response**

```json
{ "message": "Contestant deleted." }
```

---

### 11. Update Contestant

```
PUT /update-contestant/:id
```

**Auth:** ✅ Event owner  
**Use case:** Edit a contestant's display name, nickname, or photo. `:id` is the contestant's `_id`.

**Request body** — send only the fields to change:

| Field | Type |
| ------- | ------ |
| `fullname` | String |
| `nickname` | String |
| `image_url` | String |

**Response**

```json
{
  "message": "Contestant updated.",
  "contestant": {
    "_id": "...",
    "event_id": "...",
    "fullname": "Ada Okonkwo",
    "nickname": "Ada Q",
    "image_url": "https://...",
    "my_code": 7,
    "vote_count": 4820
  }
}
```

---

### 12. Vote Transaction Records

```
GET /get-event-records/:eventId
```

**Auth:** ✅ Event owner  
**Use case:** Full list of individual vote purchases for an event. Use for revenue reporting and audit.

**Response**

```json
{
  "transList": [
    {
      "_id": "...",
      "event_id": "...",
      "contestant_id": "...",
      "total_amount": 450,
      "purchased_vote": 10,
      "ref": "vote_1717600000_a1b2c3d4",
      "message": "Go Ada!",
      "date": "2025-11-05T14:22:00.000Z"
    }
  ],
  "transanctionCount": 142
}
```

---

### 12. Vote Trend Analytics

```
GET /v2/event-owner/event/:eventId/vote-trend?period=<period>
```

**Auth:** ✅ Event owner  
**Use case:** Time-series chart data showing votes received per contestant over time. Powers the analytics dashboard.

**Query params**

| Param    | Values                         | Default |
|----------|--------------------------------|---------|
| `period` | `daily` / `weekly` / `monthly` | `daily` |

**Response**

```json
{
  "period": "daily",
  "labels": ["Nov 1", "Nov 2", "Nov 3"],
  "datasets": [
    {
      "contestantId": "...",
      "fullname": "Ada Okonkwo",
      "nickname": "Ada",
      "image_url": "https://...",
      "data": [120, 340, 210]
    },
    {
      "contestantId": "...",
      "fullname": "Chioma Eze",
      "nickname": "Chi",
      "image_url": "https://...",
      "data": [95, 180, 400]
    }
  ]
}
```

> `labels` and each `data` array are always the same length. Index positions correspond.

---

### 13. Voting Event Summary

```
GET /v2/event-owner/event/:eventId/summary
```

**Auth:** ✅ Event owner  
**Use case:** Single-call snapshot of a voting event's key metrics — total votes, revenue, leaderboard, and live status. Powers the event detail dashboard header.

**Response** (voting event)

```json
{
  "_id": "...",
  "eventName": "Campus Queen 2025",
  "type": "VOTING",
  "status": "APPROVED",
  "venue": "UniLag Auditorium",
  "startDate": "2025-11-01T00:00:00.000Z",
  "startTime": "10:00 AM",
  "image_url": "https://...",
  "event_is_live": true,
  "activePins": 0,
  "voting": {
    "totalVotes": 18450,
    "costPerVote": 50,
    "contestantCount": 6,
    "estimatedRevenue": 922500,
    "leaderboard": [
      {
        "_id": "...",
        "fullname": "Ada Okonkwo",
        "nickname": "Ada",
        "image_url": "https://...",
        "vote_count": 4820,
        "pct": 26.1
      }
    ]
  }
}
```

> `voting` is only present when `type === "VOTING"`. For `TICKETING` events the response contains `tickets` instead, and for `FORM-SALES` it contains `forms`.

---

### 14. Voter List

```
GET /who-voted-for-me/:eventId
```

**Auth:** None (public endpoint — token is accepted but not required)  
**Use case:** Full list of voters across all contestants for this event. Includes voter contact details and per-voter vote totals.

**Response**

```json
{
  "voters": [
    {
      "fullname": "Tunde Bakare",
      "username": "tundeb",
      "email": "tunde@example.com",
      "phone": "08012345678",
      "image_url": null,
      "votes": 200,
      "date": "2025-11-04T09:15:00.000Z",
      "contestant": {
        "fullname": "Ada Okonkwo",
        "nickname": "Ada",
        "image_url": "https://..."
      },
      "message": "We love you Ada!",
      "total_amount": 9000
    }
  ]
}
```

> The response key may be `voters`, `votes`, or `data` depending on server version — check all three when parsing (see [Vote Transaction Fields](#vote-transaction-fields)).

---

### 15. Set Vote Goal

```http
PATCH /v2/event-owner/event/:eventId/vote-goal
```

**Auth:** ✅ Event owner  
**Use case:** Set or update the vote target for a voting event. The goal appears as a progress bar on the public voting page (`goalProgress`). Send `0` to remove the goal.

Only valid for `VOTING` type events.

Request body — send `{ "goal": <number> }` where `goal` is a non-negative integer. Pass `0` to remove the goal.

Response — set goal:

```json
{ "message": "Vote goal updated.", "goal": 10000 }
```

Response — remove goal (`goal: 0`):

```json
{ "message": "Vote goal removed.", "goal": 0 }
```

> The goal is stored in `event.voting_properties.numberOfSlot` and reflected immediately in `GET /v2/vote/contestant/:contestantId` as `goalProgress`.

---

## Email Notifications (Automatic)

No client action required — these fire server-side on every confirmed Paystack payment.

| Recipient | Trigger | Content |
|-----------|---------|---------|
| Voter | Payment verified (via redirect or webhook) | Vote count, amount, reference, contestant name, support message |
| Event owner | Same trigger | Voter name, votes cast, running total, reference, voter message |

> Emails are sent regardless of whether the voter completed the browser redirect or closed the tab early — the Paystack webhook covers the fallback path.

---

## Vote Transaction Fields

For analytics and reporting, every `VoteTransaction` record now carries:

| Field | Type | Description |
|-------|------|-------------|
| `packageId` | String | Which vote package was used (`""` if custom vote count) |
| `referrer` | String | Share-link / UTM source (`""` if none) |
| `channel` | String | `"app"` \| `"web"` \| `"share"` |

---

## Error Reference

| Status | Meaning |
|--------|---------|
| `400` | Missing or invalid request fields |
| `400` | `votes` must be a positive integer |
| `400` | Event is not a `VOTING` type |
| `403` | Event is not `APPROVED` |
| `404` | Event / contestant / package not found |
| `409` | Vote package is sold out |
| `502` | Could not reach Paystack — retry |
| `500` | Internal server error |
