"use client"
import React from 'react'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import { apiGetVoteTrend, apiGetWhoVoted } from '@/services/AuthService'
import { apiGetVoteRecords } from '@/services/EventService'
import { IVoteTrend, IWhoVotedResponse, IVoteRecordsResponse } from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { MdOutlineFileDownload } from 'react-icons/md'
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const GREEN      = '#2d8c3e'
const GOLD       = '#F5C518'
const BORDER     = '#d4e8d6'
const TEXT_LIGHT = '#6b8f70'
const CHART_COLORS = [GREEN, GOLD, '#1a3620', '#c49d10', '#6b8f70']

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

export default function VotesTab({ eventId }: Props) {
    const { data: trend, isLoading: trendLoading } = useFetch<IVoteTrend>({
        api: apiGetVoteTrend,
        key: ['VOTE_TREND', eventId],
        param: { id: eventId, period: 'daily' },
    })

    const { data: whoVoted } = useFetch<IWhoVotedResponse>({
        api: apiGetWhoVoted,
        key: ['WHO_VOTED', eventId],
        param: { id: eventId },
    })

    const { data: records } = useFetch<IVoteRecordsResponse>({
        api: apiGetVoteRecords,
        key: ['VOTE_RECORDS', eventId],
        param: { id: eventId },
    })

    const chartData = (trend?.labels ?? []).map((label, li) => {
        const point: Record<string, string | number> = { label }
        trend!.datasets.forEach((ds) => { point[ds.fullname] = ds.data[li] || 0 })
        return point
    })

    // voters = new field; votes / data = legacy fallbacks
    const voteLog  = whoVoted?.voters ?? whoVoted?.votes ?? whoVoted?.data ?? []
    const transList = records?.transList ?? []

    const totalVotes   = transList.reduce((s, r) => s + r.purchased_vote, 0)
    const totalRevenue = transList.reduce((s, r) => s + r.total_amount, 0)

    return (
        <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Total Votes</p>
                    <p className="text-2xl font-bold mt-1">{totalVotes.toLocaleString()}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(totalRevenue)}</p>
                </Card>
            </div>

            {/* Trend chart */}
            {trendLoading ? (
                <NoResult isLoading desc="Loading vote trend…" />
            ) : chartData.length > 0 ? (
                <Card>
                    <SectionHeader title="Votes Over Time" />
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <YAxis tick={{ fontSize: 10, fill: TEXT_LIGHT }} />
                            <Tooltip />
                            <Legend />
                            {(trend?.datasets ?? []).map((ds, i) => (
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
                <p className="text-sm" style={{ color: TEXT_LIGHT }}>No vote trend data yet.</p>
            )}

            {/* Who voted log */}
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
                        {voteLog.slice(0, 30).map((v, i) => {
                            // Normalise across old shape (contestant/purchased_vote/total_amount)
                            // and new shape (fullname/votes).
                            const voterName  = v.fullname || v.contestant?.fullname || 'Voter'
                            const voteCount  = v.votes    ?? v.purchased_vote ?? 1
                            const amount     = v.total_amount ?? 0
                            return (
                                <div key={i} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {voterName}
                                            {v.username && (
                                                <span className="text-xs font-normal ml-1" style={{ color: TEXT_LIGHT }}>
                                                    &#64;{v.username}
                                                </span>
                                            )}
                                            {' '}· {voteCount} vote{voteCount !== 1 ? 's' : ''}
                                        </p>
                                        {v.message && (
                                            <p className="text-xs italic mt-0.5" style={{ color: TEXT_LIGHT }}>
                                                &ldquo;{v.message}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        {amount > 0 && (
                                            <p className="text-sm font-bold" style={{ color: GREEN }}>
                                                +{formatNaira(amount)}
                                            </p>
                                        )}
                                        <p className="text-xs" style={{ color: TEXT_LIGHT }}>{timeAgo(v.date)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            )}

            {/* Payment records */}
            {transList.length > 0 && (
                <Card>
                    <SectionHeader title={`Payment Records (${transList.length})`} />
                    <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                        {transList.slice(0, 20).map((r, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5">
                                <div>
                                    <p className="text-sm font-semibold">{r.purchased_vote} votes</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {r.ref && (
                                            <span className="text-xs" style={{ color: TEXT_LIGHT }}>
                                                Ref: {r.ref.slice(0, 12)}…
                                            </span>
                                        )}
                                        {r.channel && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                  style={{
                                                      background: r.channel === 'app' ? '#e8f5ea' : r.channel === 'share' ? '#fef3c7' : '#f0f6ff',
                                                      color:      r.channel === 'app' ? '#1a5c28' : r.channel === 'share' ? '#92400e' : '#1e40af',
                                                  }}>
                                                {r.channel}
                                            </span>
                                        )}
                                        {r.packageId && (
                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                  style={{ background: 'rgba(201,168,76,.1)', color: '#a8893a' }}>
                                                pkg
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold" style={{ color: GREEN }}>
                                        +{formatNaira(r.total_amount)}
                                    </p>
                                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>{timeAgo(r.date)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    )
}
