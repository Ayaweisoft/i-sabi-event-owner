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
