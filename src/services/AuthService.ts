import { IUserLogin } from "@/interfaces"
import BaseService, { NoAuthService } from "./BaseService"

const Auth = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`
    }
})

export const apiLogin =  (data: IUserLogin) => {
    return NoAuthService.post(`login-event-owner`, data)
}

export const apiLogout =  () => {
    return NoAuthService.post(`/logout`, {})
}

export const apiGetEvents =  (token: string) => {
    return BaseService.get(`my-event-list`, Auth(token))
}

export const apiGetTxns =  (token: string, { id }: { id: string }) => {
    return BaseService.get(`get-event-transaction/${id}`, Auth(token))
}

export const apiGetContestants =  (token: string, { id }: { id: string }) => {
    return BaseService.get(`get-contestant/${id}`, Auth(token))
}

// ── Dashboard analytics endpoints ─────────────────────────────────────────────

export const apiGetOwnerSummary = (token: string) =>
    BaseService.get(`v2/event-owner/summary`, Auth(token))

export const apiGetWalletSummary = (token: string) =>
    BaseService.get(`v2/event-owner/wallet/summary`, Auth(token))

export const apiGetNotifications = (token: string, { type, page, limit }: { type?: string; page?: number; limit?: number } = {}) =>
    BaseService.get(`v2/event-owner/notifications`, {
        ...Auth(token),
        params: { type: type || 'all', page: page || 1, limit: limit || 30 },
    })

export const apiGetEventSummary = (token: string, { id }: { id: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/summary`, Auth(token))

export const apiGetSalesTrend = (token: string, { id, period }: { id: string; period?: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/sales-trend`, {
        ...Auth(token),
        params: { period: period || '30d' },
    })

export const apiGetCheckinTrend = (token: string, { id, period }: { id: string; period?: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/checkin-trend`, {
        ...Auth(token),
        params: { period: period || 'hourly' },
    })

export const apiGetAudienceInsights = (token: string, { id }: { id: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/audience`, Auth(token))

export const apiGetHealthScore = (token: string, { id }: { id: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/health-score`, Auth(token))

export const apiGetVoteTrend = (token: string, { id, period }: { id: string; period?: string }) =>
    BaseService.get(`v2/event-owner/event/${id}/vote-trend`, {
        ...Auth(token),
        params: { period: period || 'daily' },
    })

// ── Check-in management endpoints ─────────────────────────────────────────────

export const apiGetCheckinStats = (token: string, { id }: { id: string }) =>
    BaseService.get(`v2/checkin/${id}/stats`, Auth(token))

export const apiGetCheckinAttendees = (token: string, { id, status }: { id: string; status?: string }) =>
    BaseService.get(`v2/checkin/${id}/attendees`, {
        ...Auth(token),
        params: { status: status || 'all' },
    })

export const apiGetCheckinPins = (token: string, { id }: { id: string }) =>
    BaseService.get(`v2/checkin/${id}/pins`, Auth(token))

export const apiAddCheckinPin = (token: string, data: { eventId: string; pin: string }) =>
    BaseService.post(`v2/checkin/${data.eventId}/pins`, { pin: data.pin }, Auth(token))

export const apiDeleteCheckinPin = (token: string, { eventId, pin }: { eventId: string; pin: string }) =>
    BaseService.delete(`v2/checkin/${eventId}/pins/${pin}`, Auth(token))

export const apiGetWhoVoted = (token: string, { id }: { id: string }) =>
    BaseService.get(`api/who-voted-for-me/${id}`, Auth(token))

// ── Submission endpoints ───────────────────────────────────────────────────────

/** GET /v2/event-owner/event/:id/submissions — paginated + filterable */
export const apiGetEventSubmissions = (
    token: string,
    { id, page, limit, search, from, to }: {
        id: string; page?: number; limit?: number
        search?: string; from?: string; to?: string
    },
) =>
    BaseService.get(`v2/event-owner/event/${id}/submissions`, {
        ...Auth(token),
        params: { page: page ?? 1, limit: limit ?? 20, search, from, to },
    })

/** GET /v2/event-owner/event/:id/submissions/:submissionId — single detail */
export const apiGetSubmissionDetail = (
    token: string,
    { id, submissionId }: { id: string; submissionId: string },
) =>
    BaseService.get(`v2/event-owner/event/${id}/submissions/${submissionId}`, Auth(token))

/** GET /v2/event-owner/submissions — all submissions across owner's form events */
export const apiGetAllSubmissions = (
    token: string,
    { eventId, page, limit, search, from, to }: {
        eventId?: string; page?: number; limit?: number
        search?: string; from?: string; to?: string
    } = {},
) =>
    BaseService.get(`v2/event-owner/submissions`, {
        ...Auth(token),
        params: { eventId, page: page ?? 1, limit: limit ?? 20, search, from, to },
    })

/** GET /v2/event-owner/event/:id/submissions/export — returns CSV blob */
export const apiExportSubmissionsCSV = (
    token: string,
    { id, search, from, to }: { id: string; search?: string; from?: string; to?: string },
) =>
    BaseService.get(`v2/event-owner/event/${id}/submissions/export`, {
        ...Auth(token),
        params: { search, from, to },
        responseType: 'blob',
    })
