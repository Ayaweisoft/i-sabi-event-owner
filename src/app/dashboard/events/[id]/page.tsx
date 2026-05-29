"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import {
    apiGetEventSummary,
    apiGetSalesTrend,
    apiGetCheckinTrend,
    apiGetCheckinStats,
    apiGetCheckinAttendees,
    apiGetCheckinPins,
    apiGetAudienceInsights,
    apiGetHealthScore,
    apiGetVoteTrend,
    apiGetWhoVoted,
} from '@/services/AuthService'
import {
    IEventSummary, ISalesTrend, ICheckinTrend,
    ICheckinStats, IAttendeesResponse, IPinsResponse,
    IAudienceInsights, IHealthScore, IVoteTrend,
    IWhoVotedResponse,
} from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { MdArrowBack, MdCheckCircle, MdPending, MdOutlineFileDownload } from 'react-icons/md'
import { BsCircleFill } from 'react-icons/bs'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ── Brand colors ──────────────────────────────────────────────────────────────
const GREEN      = '#2d8c3e'
const GOLD       = '#F5C518'
const GREEN_DEEP = '#07360E'
const SURFACE    = '#f4f8f4'
const BORDER     = '#d4e8d6'
const TEXT_MID   = '#3d5c42'
const TEXT_LIGHT = '#6b8f70'

const CHART_COLORS = [GREEN, GOLD, '#1a3620', '#c49d10', '#6b8f70']

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>{title}</h3>
        {action}
    </div>
)

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border rounded-2xl p-4 ${className}`} style={{ borderColor: BORDER }}>
        {children}
    </div>
)

// ── Tabs ──────────────────────────────────────────────────────────────────────
type TicketingTab  = 'overview' | 'tickets' | 'checkin' | 'audience' | 'insights' | 'finance'
type VotingTab     = 'overview' | 'contestants' | 'votes' | 'checkin' | 'finance'
type FormTab       = 'overview' | 'submissions' | 'finance'
type TabId = TicketingTab | VotingTab | FormTab

const TICKETING_TABS  = ['overview','tickets','checkin','audience','insights','finance'] as const
const VOTING_TABS     = ['overview','contestants','votes','checkin','finance'] as const
const FORM_TABS       = ['overview','submissions','finance'] as const

const TAB_LABELS: Record<string, string> = {
    overview:     'Overview',
    tickets:      'Tickets',
    checkin:      'Check-in',
    audience:     'Audience',
    insights:     'Insights',
    finance:      'Finance',
    contestants:  'Contestants',
    votes:        'Votes',
    submissions:  'Submissions',
}

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
    const cfg: Record<string, string> = {
        APPROVED: 'bg-green-100 text-green-700 border-green-300',
        PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-300',
        REJECTED: 'bg-red-100 text-red-700 border-red-300',
    }
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    )
}

// ── Overview Tab (shared across all types) ────────────────────────────────────
const OverviewTab = ({ event, id }: { event: IEventSummary; id: string }) => {
    const { data: trend } = useFetch<ISalesTrend>({
        api: apiGetSalesTrend,
        key: ['SALES_TREND_7D', id],
        param: { id, period: '7d' },
        enabled: event.type === 'TICKETING',
    })

    return (
        <div className="flex flex-col gap-4">
            {/* Event banner */}
            <div className="relative h-44 rounded-2xl overflow-hidden">
                <Image src={event.image_url} fill alt={event.eventName} className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={event.status} />
                        {event.event_is_live && (
                            <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <BsCircleFill className="text-[8px] animate-pulse" /> LIVE
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-bold leading-tight">{event.eventName}</h2>
                    <p className="text-sm opacity-80 mt-0.5">
                        {event.venue}
                        {event.startDate ? ` · ${new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                        {event.startTime ? ` · ${event.startTime}` : ''}
                    </p>
                </div>
            </div>

            {/* Type-specific metrics */}
            {event.type === 'TICKETING' && event.tickets && (
                <>
                    <div className="grid grid-cols-2 gap-3">
                        <Card>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Revenue</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(event.tickets.revenue)}</p>
                        </Card>
                        <Card>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Tickets Sold</p>
                            <p className="text-2xl font-bold mt-1">{event.tickets.sold.toLocaleString()}</p>
                        </Card>
                    </div>
                    <Card>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Checked In</p>
                            <span className="text-sm font-bold">{event.tickets.checkedIn} / {event.tickets.sold}</span>
                        </div>
                        <ProgressBar value={event.tickets.checkInRate} showLabel />
                    </Card>
                    <div className="grid grid-cols-2 gap-3">
                        <Card>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Active PINs</p>
                            <p className="text-2xl font-bold mt-1">{event.activePins}</p>
                            {event.activePins === 0 && <p className="text-xs text-red-500 mt-1">⚠️ No PINs set</p>}
                        </Card>
                        <Card>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Check-in Rate</p>
                            <p className="text-2xl font-bold mt-1">{event.tickets.checkInRate}%</p>
                        </Card>
                    </div>
                </>
            )}

            {event.type === 'VOTING' && event.voting && (
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Total Votes</p>
                        <p className="text-2xl font-bold mt-1">{event.voting.totalVotes.toLocaleString()}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Revenue</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(event.voting.estimatedRevenue)}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Contestants</p>
                        <p className="text-2xl font-bold mt-1">{event.voting.contestantCount}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Cost / Vote</p>
                        <p className="text-2xl font-bold mt-1">{formatNaira(event.voting.costPerVote)}</p>
                    </Card>
                </div>
            )}

            {event.type === 'FORM-SALES' && event.forms && (
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Submissions</p>
                        <p className="text-2xl font-bold mt-1">{event.forms.submissions}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Revenue</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(event.forms.revenue)}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Price / Form</p>
                        <p className="text-2xl font-bold mt-1">{formatNaira(event.forms.price)}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: TEXT_LIGHT }}>Form Status</p>
                        <p className="text-base font-bold mt-1">{event.forms.active ? '🟢 Active' : '🔴 Inactive'}</p>
                    </Card>
                </div>
            )}

            {/* Sales trend chart for ticketing */}
            {event.type === 'TICKETING' && trend?.data && trend.data.length > 0 && (
                <Card>
                    <SectionHeader title="Ticket Sales — Last 7 Days" />
                    <ResponsiveContainer width="100%" height={160}>
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
        </div>
    )
}

// ── Tickets Tab ───────────────────────────────────────────────────────────────
const TicketsTab = ({ event, id }: { event: IEventSummary; id: string }) => {
    const { data: trend } = useFetch<ISalesTrend>({
        api: apiGetSalesTrend,
        key: ['SALES_TREND_30D', id],
        param: { id, period: '30d' },
    })

    if (!event.tickets) return <p className="text-sm" style={{ color: TEXT_LIGHT }}>No ticket data available.</p>

    const { types, sold, revenue, checkedIn, recent } = event.tickets
    const totalCapacity = types.reduce((s, t) => s + (t.purchased || 0), 0) + sold

    return (
        <div className="flex flex-col gap-4">
            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-lg font-bold" style={{ color: GREEN }}>{formatNaira(revenue)}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Sold</p>
                    <p className="text-lg font-bold">{sold}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Checked In</p>
                    <p className="text-lg font-bold">{checkedIn}</p>
                </Card>
            </div>

            {/* Ticket types */}
            <Card>
                <SectionHeader title="Ticket Types" />
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {types.map((t) => {
                        const cap = Math.max(t.purchased || 1, 1)
                        const pct = Math.round((t.purchased / cap) * 100)
                        return (
                            <div key={t.ticketType} className="py-3">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold">{t.ticketType}</span>
                                    <span className="text-sm font-bold" style={{ color: GREEN }}>{formatNaira(t.amount)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: GREEN }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium w-20 text-right" style={{ color: TEXT_LIGHT }}>
                                        {t.purchased} sold
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {/* Revenue breakdown */}
            <Card>
                <SectionHeader title="Revenue Breakdown" />
                <div className="flex flex-col gap-2">
                    {types.map((t) => {
                        const typeRev = Number(t.amount) * (t.purchased || 0)
                        const pct = revenue > 0 ? Math.round((typeRev / revenue) * 100) : 0
                        return (
                            <div key={t.ticketType} className="flex items-center gap-2">
                                <span className="text-sm w-20 truncate">{t.ticketType}</span>
                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
                                </div>
                                <span className="text-xs font-semibold w-20 text-right" style={{ color: TEXT_MID }}>
                                    {formatNaira(typeRev)}
                                </span>
                                <span className="text-xs w-8 text-right" style={{ color: TEXT_LIGHT }}>{pct}%</span>
                            </div>
                        )
                    })}
                </div>
            </Card>

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

            {/* Recent purchases */}
            <Card>
                <SectionHeader
                    title="Recent Purchases"
                    action={
                        <button className="text-xs font-semibold flex items-center gap-1" style={{ color: GREEN }}>
                            <MdOutlineFileDownload className="text-base" /> Export CSV
                        </button>
                    }
                />
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {recent.length === 0 && <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>No purchases yet.</p>}
                    {recent.map((p, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                            <div>
                                <p className="text-sm font-semibold">{p.name}</p>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>{p.ticketType} × {p.numberOfTicket}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: GREEN }}>+{formatNaira(p.amountPaid)}</p>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>{timeAgo(p.date_purchased)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

// ── Check-in Tab ──────────────────────────────────────────────────────────────
const CheckinTab = ({ id }: { id: string }) => {
    const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked' | 'pending'>('all')

    const { data: stats, isLoading: statsLoading } = useFetch<ICheckinStats>({
        api: apiGetCheckinStats,
        key: ['CHECKIN_STATS', id],
        param: { id },
    })

    const { data: attendees, isLoading: attendeesLoading } = useFetch<IAttendeesResponse>({
        api: apiGetCheckinAttendees,
        key: ['ATTENDEES', id, attendeeFilter],
        param: { id, status: attendeeFilter },
    })

    const { data: pinsData } = useFetch<IPinsResponse>({
        api: apiGetCheckinPins,
        key: ['PINS', id],
        param: { id },
    })

    const { data: trendData } = useFetch<ICheckinTrend>({
        api: apiGetCheckinTrend,
        key: ['CHECKIN_TREND_H', id],
        param: { id, period: 'hourly' },
    })

    return (
        <div className="flex flex-col gap-4">
            {/* Live attendance */}
            <Card>
                <SectionHeader title="Live Attendance" />
                {stats ? (
                    <>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-black" style={{ color: GREEN }}>{stats.checkedIn}</span>
                            <span className="text-base font-semibold mb-0.5" style={{ color: TEXT_LIGHT }}>
                                checked in of {stats.totalSeats} sold
                            </span>
                        </div>
                        <ProgressBar value={stats.percentFull} showLabel />
                        <p className="text-xs mt-2" style={{ color: TEXT_LIGHT }}>
                            {stats.remaining} ticket holders not yet arrived
                        </p>
                    </>
                ) : (
                    <p className="text-sm" style={{ color: TEXT_LIGHT }}>{statsLoading ? 'Loading…' : 'No data'}</p>
                )}
            </Card>

            {/* Check-in trend */}
            {trendData?.data && trendData.data.length > 0 && (
                <Card>
                    <SectionHeader title="Check-ins by Hour" />
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={trendData.data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <YAxis tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Check-ins" fill={GREEN} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* PINs */}
            <Card>
                <SectionHeader
                    title="Check-in PINs"
                    action={
                        <span className="text-xs font-semibold" style={{ color: GREEN }}>
                            {pinsData?.count || 0} active
                        </span>
                    }
                />
                {!pinsData?.pins?.length ? (
                    <div className="text-xs rounded-xl px-3 py-2 border border-red-200 bg-red-50 text-red-700">
                        ⚠️ No check-in PINs configured. Gate staff cannot scan tickets. Set PINs in the main i-sabi app.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {pinsData.pins.map((pin) => (
                            <div
                                key={pin}
                                className="flex items-center justify-between px-3 py-2 rounded-lg"
                                style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                            >
                                <div className="flex items-center gap-2">
                                    <BsCircleFill className="text-[8px]" style={{ color: GREEN }} />
                                    <span className="text-sm font-bold tracking-widest">{pin}</span>
                                </div>
                                <span className="text-xs" style={{ color: TEXT_LIGHT }}>Active</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Attendees */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>Attendees</h3>
                    <div className="flex gap-1">
                        {(['all', 'checked', 'pending'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setAttendeeFilter(f)}
                                className="text-xs px-2.5 py-1 rounded-full border font-medium transition"
                                style={{
                                    backgroundColor: attendeeFilter === f ? GREEN : 'transparent',
                                    color: attendeeFilter === f ? 'white' : TEXT_LIGHT,
                                    borderColor: attendeeFilter === f ? GREEN : BORDER,
                                }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {attendeesLoading && <p className="text-sm" style={{ color: TEXT_LIGHT }}>Loading attendees…</p>}
                {!attendeesLoading && !attendees?.tickets?.length && (
                    <p className="text-sm" style={{ color: TEXT_LIGHT }}>No attendees match this filter.</p>
                )}
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {attendees?.tickets?.slice(0, 30).map((a, i) => {
                        const checkedIn = (a.numberOfTicketUsed || 0) > 0
                        return (
                            <div key={i} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-semibold">{a.name}</p>
                                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                        {a.ticketType} × {a.numberOfTicket}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {checkedIn ? (
                                        <>
                                            <p className="text-xs font-bold flex items-center gap-1 justify-end" style={{ color: GREEN }}>
                                                <MdCheckCircle /> Checked in
                                            </p>
                                            <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                                {a.checkedInAt
                                                    ? new Date(a.checkedInAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
                                                    : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs font-medium flex items-center gap-1 justify-end" style={{ color: TEXT_LIGHT }}>
                                            <MdPending /> Pending
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {(attendees?.total || 0) > 30 && (
                    <p className="text-xs text-center mt-3" style={{ color: TEXT_LIGHT }}>
                        Showing 30 of {attendees!.total} attendees
                    </p>
                )}
            </Card>
        </div>
    )
}

// ── Contestants Tab (VOTING) ──────────────────────────────────────────────────
const ContestantsTab = ({ event }: { event: IEventSummary }) => {
    if (!event.voting) return <p className="text-sm" style={{ color: TEXT_LIGHT }}>No voting data.</p>

    const { leaderboard, totalVotes, estimatedRevenue, contestantCount, costPerVote } = event.voting
    const medals = ['🥇', '🥈', '🥉']

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Total Votes</p>
                    <p className="text-2xl font-bold mt-1">{totalVotes.toLocaleString()}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(estimatedRevenue)}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Contestants</p>
                    <p className="text-2xl font-bold mt-1">{contestantCount}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Cost / Vote</p>
                    <p className="text-2xl font-bold mt-1">{formatNaira(costPerVote)}</p>
                </Card>
            </div>

            <Card>
                <SectionHeader title={`Leaderboard · ${totalVotes.toLocaleString()} total votes`} />
                <div className="flex flex-col gap-4">
                    {leaderboard.map((c, i) => (
                        <div key={c._id} className="flex items-center gap-3">
                            <span className="text-2xl w-8 text-center">
                                {i < 3 ? medals[i] : <span className="text-base font-bold" style={{ color: TEXT_LIGHT }}>{i + 1}.</span>}
                            </span>
                            {c.image_url && (
                                <Image
                                    src={c.image_url}
                                    width={44}
                                    height={44}
                                    alt={c.fullname}
                                    className="rounded-full object-cover w-11 h-11 border-2"
                                    style={{ borderColor: i === 0 ? GOLD : BORDER }}
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold truncate">{c.fullname}</p>
                                    <span className="text-sm font-black ml-2 shrink-0">{c.vote_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${c.pct}%`,
                                                backgroundColor: i === 0 ? GREEN : i === 1 ? GOLD : TEXT_LIGHT,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold w-8" style={{ color: TEXT_LIGHT }}>{c.pct}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

// ── Votes Tab (VOTING) ────────────────────────────────────────────────────────
const VotesTab = ({ event, id }: { event: IEventSummary; id: string }) => {
    const { data: trend, isLoading: trendLoading } = useFetch<IVoteTrend>({
        api: apiGetVoteTrend,
        key: ['VOTE_TREND', id],
        param: { id, period: 'daily' },
    })

    const { data: whoVoted } = useFetch<IWhoVotedResponse>({
        api: apiGetWhoVoted,
        key: ['WHO_VOTED', id],
        param: { id },
    })

    const chartData = (trend?.labels || []).map((label, li) => {
        const point: Record<string, string | number> = { label }
        trend!.datasets.forEach((ds) => { point[ds.fullname] = ds.data[li] || 0 })
        return point
    })

    const voteLog = whoVoted?.votes || whoVoted?.data || []

    return (
        <div className="flex flex-col gap-4">
            {event.voting && (
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Total Votes</p>
                        <p className="text-2xl font-bold mt-1">{event.voting.totalVotes.toLocaleString()}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(event.voting.estimatedRevenue)}</p>
                    </Card>
                </div>
            )}

            {/* Vote trend chart */}
            {chartData.length > 0 ? (
                <Card>
                    <SectionHeader title="Votes Over Time" />
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <YAxis tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <Tooltip />
                            <Legend />
                            {trend!.datasets.map((ds, i) => (
                                <Line
                                    key={ds.contestantId}
                                    type="monotone"
                                    dataKey={ds.fullname}
                                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                    strokeWidth={2.5}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
            ) : (
                !trendLoading && <p className="text-sm" style={{ color: TEXT_LIGHT }}>No vote trend data yet.</p>
            )}

            {/* Vote activity log */}
            {voteLog.length > 0 && (
                <Card>
                    <SectionHeader
                        title="Vote Activity"
                        action={
                            <button className="text-xs font-semibold flex items-center gap-1" style={{ color: GREEN }}>
                                <MdOutlineFileDownload className="text-base" /> Export
                            </button>
                        }
                    />
                    <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                        {voteLog.slice(0, 20).map((v, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-semibold">
                                        {v.contestant?.fullname || 'Contestant'} · {v.purchased_vote} vote{v.purchased_vote !== 1 ? 's' : ''}
                                    </p>
                                    {v.message && <p className="text-xs italic" style={{ color: TEXT_LIGHT }}>&ldquo;{v.message}&rdquo;</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold" style={{ color: GREEN }}>+{formatNaira(v.total_amount)}</p>
                                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>{timeAgo(v.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    )
}

// ── Submissions Tab (FORM-SALES) ──────────────────────────────────────────────
const SubmissionsTab = ({ event }: { event: IEventSummary }) => {
    if (!event.forms) return <p className="text-sm" style={{ color: TEXT_LIGHT }}>No form data.</p>

    const { title, price, submissions, revenue, active } = event.forms

    return (
        <div className="flex flex-col gap-4">
            {/* Form info */}
            <Card>
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold">{title || 'Form'}</p>
                    <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                            backgroundColor: active ? '#dcfce7' : '#f3f4f6',
                            color: active ? '#15803d' : '#6b7280',
                        }}
                    >
                        {active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>Price: {formatNaira(price)} per submission</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Submissions</p>
                    <p className="text-2xl font-bold mt-1">{submissions}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(revenue)}</p>
                </Card>
            </div>

            <Card>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                    Detailed submission records are available in the main i-sabi admin panel. Export functionality coming soon.
                </p>
            </Card>
        </div>
    )
}

// ── Audience Tab ──────────────────────────────────────────────────────────────
const AudienceTab = ({ id }: { id: string }) => {
    const { data, isLoading } = useFetch<IAudienceInsights>({
        api: apiGetAudienceInsights,
        key: ['AUDIENCE', id],
        param: { id },
    })

    if (isLoading || !data) return <NoResult isLoading={isLoading} desc="Loading audience data…" />

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Buyers"   value={data.totalBuyers} sub={`Avg ${data.avgTicketsPerBuyer} tickets each`} />
                <StatCard label="Repeat Buyers"  value={`${data.repeatBuyerRate}%`} sub={`${data.repeatBuyerCount} people bought from you before`} />
                <StatCard label="Early Buyers"   value={data.earlyBuyers} sub="Bought 7+ days before event" />
                <StatCard label="Urgency Buyers" value={data.urgencyBuyers} sub="Bought within 24h of event" />
            </div>

            {/* Ticket type preference */}
            <Card>
                <SectionHeader title="Ticket Type Preference" />
                <div className="flex flex-col gap-3">
                    {data.ticketTypePref.map((t) => (
                        <div key={t.type} className="flex items-center gap-2">
                            <span className="text-sm w-20 truncate font-medium">{t.type}</span>
                            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, backgroundColor: GREEN }} />
                            </div>
                            <span className="text-xs w-8" style={{ color: TEXT_LIGHT }}>{t.pct}%</span>
                            <span className="text-xs w-16 text-right" style={{ color: TEXT_MID }}>{t.count} sold</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Purchase timing heatmap */}
            <Card>
                <SectionHeader title="Purchase Timing Heatmap" />
                <div className="overflow-x-auto">
                    <div className="flex flex-col gap-1 min-w-[440px]">
                        {data.timingHeatmap.map((dayRow, dayIdx) => {
                            const max = Math.max(...dayRow, 1)
                            return (
                                <div key={dayIdx} className="flex items-center gap-1">
                                    <span className="text-xs w-7" style={{ color: TEXT_LIGHT }}>{DAYS[dayIdx]}</span>
                                    {dayRow.map((val, hour) => (
                                        <div
                                            key={hour}
                                            title={`${DAYS[dayIdx]} ${hour}:00 — ${val} purchases`}
                                            className="h-5 flex-1 rounded-sm"
                                            style={{
                                                backgroundColor: val === 0
                                                    ? BORDER
                                                    : `rgba(45,140,62,${Math.max(val / max, 0.15)})`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )
                        })}
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-7" />
                            {Array.from({ length: 24 }, (_, h) => (
                                <span key={h} className="flex-1 text-center" style={{ fontSize: 8, color: TEXT_LIGHT }}>
                                    {h % 6 === 0 ? `${h}h` : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Top buyers */}
            <Card>
                <SectionHeader title="Top Buyers" />
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {data.topBuyers.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5">
                            <span className="text-xs font-bold w-5" style={{ color: TEXT_LIGHT }}>#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{b.name}</p>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>{b.tickets} tickets</p>
                            </div>
                            <span className="text-sm font-bold" style={{ color: GREEN }}>{formatNaira(b.spend)}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}

// ── Insights Tab ──────────────────────────────────────────────────────────────
const InsightsTab = ({ id }: { id: string }) => {
    const { data, isLoading } = useFetch<IHealthScore>({
        api: apiGetHealthScore,
        key: ['HEALTH_SCORE', id],
        param: { id },
    })

    if (isLoading || !data) return <NoResult isLoading={isLoading} desc="Calculating insights…" />

    const gradeColor: Record<string, string> = {
        A: GREEN, B: '#3b82f6', C: GOLD, D: '#e74c3c',
    }

    const levelConfig: Record<string, { bg: string; icon: string }> = {
        alert:   { bg: '#fef9c3', icon: '⚠️' },
        warning: { bg: '#fff7ed', icon: '⚠️' },
        info:    { bg: '#eff6ff', icon: '💡' },
        success: { bg: '#f0fdf4', icon: '✅' },
    }

    const metrics = [
        { label: 'Sales Velocity',   value: data.breakdown.salesVelocity },
        { label: 'Check-in Rate',    value: data.breakdown.checkInRate },
        { label: 'PIN Safety',       value: data.breakdown.pinSafety },
        { label: 'Approval Status',  value: data.breakdown.approvalStatus },
        { label: 'Profile Complete', value: data.breakdown.profileComplete },
    ]

    return (
        <div className="flex flex-col gap-4">
            {/* Health score card */}
            <Card>
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center">
                        <span className="text-5xl font-black" style={{ color: gradeColor[data.grade] || GREEN }}>
                            {data.grade}
                        </span>
                        <span className="text-xs mt-1" style={{ color: TEXT_LIGHT }}>Grade</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold">Event Health Score</span>
                            <span className="font-black">{data.overall} / 100</span>
                        </div>
                        <ProgressBar
                            value={data.overall}
                            barClassName={
                                data.overall >= 80 ? 'bg-green-500' :
                                data.overall >= 60 ? 'bg-blue-500' :
                                data.overall >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                            }
                        />
                    </div>
                </div>
            </Card>

            {/* Breakdown */}
            <Card>
                <SectionHeader title="Score Breakdown" />
                <div className="flex flex-col gap-3">
                    {metrics.map((m) => (
                        <div key={m.label}>
                            <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: TEXT_MID }}>{m.label}</span>
                                <span className="font-bold">{m.value} / 100</span>
                            </div>
                            <ProgressBar value={m.value} />
                        </div>
                    ))}
                </div>
            </Card>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>Smart Recommendations</h3>
                    {data.recommendations.map((r, i) => {
                        const cfg = levelConfig[r.level] || levelConfig.info
                        return (
                            <div
                                key={i}
                                className="rounded-xl px-4 py-3 text-sm font-medium"
                                style={{ backgroundColor: cfg.bg }}
                            >
                                {cfg.icon} {r.msg}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Finance Tab (shared) ──────────────────────────────────────────────────────
const FinanceTab = ({ event }: { event: IEventSummary }) => {
    let gross = 0

    if (event.type === 'TICKETING' && event.tickets)     gross = event.tickets.revenue
    else if (event.type === 'VOTING' && event.voting)     gross = event.voting.estimatedRevenue
    else if (event.type === 'FORM-SALES' && event.forms)  gross = event.forms.revenue

    const platformCutPct  = event.type === 'TICKETING' ? 13 : 0
    const platformCut     = Math.round(gross * (platformCutPct / 100))
    const yourEarnings    = gross - platformCut

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <SectionHeader title="Event Revenue" />
                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-medium">Gross Sales</span>
                        <span className="text-base font-bold">{formatNaira(gross)}</span>
                    </div>
                    {platformCutPct > 0 && (
                        <div className="flex justify-between items-center py-3">
                            <span className="text-sm" style={{ color: TEXT_LIGHT }}>Platform Cut ({platformCutPct}%)</span>
                            <span className="text-base font-semibold text-red-500">−{formatNaira(platformCut)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-bold">Your Earnings</span>
                        <span className="text-xl font-black" style={{ color: GREEN }}>{formatNaira(yourEarnings)}</span>
                    </div>
                </div>
            </Card>

            <Card>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                    These figures are estimates. For exact credited amounts, check your{' '}
                    <Link href={ROUTES.OWNER.WALLET} className="font-semibold underline" style={{ color: GREEN }}>
                        wallet transaction history
                    </Link>.
                </p>
            </Card>
        </div>
    )
}

// ── Main workspace ────────────────────────────────────────────────────────────
const EventWorkspace = () => {
    const { id } = useParams<{ id: string }>()
    const [activeTab, setActiveTab] = useState<TabId>('overview')

    const { data: event, isLoading } = useFetch<IEventSummary>({
        api: apiGetEventSummary,
        key: ['EVENT_SUMMARY', id],
        param: { id },
    })

    if (isLoading || !event) {
        return <NoResult isLoading={isLoading} desc="Loading event workspace…" />
    }

    const tabs =
        event.type === 'TICKETING' ? TICKETING_TABS :
        event.type === 'VOTING'    ? VOTING_TABS    : FORM_TABS

    return (
        <div className="flex flex-col gap-4">
            {/* Back navigation */}
            <div className="flex items-center gap-3">
                <Link
                    href={ROUTES.OWNER.EVENTS}
                    className="p-2 rounded-xl transition"
                    style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                >
                    <MdArrowBack className="text-lg" style={{ color: GREEN_DEEP }} />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate" style={{ color: GREEN_DEEP }}>{event.eventName}</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={event.status} />
                        <span className="text-xs capitalize" style={{ color: TEXT_LIGHT }}>
                            {event.type.toLowerCase().replace('-', ' ')}
                        </span>
                        {event.event_is_live && (
                            <span className="text-xs font-bold flex items-center gap-1" style={{ color: GREEN }}>
                                <BsCircleFill className="text-[8px] animate-pulse" /> LIVE
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div
                className="flex gap-0.5 overflow-x-auto pb-0.5"
                style={{ borderBottom: `2px solid ${BORDER}` }}
            >
                {tabs.map((t) => {
                    const active = activeTab === t
                    return (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as TabId)}
                            className="px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition"
                            style={{
                                borderBottom: active ? `2px solid ${GREEN}` : '2px solid transparent',
                                color: active ? GREEN : TEXT_LIGHT,
                                marginBottom: '-2px',
                            }}
                        >
                            {TAB_LABELS[t]}
                        </button>
                    )
                })}
            </div>

            {/* Tab content */}
            <div className="pb-10">
                {activeTab === 'overview'    && <OverviewTab     event={event} id={id} />}
                {activeTab === 'tickets'     && <TicketsTab      event={event} id={id} />}
                {activeTab === 'checkin'     && <CheckinTab      id={id} />}
                {activeTab === 'audience'    && <AudienceTab     id={id} />}
                {activeTab === 'insights'    && <InsightsTab     id={id} />}
                {activeTab === 'contestants' && <ContestantsTab  event={event} />}
                {activeTab === 'votes'       && <VotesTab        event={event} id={id} />}
                {activeTab === 'submissions' && <SubmissionsTab  event={event} />}
                {activeTab === 'finance'     && <FinanceTab      event={event} />}
            </div>
        </div>
    )
}

export default EventWorkspace
