/**
 * EventService — all event management, ticket, contestant, form, and finance endpoints.
 * Mutation-style functions follow the useMutate signature:
 *   (data: T, { id, token }: { id: string; token: string }) => Promise<AxiosResponse>
 */
import BaseService, { NoAuthService } from './BaseService'
import {
    ISubmitTicketType,
    ICreateContestant,
} from '@/interfaces'
import type { ICreateVotePackage, IUpdateVotePackage } from '@/interfaces'
import type {
    IForm,
    IFormsListResponse,
    IFormShareInfo,
    IFormSubmissionsResponse,
    ICreateFormPayload,
    IUpdateFormPayload,
} from '@/interfaces/forms'

const Auth = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
})

// ── Events ────────────────────────────────────────────────────────────────────

/** POST /submit-event — Create event (no auth) */
export const apiSubmitEvent = (data: unknown) =>
    NoAuthService.post('submit-event', data)

/** PUT /update-event — Update event details */
export const apiUpdateEvent = (
    data: unknown,
    { token }: { id: string; token: string },
) => BaseService.put('update-event', data, Auth(token))

/** GET /get-event-by-id/:id */
export const apiGetEventById = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`get-event-by-id/${id}`, Auth(token))

/** PUT /v2/change-event-status — Toggle live/inactive */
export const apiToggleEventStatus = (
    data: { id: string; status: boolean },
    { token }: { id: string; token: string },
) => BaseService.put('v2/change-event-status', data, Auth(token))

// ── Ticket Types ──────────────────────────────────────────────────────────────

/** GET /v2/get-ticket-by-event-id/:id */
export const apiGetTicketTypes = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`v2/get-ticket-by-event-id/${id}`, Auth(token))

/** POST /v2/submit-ticket — Add a ticket type */
export const apiAddTicketType = (
    data: ISubmitTicketType,
    { token }: { id: string; token: string },
) => BaseService.post('v2/submit-ticket', data, Auth(token))

/** DELETE /v2/delete-ticket/:id — id = ticket type _id */
export const apiDeleteTicketType = (
    _: null,
    { id, token }: { id: string; token: string },
) => BaseService.delete(`v2/delete-ticket/${id}`, Auth(token))

/** GET /v2/get-event-history/:id — Full purchase history */
export const apiGetPurchaseHistory = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`v2/get-event-history/${id}`, Auth(token))

// ── Check-in PIN mutations (mutation-style, id = eventId) ────────────────────

/** POST /v2/checkin/:eventId/pins — Add one PIN */
export const apiAddPin = (
    data: { pin: string },
    { id, token }: { id: string; token: string },
) => BaseService.post(`v2/checkin/${id}/pins`, data, Auth(token))

/** DELETE /v2/checkin/:eventId/pins/:pin */
export const apiRemovePin = (
    data: { pin: string },
    { id, token }: { id: string; token: string },
) => BaseService.delete(`v2/checkin/${id}/pins/${data.pin}`, Auth(token))

/** PUT /v2/checkin/:eventId/pins — Replace all PINs */
export const apiReplaceAllPins = (
    data: { pins: string[] },
    { id, token }: { id: string; token: string },
) => BaseService.put(`v2/checkin/${id}/pins`, data, Auth(token))

// ── Contestants ───────────────────────────────────────────────────────────────

/** POST /create-contestant */
export const apiAddContestant = (
    data: ICreateContestant,
    { token }: { id: string; token: string },
) => BaseService.post('create-contestant', data, Auth(token))

/** PUT /update-contestant/:id — update name, nickname, or image */
export const apiUpdateContestant = (
    data: { fullname?: string; nickname?: string; image_url?: string },
    { id, token }: { id: string; token: string },
) => BaseService.put(`update-contestant/${id}`, data, Auth(token))

/** DELETE /delete-contestant/:id — id = contestant _id */
export const apiDeleteContestant = (
    _: null,
    { id, token }: { id: string; token: string },
) => BaseService.delete(`delete-contestant/${id}`, Auth(token))

/** GET /get-event-records/:id — Vote payment records per event */
export const apiGetVoteRecords = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`get-event-records/${id}`, Auth(token))

// ── Forms ─────────────────────────────────────────────────────────────────────

/** GET /forms/owner/:ownerId — All forms owned by this event owner, paginated */
export const apiGetFormsByOwner = (
    token: string,
    { id, params }: { id: string; params?: { page?: number; limit?: number } },
) => BaseService.get<IFormsListResponse>(`forms/owner/${id}`, { ...Auth(token), params })

/** GET /forms/event/:eventId — Form for a specific event */
export const apiGetFormByEvent = (
    token: string,
    { id }: { id: string },
) => BaseService.get<IForm>(`forms/event/${id}`, Auth(token))

/** GET /forms/:formId — Single form by id */
export const apiGetFormById = (
    token: string,
    { id }: { id: string },
) => BaseService.get<IForm>(`forms/${id}`, Auth(token))

/** GET /forms/:formId/submissions — All submissions (owner only), paginated */
export const apiGetFormSubmissions = (
    token: string,
    { id, params }: { id: string; params?: { page?: number; limit?: number } },
) => BaseService.get<IFormSubmissionsResponse>(`forms/${id}/submissions`, { ...Auth(token), params })

/** POST /forms — Create form (ownerId is taken from the auth token, not the body) */
export const apiCreateForm = (
    data: ICreateFormPayload,
    { token }: { id: string; token: string },
) => BaseService.post<IForm>('forms', data, Auth(token))

/** PUT /forms/:formId — Update form, id = formId */
export const apiUpdateForm = (
    data: IUpdateFormPayload,
    { id, token }: { id: string; token: string },
) => BaseService.put<IForm>(`forms/${id}`, data, Auth(token))

/**
 * GET /forms/:formId/share — owner-only. Returns the public share links:
 *   { formId, slug, links: { direct, embed, iframe } }
 * `direct`/`embed` are root-domain URLs (i-sabi.com.ng/forms/:slug[/embed]),
 * not under /api — always display these rather than building a link locally.
 */
export const apiGetFormShareInfo = (
    token: string,
    { id }: { id: string },
) => BaseService.get<IFormShareInfo>(`forms/${id}/share`, Auth(token))

/** GET /forms/slug/:slug — public, no auth. Form lookup by its share-link slug. */
export const apiGetFormBySlug = (
    { slug }: { slug: string },
) => BaseService.get<IForm>(`forms/slug/${slug}`)

// ── Finance ───────────────────────────────────────────────────────────────────

/** GET /get-event-records/:id — Voting revenue per event */
export const apiGetEventVoteRevenue = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`get-event-records/${id}`, Auth(token))

// ── Vote Packages (VOTING-API.md §2, §5, §6, §7) ─────────────────────────────

/**
 * GET /v2/vote/:eventId/packages?contestantId=
 * Public — no token required. id = eventId.
 * Pass contestantId as a query param via the params object when needed.
 */
export const apiGetVotePackages = (
    _token: string,
    { id, contestantId }: { id: string; contestantId?: string },
) => {
    const url = contestantId
        ? `v2/vote/${id}/packages?contestantId=${contestantId}`
        : `v2/vote/${id}/packages`
    return NoAuthService.get(url)
}

/** POST /v2/vote/packages — Create a vote package (event owner) */
export const apiCreateVotePackage = (
    data: ICreateVotePackage,
    { token }: { id: string; token: string },
) => BaseService.post('v2/vote/packages', data, Auth(token))

/** PATCH /v2/vote/packages/:id — Edit name, price, slots, active. id = package _id */
export const apiUpdateVotePackage = (
    data: IUpdateVotePackage,
    { id, token }: { id: string; token: string },
) => BaseService.patch(`v2/vote/packages/${id}`, data, Auth(token))

/**
 * DELETE /v2/vote/packages/:id — Soft-delete (sets active:false). id = package _id.
 * Mutation-style: first arg unused.
 */
export const apiDeleteVotePackage = (
    _: null,
    { id, token }: { id: string; token: string },
) => BaseService.delete(`v2/vote/packages/${id}`, Auth(token))

/**
 * GET /v2/vote/contestant/:contestantId — full single-contestant page data
 * (contestant, event, packages, topSupporters, goalProgress).
 * Public — no token required. id = contestantId.
 */
export const apiGetContestantVotePage = (
    _token: string,
    { id }: { id: string },
) => NoAuthService.get(`v2/vote/contestant/${id}`)
