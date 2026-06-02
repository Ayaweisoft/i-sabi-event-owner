# Adz Frontend Integration Guide

**Stack target**: Ionic Angular + Capacitor  
**API base**: `https://your-api-domain.com/api`  
**Audience**: event-owner frontend and the main i-Sabi mobile app

---

## 1. What you are building

There are two separate frontend surfaces for Adz.

There are also multiple authenticated roles that affect what each frontend should expose.

Primary roles involved in this Adz rollout:

- `USER`
- `EVENT_OWNER`
- `ADMIN`
- `OPERATIONS`
- `ACCOUNTANT`
- `CFO`

### A. Event-owner system

This is where event owners create and manage campaigns.

Use cases:

- create a draft campaign
- attach the campaign to one of the owner's events or a game room
- pick placements
- set budget, schedule, and creative
- submit for admin review
- track status and results

### B. i-Sabi mobile app for users

This is where signed-in users see ads and interact with them.

Use cases:

- load one eligible ad for a placement
- render native, interstitial, or rewarded UI
- record impressions
- record clicks
- claim reward after a rewarded view

---

## 2. Authentication rules

The backend uses two auth contexts.

### Event-owner system

Use the event-owner login token.

Login endpoint:

```http
POST /api/login-event-owner
```

Use that token for all event-owner Adz endpoints:

- `/api/v2/event-owner/adz/catalog`
- `/api/v2/event-owner/adz/events`
- `/api/v2/event-owner/adz/campaigns`

### i-Sabi mobile app

Use the normal user login token.

Use that token for delivery and tracking endpoints:

- `/api/adz/serve`
- `/api/adz/:id/impression`
- `/api/adz/:id/click`
- `/api/adz/:id/reward/claim`

Important: reward claims credit the authenticated user's balance, so never call the reward endpoint with an event-owner token.

---

## 2.1 Frontend role matrix

Use this matrix in route guards, menu visibility, and page-level access checks.

| Role | Frontend surface | What they should see for Adz |
| ---- | ---------------- | ---------------------------- |
| `USER` | Main i-Sabi mobile app | Ad slots, rewarded flows, destination navigation |
| `EVENT_OWNER` | Event-owner dashboard/app | Campaign builder, list, detail, submit for review |
| `OPERATIONS` | Admin web or staff dashboard | Campaign review queue, moderation, non-financial performance views |
| `ACCOUNTANT` | Admin finance dashboard | Revenue, spend, reward totals, payout exposure, ad analytics |
| `CFO` | Executive finance dashboard | High-level Adz finance summaries plus CFO finance endpoints |
| `ADMIN` | Full admin dashboard | All Adz review, moderation, analytics, and role-crossing views |

Frontend rule:

- do not rely only on hidden buttons
- always combine frontend role checks with backend authorization
- if a role loses access mid-session, redirect out of the protected screen after the next `403`

---

## 2.2 Suggested route guards

If your frontend already has auth guards, extend them with role-based guards.

Suggested route groups:

```text
/event-owner/adz/**           -> EVENT_OWNER
/admin/adz/**                 -> OPERATIONS, ADMIN
/admin/analytics/adz/**       -> ACCOUNTANT, CFO, ADMIN
/admin/cfo/finance/**         -> CFO, ADMIN
```

Example guard helper:

```typescript
export function hasMinRole(role: string | null, minRole: 'OPERATIONS' | 'ACCOUNTANT' | 'CFO') {
  const order: Record<string, number> = {
    USER: 0,
    MERCHANT: 1,
    ACCOUNTANT: 2,
    OPERATIONS: 3,
    CFO: 4,
    ADMIN: 5,
  };

  if (!role) return false;
  if (role === 'ADMIN') return true;
  return (order[role] ?? -1) >= (order[minRole] ?? 99);
}
```

---

## 3. Recommended frontend file structure

### Event-owner frontend structure

```text
src/app/features/adz/
  adz.models.ts
  adz-owner.service.ts
  adz-owner.store.ts
  pages/
    adz-campaign-list/
    adz-campaign-builder/
    adz-campaign-detail/
```

### Mobile app frontend structure

```text
src/app/features/adz/
  adz.models.ts
  adz-delivery.service.ts
  adz-tracker.service.ts
  components/
    adz-native-card/
    adz-interstitial/
    adz-rewarded-modal/
  guards/
    adz-frequency.guard.ts
```

---

## 4. Shared models

Create one shared interface file in both apps.

```typescript
// src/app/features/adz/adz.models.ts
export type AdzFormat = 'NATIVE' | 'REWARDED' | 'INTERSTITIAL';

export type AdzPlacement =
  | 'HOME_FEED'
  | 'EVENT_DISCOVERY'
  | 'EVENT_DETAILS'
  | 'PAN_LOBBY'
  | 'PAN_GAME_OVER'
  | 'GAME_ROOM'
  | 'GAME_RESULTS';

export type AdzStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'REJECTED'
  | 'EXPIRED';

export interface AdzCreative {
  title: string;
  body: string;
  imageUrl: string;
  ctaText: string;
  destinationUrl: string;
  destinationType: 'INTERNAL_EVENT' | 'INTERNAL_GAME_ROOM' | 'EXTERNAL_URL' | 'NONE';
}

export interface AdzReward {
  enabled: boolean;
  amount?: number;
  currency?: string;
  instruction?: string;
}

export interface AdzCampaign {
  _id: string;
  campaignName: string;
  advertiserType: 'EVENT_OWNER' | 'USER' | 'ADMIN';
  format: AdzFormat;
  placements: AdzPlacement[];
  status: AdzStatus;
  eventId?: string | null;
  linkedGameSessionId?: string;
  creative: AdzCreative;
  reward: AdzReward;
  budget?: {
    total: number;
    dailyCap: number;
    spent: number;
    currency: string;
  };
  pricing?: {
    cpm: number;
    cpc: number;
    cpv: number;
  };
  metrics?: {
    impressions: number;
    clicks: number;
    rewardedViews: number;
    rewardsClaimed: number;
    lastServedAt?: string | null;
    lastClickedAt?: string | null;
  };
  schedule?: {
    startsAt: string;
    endsAt?: string | null;
  };
}

export interface CreateAdzCampaignDto {
  campaignName: string;
  format: AdzFormat;
  placements: AdzPlacement[];
  eventId?: string | null;
  linkedGameSessionId?: string;
  creative: AdzCreative;
  reward: {
    enabled: boolean;
    amount?: number;
    currency?: string;
    instruction?: string;
  };
  targeting: {
    countries: string[];
    states: string[];
    minAge?: number | null;
    maxAge?: number | null;
  };
  budget: {
    total: number;
    dailyCap: number;
    currency: string;
  };
  pricing: {
    cpm: number;
    cpc: number;
    cpv: number;
  };
  schedule: {
    startsAt: string;
    endsAt?: string | null;
  };
  submitForReview?: boolean;
}
```

---

## 5. Event-owner system guide

## 5.1 Required pages

Build these three pages first.

### 1. Campaign list page

Route suggestion:

```text
/event-owner/adz/campaigns
```

Show:

- campaign name
- format
- linked event name if available
- status badge
- budget spent vs total
- impressions
- clicks
- rewards claimed
- created date
- action buttons: edit, view, submit

Filters:

- all campaigns
- draft
- pending review
- active
- paused
- rejected
- expired

### 2. Campaign builder page

Route suggestion:

```text
/event-owner/adz/campaigns/new
/event-owner/adz/campaigns/:id/edit
```

Build it as a 5-step wizard.

#### Step 1: Goal and format

Fields:

- campaign name
- format
- link target type
- event selection or game room id

Rules:

- if target is event, require `eventId`
- if target is room, require `linkedGameSessionId`
- if format is `REWARDED`, keep reward section visible later

#### Step 2: Creative

Fields:

- title
- body
- image url or uploaded image result url
- CTA text
- destination url
- destination type

Show a live preview card on the right side.

#### Step 3: Placement and targeting

Fields:

- placements multi-select
- countries
- states
- min age
- max age

Placement labels recommended:

```typescript
export const ADZ_PLACEMENT_LABELS: Record<AdzPlacement, string> = {
  HOME_FEED: 'Home feed',
  EVENT_DISCOVERY: 'Event discovery',
  EVENT_DETAILS: 'Event details',
  PAN_LOBBY: 'Pick A Number lobby',
  PAN_GAME_OVER: 'Pick A Number game over',
  GAME_ROOM: 'Game room',
  GAME_RESULTS: 'Game results',
};
```

#### Step 4: Budget and schedule

Fields:

- total budget
- daily cap
- cpm
- cpc
- cpv
- start date
- end date

Validation:

- total budget must be `>= 0`
- daily cap must be `>= 0`
- end date must be after start date
- for `REWARDED`, prefer `cpv > 0`

#### Step 5: Review and submit

Show:

- full campaign summary
- creative preview
- placements list
- schedule
- pricing summary
- budget summary
- submit button
- save draft button

### 3. Campaign detail page

Route suggestion:

```text
/event-owner/adz/campaigns/:id
```

Show:

- status and moderation note
- budget used
- impressions, clicks, CTR
- rewarded views and rewards claimed
- placement chips
- schedule
- edit action when allowed

---

## 5.2 Event-owner service

```typescript
// src/app/features/adz/adz-owner.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AdzCampaign, CreateAdzCampaignDto } from './adz.models';

@Injectable({ providedIn: 'root' })
export class AdzOwnerService {
  private base = `${environment.apiUrl}/v2/event-owner/adz`;

  constructor(private http: HttpClient) {}

  getCatalog() {
    return this.http.get<{
      formats: string[];
      placements: string[];
      statuses: string[];
    }>(`${this.base}/catalog`);
  }

  getEvents() {
    return this.http.get<{ events: any[] }>(`${this.base}/events`);
  }

  listCampaigns(query?: { page?: number; limit?: number; status?: string; eventId?: string }) {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
    if (query?.status) params = params.set('status', query.status);
    if (query?.eventId) params = params.set('eventId', query.eventId);
    return this.http.get<{ campaigns: AdzCampaign[]; pagination: any }>(`${this.base}/campaigns`, { params });
  }

  getCampaign(id: string) {
    return this.http.get<{ campaign: AdzCampaign }>(`${this.base}/campaigns/${id}`);
  }

  createCampaign(body: CreateAdzCampaignDto) {
    return this.http.post<{ success: true; campaign: AdzCampaign }>(`${this.base}/campaigns`, body);
  }

  updateCampaign(id: string, body: Partial<CreateAdzCampaignDto>) {
    return this.http.patch<{ success: true; campaign: AdzCampaign }>(`${this.base}/campaigns/${id}`, body);
  }

  submitCampaign(id: string) {
    return this.http.post<{ success: true; campaign: AdzCampaign }>(`${this.base}/campaigns/${id}/submit`, {});
  }
}
```

---

## 5.3 Event-owner form setup

Use a reactive form. Keep one form across the full wizard.

```typescript
this.form = this.fb.group({
  campaignName: ['', [Validators.required, Validators.maxLength(120)]],
  format: ['NATIVE', Validators.required],
  eventId: [null],
  linkedGameSessionId: [''],
  creative: this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    body: ['', [Validators.maxLength(280)]],
    imageUrl: [''],
    ctaText: ['Learn more', [Validators.maxLength(40)]],
    destinationUrl: [''],
    destinationType: ['INTERNAL_EVENT'],
  }),
  reward: this.fb.group({
    enabled: [false],
    amount: [0],
    currency: ['NGN'],
    instruction: [''],
  }),
  targeting: this.fb.group({
    countries: [[]],
    states: [[]],
    minAge: [null],
    maxAge: [null],
  }),
  placements: [[], Validators.required],
  budget: this.fb.group({
    total: [0, [Validators.required, Validators.min(0)]],
    dailyCap: [0, [Validators.min(0)]],
    currency: ['NGN'],
  }),
  pricing: this.fb.group({
    cpm: [0, [Validators.min(0)]],
    cpc: [0, [Validators.min(0)]],
    cpv: [0, [Validators.min(0)]],
  }),
  schedule: this.fb.group({
    startsAt: ['', Validators.required],
    endsAt: [null],
  }),
});
```

Builder rules to enforce on the client:

- require at least one placement
- require either `eventId` or `linkedGameSessionId`
- if `reward.enabled` is true, show reward hint and require non-negative amount
- when `format !== 'REWARDED'`, default reward state to disabled
- prevent submit if start date is missing

---

## 5.4 Event-owner UX recommendations

Use these statuses visually:

- `DRAFT`: neutral gray
- `PENDING_REVIEW`: amber
- `ACTIVE`: green
- `PAUSED`: blue
- `REJECTED`: red
- `EXPIRED`: dark gray

Use these helper texts:

- `DRAFT`: Not submitted yet
- `PENDING_REVIEW`: Waiting for admin approval
- `ACTIVE`: Currently serving to users
- `PAUSED`: Stopped by admin or system
- `REJECTED`: Needs edits before resubmission
- `EXPIRED`: Schedule ended or budget exhausted

Error handling:

- `400`: validation issue, show inline form error
- `403`: event owner does not own selected event, show blocking toast
- `409`: invalid state transition, refresh detail page

---

## 6. i-Sabi mobile user guide

## 6.1 Where to render ads first

MVP placements to ship first:

- `HOME_FEED`
- `EVENT_DISCOVERY`
- `PAN_LOBBY`
- `PAN_GAME_OVER`

Recommended rendering strategy:

- `HOME_FEED`: native card inside the scroll feed
- `EVENT_DISCOVERY`: native card between event sections
- `PAN_LOBBY`: rewarded modal entry point or native promo tile
- `PAN_GAME_OVER`: interstitial or reward upsell card

---

## 6.2 Delivery service

```typescript
// src/app/features/adz/adz-delivery.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AdzCampaign, AdzFormat, AdzPlacement } from './adz.models';

@Injectable({ providedIn: 'root' })
export class AdzDeliveryService {
  private base = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  serveAd(input: {
    placement: AdzPlacement;
    format?: AdzFormat;
    country?: string;
    state?: string;
    age?: number;
  }) {
    let params = new HttpParams().set('placement', input.placement);
    if (input.format) params = params.set('format', input.format);
    if (input.country) params = params.set('country', input.country);
    if (input.state) params = params.set('state', input.state);
    if (input.age !== undefined) params = params.set('age', input.age);

    return this.http.get<{ ad: AdzCampaign }>(`${this.base}/adz/serve`, { params });
  }

  recordImpression(campaignId: string, placement: AdzPlacement) {
    return this.http.post(`${this.base}/adz/${campaignId}/impression`, { placement });
  }

  recordClick(campaignId: string, placement: AdzPlacement) {
    return this.http.post<{ destinationUrl?: string; destinationType?: string }>(
      `${this.base}/adz/${campaignId}/click`,
      { placement }
    );
  }

  claimReward(campaignId: string, placement: AdzPlacement) {
    return this.http.post<{ success: boolean; rewardAmount: number; balance: number }>(
      `${this.base}/adz/${campaignId}/reward/claim`,
      { placement }
    );
  }
}
```

---

## 6.3 Native ad component

Use this for `HOME_FEED` and `EVENT_DISCOVERY`.

Inputs:

- `ad`
- `placement`

Behavior:

- record impression once when the component first becomes visible
- on CTA tap, record click first
- after click succeeds, route based on `destinationType`

Suggested UI:

- image banner
- title
- body
- CTA button
- small `Sponsored` label

Minimal visibility rule:

- fire impression only after 50% visibility for at least 1 second

---

## 6.4 Rewarded ad flow

Use this for `PAN_LOBBY` first.

Flow:

1. request `REWARDED` ad with `placement=PAN_LOBBY`
2. show a reward offer modal
3. user taps `Watch and earn`
4. show ad creative full screen or in modal
5. wait for completion signal from your UI timer or video completion event
6. call impression if not yet recorded
7. call reward claim
8. update local wallet/balance state
9. show success toast

Important:

- do not claim reward on modal open
- only claim after the rewarded experience is completed
- guard against double-submit with a `claimInFlight` flag

Suggested modal copy:

- title: `Watch and earn`
- subtitle: `Complete this promo to earn reward`
- footer note: `Reward can be claimed once per day for this campaign`

---

## 6.5 Interstitial flow

Use this for `PAN_GAME_OVER`.

Flow:

1. after game over result is rendered, request one `INTERSTITIAL` ad
2. if no ad is returned, skip cleanly
3. show full-screen card with image, title, short copy, CTA
4. record impression once shown
5. if CTA tapped, record click
6. navigate to the destination or open browser

Rules:

- always allow dismiss
- never block the user from leaving results page
- limit to one interstitial per session or cooldown window

---

## 6.6 Tracker and navigation helpers

```typescript
// src/app/features/adz/adz-tracker.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { AdzDeliveryService } from './adz-delivery.service';
import { AdzCampaign, AdzPlacement } from './adz.models';

@Injectable({ providedIn: 'root' })
export class AdzTrackerService {
  private seenImpressions = new Set<string>();

  constructor(
    private adz: AdzDeliveryService,
    private router: Router,
  ) {}

  trackImpressionOnce(ad: AdzCampaign, placement: AdzPlacement) {
    const key = `${ad._id}:${placement}:impression`;
    if (this.seenImpressions.has(key)) return;
    this.seenImpressions.add(key);
    this.adz.recordImpression(ad._id, placement).subscribe({
      error: () => this.seenImpressions.delete(key),
    });
  }

  onClick(ad: AdzCampaign, placement: AdzPlacement) {
    this.adz.recordClick(ad._id, placement).subscribe({
      next: async () => {
        const url = ad.creative.destinationUrl;
        switch (ad.creative.destinationType) {
          case 'INTERNAL_EVENT': {
            const eventId = ad.eventId;
            if (eventId) this.router.navigate(['/events', eventId]);
            break;
          }
          case 'INTERNAL_GAME_ROOM': {
            const roomId = ad.linkedGameSessionId;
            if (roomId) this.router.navigate(['/games/room', roomId]);
            break;
          }
          case 'EXTERNAL_URL': {
            if (url) await Browser.open({ url });
            break;
          }
          default:
            break;
        }
      },
    });
  }
}
```

---

## 6.7 Mobile frequency controls

Add client-side pacing to avoid over-serving.

Recommended first rules:

- `HOME_FEED`: no more than one ad card every 8 to 12 content cards
- `PAN_LOBBY`: no more than one rewarded prompt every 15 minutes
- `PAN_GAME_OVER`: no more than one interstitial every 20 minutes

Store these timestamps locally with Capacitor Preferences or your app store.

---

## 7. Screen-by-screen integration plan

Add a third frontend surface for internal staff dashboards.

## 7.1 Phase 1

### Phase 1 event-owner scope

- add campaign list page
- add campaign builder wizard
- add campaign detail page
- wire create, update, submit

### Phase 1 mobile scope

- add `AdzDeliveryService`
- add `AdzTrackerService`
- add `adz-native-card` component
- render native ad on home feed
- render native ad on event discovery

### Phase 1 staff admin scope

- add Adz review queue page for `OPERATIONS` and `ADMIN`
- add campaign moderation detail page
- add accountant analytics summary page

## 7.2 Phase 2

### Phase 2 mobile scope

- add rewarded modal in PAN lobby
- add interstitial after PAN game over
- update wallet state after reward claim

### Phase 2 finance scope

- add accountant Adz revenue dashboard
- add CFO Adz summary widgets inside finance overview
- show reward liability and spend trend cards

## 7.3 Phase 3

### Admin or analytics frontend

- consume `/api/admin/analytics/adz`
- show campaign totals, CTR, spend, reward totals
- merge Adz numbers into CFO and finance dashboards
- add review filters by status and moderation note

---

## 7.4 Admin, Operations, Accountant, and CFO guide

This section is for your internal staff dashboard frontend.

## 7.4.1 Required internal pages

### A. Adz review queue

Route suggestion:

```text
/admin/adz/campaigns
```

Roles:

- `OPERATIONS`
- `ADMIN`

Show:

- campaign name
- advertiser name
- format
- linked event
- status
- placements
- created date
- current spend
- impressions and clicks

Filters:

- `PENDING_REVIEW`
- `ACTIVE`
- `PAUSED`
- `REJECTED`
- `EXPIRED`

Primary actions:

- approve to `ACTIVE`
- pause to `PAUSED`
- reject to `REJECTED`
- expire to `EXPIRED`

### B. Adz moderation detail page

Route suggestion:

```text
/admin/adz/campaigns/:id
```

Roles:

- `OPERATIONS`
- `ADMIN`

Show:

- full creative preview
- destination target
- targeting settings
- schedule
- placements
- budget and pricing
- moderation history note

Actions:

- approve
- pause
- reject with note
- expire manually

### C. Adz analytics dashboard

Route suggestion:

```text
/admin/analytics/adz
```

Roles:

- `ACCOUNTANT`
- `CFO`
- `ADMIN`

Show:

- total campaigns
- total budget
- total spend
- impressions
- clicks
- CTR
- rewarded views
- rewards claimed
- reward amount totals
- top campaigns
- placement breakdown
- format breakdown
- delivery trend chart

### D. CFO finance integration block

Route suggestions:

```text
/admin/cfo/finance/summary
/admin/cfo/finance/cashflow
```

Roles:

- `CFO`
- `ADMIN`

Add Adz widgets to the CFO dashboard:

- Adz spend to date
- Adz reward liability trend
- top spending campaigns
- campaign efficiency snapshot

### E. Accountant finance integration block

Route suggestions:

```text
/admin/analytics/revenue
/admin/analytics/revenue-profit
/admin/analytics/adz
```

Roles:

- `ACCOUNTANT`
- `CFO`
- `ADMIN`

Add these cards:

- Adz recognized spend
- reward total paid to users
- top placements by spend
- top campaigns by clicks

## 7.4.2 Internal admin service

```typescript
// src/app/features/adz/adz-admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AdzAdminService {
  private base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  listCampaigns(query?: { page?: number; limit?: number; status?: string }) {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page);
    if (query?.limit) params = params.set('limit', query.limit);
    if (query?.status) params = params.set('status', query.status);

    return this.http.get<{ campaigns: any[]; pagination: any }>(`${this.base}/adz/campaigns`, { params });
  }

  reviewCampaign(id: string, body: { status: 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'EXPIRED'; reviewNote?: string }) {
    return this.http.patch<{ success: true; campaign: any }>(`${this.base}/adz/campaigns/${id}/review`, body);
  }

  getAdzAnalytics(query?: { from?: string; to?: string; status?: string }) {
    let params = new HttpParams();
    if (query?.from) params = params.set('from', query.from);
    if (query?.to) params = params.set('to', query.to);
    if (query?.status) params = params.set('status', query.status);

    return this.http.get(`${this.base}/analytics/adz`, { params });
  }

  getRevenueAnalytics(query?: { from?: string; to?: string; category?: string }) {
    let params = new HttpParams();
    if (query?.from) params = params.set('from', query.from);
    if (query?.to) params = params.set('to', query.to);
    if (query?.category) params = params.set('category', query.category);

    return this.http.get(`${this.base}/analytics/revenue`, { params });
  }

  getRevenueProfit(query?: { from?: string; to?: string; category?: string }) {
    let params = new HttpParams();
    if (query?.from) params = params.set('from', query.from);
    if (query?.to) params = params.set('to', query.to);
    if (query?.category) params = params.set('category', query.category);

    return this.http.get(`${this.base}/analytics/revenue-profit`, { params });
  }

  getCfoFinanceSummary() {
    return this.http.get(`${this.base}/cfo/finance/summary`);
  }

  getCfoCashflow() {
    return this.http.get(`${this.base}/cfo/finance/cashflow`);
  }

  getCfoTopExpenses() {
    return this.http.get(`${this.base}/cfo/finance/top-expenses`);
  }
}
```

## 7.4.3 Internal role-specific UI rules

### ADMIN

- show all Adz pages
- can review campaigns
- can view finance and operational dashboards
- can see all moderation notes and cross-role navigation

### OPERATIONS

- show campaign queue and moderation pages
- show non-financial performance summaries
- hide finance totals that are reserved for accountant or CFO
- allow approve, pause, reject, and expire actions

### ACCOUNTANT

- show analytics, spend, revenue, reward totals, and finance records
- hide moderation action buttons unless the backend role also permits them through admin
- emphasize export, filters, and date ranges

### CFO

- show executive summary widgets first
- include cashflow and top expense context beside Adz totals
- avoid cluttering the CFO dashboard with moderation actions

---

## 8. Error handling contract

Map backend errors into stable frontend messages.

### Event-owner frontend errors

- `400`: `Please correct the highlighted fields.`
- `403`: `You can only promote events that belong to your account.`
- `404`: `Campaign not found or no longer available.`
- `409`: `This campaign cannot be updated from its current status.`

### Mobile app errors

- `404` on serve: hide ad slot silently
- `409` on impression or click: ignore and do not retry aggressively
- `409` on reward claim: show `Reward already claimed today`
- `500`: log, suppress UI breakage, and continue normal user flow

### Internal dashboard errors

- `401`: redirect to staff login or refresh token flow
- `403`: show `You do not have permission to access this section.`
- `404`: show `Campaign not found or unavailable.`
- `409` on review: show `Campaign status changed. Refresh and try again.`
- `500`: show retry state and log details to monitoring

---

## 9. Testing checklist

## 9.1 Event-owner checklist

- can load catalog and owned events
- can create draft campaign
- can edit draft campaign
- can submit campaign for review
- can view rejected moderation note
- can view active campaign metrics

## 9.2 Mobile app checklist

- home feed requests ad and renders card
- impression fires once only
- click fires before navigation
- rewarded flow claims once and updates balance
- second reward claim same day is blocked cleanly
- interstitial respects cooldown
- empty ad response does not break the screen

## 9.3 Internal dashboard checklist

- operations can load review queue
- operations can approve a pending campaign
- operations can reject a campaign with review note
- accountant can load Adz analytics and finance summaries
- CFO can load Adz analytics plus CFO finance summary widgets
- admin can access all Adz review and analytics pages
- role guards hide pages for unauthorized staff

---

## 10. Backend routes to use

Use these exact routes from [docs/ADZ-API.md](/Users/apple/Documents/GitHub/i-sabi-server/docs/ADZ-API.md).

### Event-owner frontend routes

- `GET /api/v2/event-owner/adz/catalog`
- `GET /api/v2/event-owner/adz/events`
- `POST /api/v2/event-owner/adz/campaigns`
- `GET /api/v2/event-owner/adz/campaigns`
- `GET /api/v2/event-owner/adz/campaigns/:id`
- `PATCH /api/v2/event-owner/adz/campaigns/:id`
- `POST /api/v2/event-owner/adz/campaigns/:id/submit`

### Mobile app routes

- `GET /api/adz/serve`
- `POST /api/adz/:id/impression`
- `POST /api/adz/:id/click`
- `POST /api/adz/:id/reward/claim`

### Admin analytics

- `GET /api/admin/adz/campaigns`
- `PATCH /api/admin/adz/campaigns/:id/review`
- `GET /api/admin/analytics/adz`

### Finance and CFO routes

- `GET /api/admin/analytics/revenue`
- `GET /api/admin/analytics/revenue-profit`
- `GET /api/admin/cfo/finance/summary`
- `GET /api/admin/cfo/finance/cashflow`
- `GET /api/admin/cfo/finance/top-expenses`

---

## 11. Release order recommendation

Ship in this order.

1. Event-owner campaign list and builder
2. Operations review queue and moderation page
3. Accountant and CFO analytics widgets
4. Home feed native ad slot
5. Event discovery native ad slot
6. PAN lobby rewarded ad flow
7. PAN game-over interstitial

This order gives you a working creation, approval, and finance visibility flow before you start showing ads to users at scale.
