/**
 * ReconciliationService
 *
 * Admin-only endpoints for viewing and actioning payment reconciliation records.
 * Accessible to OPERATIONS, ACCOUNTANT, CFO and ADMIN roles.
 */
import BaseService from './BaseService'

const Auth = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
})

export interface ReconciliationLog {
    _id:              string
    ref:              string
    service:          'ticket' | 'vote' | 'wallet_card' | 'wallet_bank'
    paystackStatus:   string
    paystackAmount:   number
    valueDelivered:   boolean
    deliveryEntityId: string | null
    recoveryMethod:   string | null
    status:           'ok' | 'pending_delivery' | 'failed_delivery' | 'refunded' | 'manually_resolved'
    userId:           string | null
    userEmail:        string | null
    userName:         string | null
    userPhone:        string | null
    failureLog:       string[]
    adminNotes:       string
    resolvedBy:       { username: string; fullname: string; email: string } | null
    resolvedAt:       string | null
    metadata:         Record<string, unknown>
    createdAt:        string
    updatedAt:        string
}

export interface ReconciliationSummary {
    byStatus: Record<string, { count: number; totalAmount: number }>
    totals: {
        pending:  number
        failed:   number
        ok:       number
        refunded: number
        resolved: number
    }
    recentFailed: ReconciliationLog[]
}

export interface ReconciliationListResponse {
    logs: ReconciliationLog[]
    pagination: { page: number; limit: number; total: number; pages: number }
}

/** GET /admin/reconciliation/summary */
export const apiGetReconciliationSummary = (token: string): Promise<{ data: ReconciliationSummary }> =>
    BaseService.get('admin/reconciliation/summary', Auth(token))

/** GET /admin/reconciliation */
export const apiListReconciliation = (
    token: string,
    params?: {
        status?:    string
        service?:   string
        from?:      string
        to?:        string
        userEmail?: string
        page?:      number
        limit?:     number
    }
): Promise<{ data: ReconciliationListResponse }> =>
    BaseService.get('admin/reconciliation', { ...Auth(token), params })

/** GET /admin/reconciliation/:ref */
export const apiGetReconciliationDetail = (
    token: string,
    ref: string
): Promise<{ data: { log: ReconciliationLog; deliveryEntity: unknown } }> =>
    BaseService.get(`admin/reconciliation/${encodeURIComponent(ref)}`, Auth(token))

/** POST /admin/reconciliation/:ref/recover */
export const apiRecoverPayment = (
    token: string,
    ref: string,
    metadata?: Record<string, unknown>
): Promise<{ data: { message: string; result: unknown } }> =>
    BaseService.post(`admin/reconciliation/${encodeURIComponent(ref)}/recover`, { metadata }, Auth(token))

/** POST /admin/reconciliation/:ref/refund */
export const apiRefundPayment = (
    token: string,
    ref: string,
    amount?: number
): Promise<{ data: { message: string } }> =>
    BaseService.post(
        `admin/reconciliation/${encodeURIComponent(ref)}/refund`,
        amount != null ? { amount } : {},
        Auth(token)
    )

/** POST /admin/reconciliation/:ref/resolve */
export const apiResolvePayment = (
    token: string,
    ref: string,
    notes: string
): Promise<{ data: { message: string } }> =>
    BaseService.post(`admin/reconciliation/${encodeURIComponent(ref)}/resolve`, { notes }, Auth(token))
