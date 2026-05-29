"use client"
import React, { useState } from 'react'
import useFetch from '@/hooks/useFetch'
import useMutate from '@/hooks/useMutate'
import NoResult from '@/components/NoResult'
import ProgressBar from '@/components/ProgressBar'
import {
    apiGetTicketTypes,
    apiAddTicketType,
    apiDeleteTicketType,
    apiGetPurchaseHistory,
} from '@/services/EventService'
import { apiGetSalesTrend } from '@/services/AuthService'
import {
    ITicketTypesResponse, IFullPurchaseHistoryResponse,
    ISalesTrend, ISubmitTicketType,
} from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { MdAdd, MdDelete, MdOutlineFileDownload } from 'react-icons/md'
import { toast } from 'react-toastify'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GOLD       = '#F5C518'
const SURFACE    = '#f4f8f4'
const BORDER     = '#d4e8d6'
const TEXT_MID   = '#3d5c42'
const TEXT_LIGHT = '#6b8f70'

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border rounded-2xl p-4 ${className}`} style={{ borderColor: BORDER }}>
        {children}
    </div>
)

const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>{title}</h3>
        {action}
    </div>
)

interface Props { eventId: string }

export default function TicketsTab({ eventId }: Props) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [newTicket, setNewTicket] = useState<ISubmitTicketType>({
        eventId,
        ticketType: '',
        amount: '',
        imageUrl: '',
    })

    const {
        data: typesData,
        isLoading: typesLoading,
        refetch: refetchTypes,
    } = useFetch<ITicketTypesResponse>({
        api: apiGetTicketTypes,
        key: ['TICKET_TYPES', eventId],
        param: { id: eventId },
    })

    const {
        data: historyData,
        isLoading: historyLoading,
        refetch: refetchHistory,
    } = useFetch<IFullPurchaseHistoryResponse>({
        api: apiGetPurchaseHistory,
        key: ['PURCHASE_HISTORY', eventId],
        param: { id: eventId },
    })

    const { data: trend } = useFetch<ISalesTrend>({
        api: apiGetSalesTrend,
        key: ['SALES_TREND_30D', eventId],
        param: { id: eventId, period: '30d' },
    })

    const addMutation = useMutate<ISubmitTicketType, unknown>(apiAddTicketType, {
        onSuccess: () => {
            toast.success('Ticket type added')
            setShowAddForm(false)
            setNewTicket({ eventId, ticketType: '', amount: '', imageUrl: '' })
            refetchTypes()
        },
        showErrorMessage: true,
    })

    const deleteMutation = useMutate<null, unknown>(apiDeleteTicketType, {
        onSuccess: () => {
            toast.success('Ticket type removed')
            refetchTypes()
            refetchHistory()
        },
        showErrorMessage: true,
    })

    const types   = typesData?.tickets ?? []
    const tickets = historyData?.tickets ?? []

    const totalRevenue  = tickets.reduce((s, t) => s + (Number(t.amountPaid) || 0), 0)
    const totalSold     = tickets.reduce((s, t) => s + (t.numberOfTicket || 0), 0)
    // Revenue by ticket type
    const revenueByType: Record<string, number> = {}
    const soldByType:    Record<string, number> = {}
    for (const t of tickets) {
        revenueByType[t.ticketType] = (revenueByType[t.ticketType] || 0) + (Number(t.amountPaid) || 0)
        soldByType[t.ticketType]    = (soldByType[t.ticketType]    || 0) + (t.numberOfTicket || 0)
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-lg font-bold" style={{ color: GREEN }}>{formatNaira(totalRevenue)}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Sold</p>
                    <p className="text-lg font-bold">{totalSold.toLocaleString()}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Types</p>
                    <p className="text-lg font-bold">{types.length}</p>
                </Card>
            </div>

            {/* Ticket types */}
            <Card>
                <SectionHeader
                    title="Ticket Types"
                    action={
                        <button
                            onClick={() => setShowAddForm((v) => !v)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition"
                            style={{ backgroundColor: GREEN }}
                        >
                            <MdAdd className="text-base" /> Add Type
                        </button>
                    }
                />

                {/* Add form */}
                {showAddForm && (
                    <div
                        className="rounded-xl p-4 mb-4 flex flex-col gap-3"
                        style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                    >
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TEXT_MID }}>New Ticket Type</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Ticket Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. VIP"
                                    value={newTicket.ticketType}
                                    onChange={(e) => setNewTicket((p) => ({ ...p, ticketType: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                    style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Price (₦)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    value={newTicket.amount}
                                    onChange={(e) => setNewTicket((p) => ({ ...p, amount: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                    style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => addMutation.mutate(newTicket)}
                                disabled={addMutation.isPending || !newTicket.ticketType || !newTicket.amount}
                                className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition disabled:opacity-60"
                                style={{ backgroundColor: GREEN }}
                            >
                                {addMutation.isPending ? 'Saving…' : 'Save Ticket Type'}
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {typesLoading && <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>Loading ticket types…</p>}
                {!typesLoading && types.length === 0 && (
                    <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>No ticket types yet. Add one above.</p>
                )}
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {types.map((t) => {
                        const sold    = soldByType[t.ticketType]    || t.purchased || 0
                        const revenue = revenueByType[t.ticketType] || 0
                        return (
                            <div key={t._id} className="py-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <span className="text-sm font-bold">{t.ticketType}</span>
                                        <span className="text-xs ml-2" style={{ color: TEXT_LIGHT }}>{sold} sold</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold" style={{ color: GREEN }}>
                                            {formatNaira(Number(t.amount))}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Remove "${t.ticketType}" ticket type?`)) {
                                                    deleteMutation.mutate(null, { id: t._id } as Parameters<typeof deleteMutation.mutate>[1])
                                                }
                                            }}
                                            className="p-1.5 rounded-lg transition hover:bg-red-50"
                                            style={{ color: '#e74c3c' }}
                                        >
                                            <MdDelete className="text-base" />
                                        </button>
                                    </div>
                                </div>
                                <ProgressBar value={Math.min(sold, 100)} max={100} showLabel />
                                {revenue > 0 && (
                                    <p className="text-xs mt-1" style={{ color: TEXT_LIGHT }}>
                                        Revenue: {formatNaira(revenue)}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Revenue breakdown */}
            {Object.keys(revenueByType).length > 0 && (
                <Card>
                    <SectionHeader title="Revenue Breakdown" />
                    {Object.entries(revenueByType).map(([type, rev]) => {
                        const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0
                        return (
                            <div key={type} className="flex items-center gap-2 mb-2">
                                <span className="text-sm w-20 truncate">{type}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
                                </div>
                                <span className="text-xs font-semibold w-20 text-right" style={{ color: TEXT_MID }}>
                                    {formatNaira(rev)}
                                </span>
                                <span className="text-xs w-8 text-right" style={{ color: TEXT_LIGHT }}>{pct}%</span>
                            </div>
                        )
                    })}
                </Card>
            )}

            {/* Sales trend */}
            {trend?.data && trend.data.length > 0 && (
                <Card>
                    <SectionHeader title="Sales Trend — 30 Days" />
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={trend.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: TEXT_LIGHT }} tickFormatter={(d) => d.slice(5)} />
                            <YAxis tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <Tooltip />
                            <Bar dataKey="tickets" name="Tickets" fill={GREEN} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Purchase history */}
            <Card>
                <SectionHeader
                    title="Recent Purchases"
                    action={
                        <button
                            className="text-xs font-semibold flex items-center gap-1"
                            style={{ color: GREEN }}
                        >
                            <MdOutlineFileDownload className="text-base" /> Export CSV
                        </button>
                    }
                />
                {historyLoading && <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>Loading…</p>}
                {!historyLoading && tickets.length === 0 && (
                    <NoResult isLoading={false} desc="No purchases yet." />
                )}
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {tickets.slice(0, 40).map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-semibold">{p.name}</p>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                    {p.ticketType} × {p.numberOfTicket}
                                    {p.status && ` · ${p.status}`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: GREEN }}>
                                    +{formatNaira(Number(p.amountPaid) || 0)}
                                </p>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                    {timeAgo(p.date_purchased)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                {tickets.length > 40 && (
                    <p className="text-xs text-center mt-3" style={{ color: TEXT_LIGHT }}>
                        Showing 40 of {tickets.length} purchases
                    </p>
                )}
            </Card>
        </div>
    )
}
