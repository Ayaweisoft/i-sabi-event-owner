"use client"
import React, { useState, useCallback } from 'react'
import useAuthStore from '@/hooks/useAuth'
import {
    apiGetReconciliationSummary,
    apiListReconciliation,
    apiGetReconciliationDetail,
    apiRecoverPayment,
    apiRefundPayment,
    apiResolvePayment,
    ReconciliationLog,
    ReconciliationSummary,
    ReconciliationListResponse,
} from '@/services/ReconciliationService'
import { formatNaira } from '@/lib/utils'
import {
    MdRefresh, MdSearch, MdClose,
    MdCheckCircle, MdError, MdPending, MdMoneyOff, MdVerifiedUser,
} from 'react-icons/md'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
    ok:               'bg-green-100 text-green-800',
    pending_delivery: 'bg-yellow-100 text-yellow-800',
    failed_delivery:  'bg-red-100 text-red-800',
    refunded:         'bg-blue-100 text-blue-800',
    manually_resolved:'bg-purple-100 text-purple-800',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
    ok:               <MdCheckCircle className="text-green-600" />,
    pending_delivery: <MdPending className="text-yellow-600" />,
    failed_delivery:  <MdError className="text-red-600" />,
    refunded:         <MdMoneyOff className="text-blue-600" />,
    manually_resolved:<MdVerifiedUser className="text-purple-600" />,
}

const STATUS_LABEL: Record<string, string> = {
    ok:               'Delivered',
    pending_delivery: 'Pending',
    failed_delivery:  'Failed',
    refunded:         'Refunded',
    manually_resolved:'Resolved',
}

const SERVICE_LABEL: Record<string, string> = {
    ticket:      '🎟️ Ticket',
    vote:        '🗳️ Vote',
    wallet_card: '💳 Card Deposit',
    wallet_bank: '🏦 Bank Deposit',
}

// ── Summary cards ─────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={`rounded-2xl p-5 border ${color}`}>
        <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
    </div>
)

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600'}`}>
        {STATUS_ICON[status]}
        {STATUS_LABEL[status] || status}
    </span>
)

// ── Detail modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
    log: ReconciliationLog
    token: string
    onClose: () => void
    onActionDone: () => void
}

const DetailModal = ({ log, token, onClose, onActionDone }: DetailModalProps) => {
    const [notes, setNotes]       = useState('')
    const [loading, setLoading]   = useState<string | null>(null)
    const [message, setMessage]   = useState<{ text: string; ok: boolean } | null>(null)

    const act = async (action: 'recover' | 'refund' | 'resolve') => {
        setLoading(action)
        setMessage(null)
        try {
            if (action === 'recover') await apiRecoverPayment(token, log.ref)
            if (action === 'refund')  await apiRefundPayment(token, log.ref)
            if (action === 'resolve') await apiResolvePayment(token, log.ref, notes)
            setMessage({ text: `${action.charAt(0).toUpperCase() + action.slice(1)} successful.`, ok: true })
            onActionDone()
        } catch (e: any) {
            const msg = e?.response?.data?.error || e?.message || 'Action failed'
            setMessage({ text: msg, ok: false })
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div>
                        <p className="text-xs text-gray-400 font-mono">{log.ref}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={log.status} />
                            <span className="text-xs text-gray-500">{SERVICE_LABEL[log.service] || log.service}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <MdClose className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4 text-sm">
                    {/* Payment details */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Paystack Amount</p>
                            <p className="font-bold text-gray-800">{formatNaira(log.paystackAmount)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Paystack Status</p>
                            <p className="font-bold text-gray-800 capitalize">{log.paystackStatus}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">User</p>
                            <p className="font-bold text-gray-800 truncate">{log.userName || '—'}</p>
                            <p className="text-xs text-gray-400 truncate">{log.userEmail || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Recovery Method</p>
                            <p className="font-bold text-gray-800 capitalize">{log.recoveryMethod || 'None'}</p>
                        </div>
                    </div>

                    {/* Delivery entity */}
                    {log.deliveryEntityId && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <p className="text-xs text-green-600 font-semibold mb-0.5">Delivery Entity ID</p>
                            <p className="font-mono text-xs text-green-800 break-all">{log.deliveryEntityId}</p>
                        </div>
                    )}

                    {/* Errors */}
                    {log.failureLog.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <p className="text-xs text-red-600 font-semibold mb-1">Error History</p>
                            {log.failureLog.map((e, i) => (
                                <p key={i} className="text-xs text-red-700 font-mono">{e}</p>
                            ))}
                        </div>
                    )}

                    {/* Admin notes */}
                    {log.adminNotes && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                            <p className="text-xs text-purple-600 font-semibold mb-0.5">Admin Notes</p>
                            <p className="text-xs text-purple-800 whitespace-pre-wrap">{log.adminNotes}</p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-400 space-y-0.5">
                        <p>Created: {new Date(log.createdAt).toLocaleString()}</p>
                        {log.resolvedAt && <p>Resolved: {new Date(log.resolvedAt).toLocaleString()}</p>}
                    </div>

                    {/* Feedback */}
                    {message && (
                        <div className={`rounded-xl p-3 text-sm font-medium ${message.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Actions */}
                    {!['ok', 'refunded', 'manually_resolved'].includes(log.status) && (
                        <div className="space-y-3 pt-2 border-t">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</p>

                            <button
                                disabled={!!loading}
                                onClick={() => act('recover')}
                                className="w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {loading === 'recover' ? 'Recovering…' : '⚡ Recover — Deliver Value Now'}
                            </button>

                            <button
                                disabled={!!loading}
                                onClick={() => act('refund')}
                                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {loading === 'refund' ? 'Processing Refund…' : '💸 Issue Full Refund via Paystack'}
                            </button>

                            <div className="space-y-1.5">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Resolution notes (required for manual resolve)…"
                                    rows={2}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
                                />
                                <button
                                    disabled={!!loading || !notes.trim()}
                                    onClick={() => act('resolve')}
                                    className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                                >
                                    {loading === 'resolve' ? 'Resolving…' : '✅ Mark as Manually Resolved'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
    const token = useAuthStore((s) => s.token)

    const [summary, setSummary]         = useState<ReconciliationSummary | null>(null)
    const [logs, setLogs]               = useState<ReconciliationLog[]>([])
    const [pagination, setPagination]   = useState({ page: 1, total: 0, pages: 1 })
    const [selectedLog, setSelectedLog] = useState<ReconciliationLog | null>(null)

    const [filters, setFilters] = useState({
        status:    '',
        service:   '',
        userEmail: '',
        from:      '',
        to:        '',
    })
    const [page, setPage]           = useState(1)
    const [loading, setLoading]     = useState(false)
    const [summaryLoading, setSummaryLoading] = useState(false)
    const [error, setError]         = useState<string | null>(null)

    const loadSummary = useCallback(async () => {
        if (!token) return
        setSummaryLoading(true)
        try {
            const res = await apiGetReconciliationSummary(token)
            setSummary(res.data)
        } catch (e: any) {
            console.error('Summary load failed:', e?.message)
        } finally {
            setSummaryLoading(false)
        }
    }, [token])

    const loadLogs = useCallback(async (pg = 1) => {
        if (!token) return
        setLoading(true)
        setError(null)
        try {
            const params: Record<string, string | number> = { page: pg, limit: 25 }
            if (filters.status)    params.status    = filters.status
            if (filters.service)   params.service   = filters.service
            if (filters.userEmail) params.userEmail = filters.userEmail
            if (filters.from)      params.from      = filters.from
            if (filters.to)        params.to        = filters.to

            const res = await apiListReconciliation(token, params)
            setLogs(res.data.logs)
            setPagination(res.data.pagination)
            setPage(pg)
        } catch (e: any) {
            setError(e?.response?.data?.error || 'Failed to load reconciliation records')
        } finally {
            setLoading(false)
        }
    }, [token, filters])

    // Load on mount
    React.useEffect(() => {
        loadSummary()
        loadLogs(1)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        loadLogs(1)
    }

    const handleActionDone = () => {
        loadSummary()
        loadLogs(page)
        // Refresh the selected log
        if (selectedLog && token) {
            apiGetReconciliationDetail(token, selectedLog.ref)
                .then(res => setSelectedLog(res.data.log))
                .catch(() => {})
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Payment Reconciliation</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track every Paystack charge and whether value was delivered</p>
                </div>
                <button
                    onClick={() => { loadSummary(); loadLogs(page) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
                >
                    <MdRefresh className={summaryLoading || loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <SummaryCard label="Pending"  value={summary.totals.pending}  color="border-yellow-200 bg-yellow-50 text-yellow-800" />
                    <SummaryCard label="Failed"   value={summary.totals.failed}   color="border-red-200 bg-red-50 text-red-800" />
                    <SummaryCard label="Delivered" value={summary.totals.ok}      color="border-green-200 bg-green-50 text-green-800" />
                    <SummaryCard label="Refunded" value={summary.totals.refunded} color="border-blue-200 bg-blue-50 text-blue-800" />
                    <SummaryCard label="Resolved" value={summary.totals.resolved} color="border-purple-200 bg-purple-50 text-purple-800" />
                </div>
            )}

            {/* Filters */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                    value={filters.status}
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                    <option value="">All Statuses</option>
                    <option value="pending_delivery">Pending</option>
                    <option value="failed_delivery">Failed</option>
                    <option value="ok">Delivered</option>
                    <option value="refunded">Refunded</option>
                    <option value="manually_resolved">Resolved</option>
                </select>

                <select
                    value={filters.service}
                    onChange={e => setFilters(f => ({ ...f, service: e.target.value }))}
                    className="col-span-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                    <option value="">All Services</option>
                    <option value="ticket">Ticket</option>
                    <option value="vote">Vote</option>
                    <option value="wallet_card">Card Deposit</option>
                    <option value="wallet_bank">Bank Deposit</option>
                </select>

                <input
                    type="email"
                    placeholder="Filter by user email…"
                    value={filters.userEmail}
                    onChange={e => setFilters(f => ({ ...f, userEmail: e.target.value }))}
                    className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />

                <input
                    type="date"
                    value={filters.from}
                    onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />
                <input
                    type="date"
                    value={filters.to}
                    onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                />

                <button
                    type="submit"
                    className="col-span-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                >
                    <MdSearch />
                    Search
                </button>
            </form>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 text-sm">{error}</div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Reference', 'Service', 'Amount', 'User', 'Status', 'Date', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</td></tr>
                            )}
                            {!loading && logs.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No records found</td></tr>
                            )}
                            {!loading && logs.map(log => (
                                <tr
                                    key={log._id}
                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${['pending_delivery', 'failed_delivery'].includes(log.status) ? 'bg-red-50/30' : ''}`}
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-[140px] truncate">{log.ref}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{SERVICE_LABEL[log.service] || log.service}</td>
                                    <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatNaira(log.paystackAmount)}</td>
                                    <td className="px-4 py-3 max-w-[160px]">
                                        <p className="truncate font-medium text-gray-700">{log.userName || '—'}</p>
                                        <p className="truncate text-xs text-gray-400">{log.userEmail || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={log.status} /></td>
                                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-green-600 font-semibold">View →</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
                        <p className="text-gray-500">
                            Page {pagination.page} of {pagination.pages} · {pagination.total} records
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => loadLogs(page - 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                            >
                                Previous
                            </button>
                            <button
                                disabled={page >= pagination.pages}
                                onClick={() => loadLogs(page + 1)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {selectedLog && token && (
                <DetailModal
                    log={selectedLog}
                    token={token}
                    onClose={() => setSelectedLog(null)}
                    onActionDone={handleActionDone}
                />
            )}
        </div>
    )
}
