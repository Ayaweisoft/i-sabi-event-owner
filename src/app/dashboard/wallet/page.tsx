"use client"
import React from 'react'
import Link from 'next/link'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import StatCard from '@/components/StatCard'
import { apiGetWalletSummary } from '@/services/AuthService'
import { IWalletSummary } from '@/interfaces'
import { formatNaira } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { MdArrowUpward, MdArrowDownward } from 'react-icons/md'

const txTypeColor: Record<string, string> = {
    credit:  'text-green-600',
    debit:   'text-red-500',
    default: 'text-foreground',
}

const WalletPage = () => {
    const { data, isLoading } = useFetch<IWalletSummary>({
        api: apiGetWalletSummary,
        key: ['WALLET_SUMMARY'],
    })

    if (isLoading || !data) return <NoResult isLoading={isLoading} desc="Loading wallet…" />

    const sourceTotal = data.revenueBySource.ticketing + data.revenueBySource.voting + data.revenueBySource.forms
    const sourceItems = [
        { label: '🎟 Ticketing', value: data.revenueBySource.ticketing },
        { label: '🗳 Voting',    value: data.revenueBySource.voting },
        { label: '📋 Forms',     value: data.revenueBySource.forms },
    ]

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold">Wallet</h1>

            {/* Balance card */}
            <div className="bg-primary text-white rounded-2xl p-6 flex flex-col gap-3">
                <span className="text-sm opacity-80 font-medium uppercase tracking-wide">Available Balance</span>
                <span className="text-4xl font-bold">{formatNaira(data.balance)}</span>
                <div className="flex gap-3 mt-1">
                    <Link
                        href={ROUTES.OWNER.WITHDRAW.INDEX}
                        className="bg-white text-primary text-sm font-semibold px-5 py-2 rounded-lg"
                    >
                        Withdraw Now
                    </Link>
                </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Total Earned"
                    value={formatNaira(data.totalEarned)}
                    icon={<MdArrowDownward className="text-green-500 text-xl" />}
                />
                <StatCard
                    label="Total Withdrawn"
                    value={formatNaira(data.totalWithdrawn)}
                    icon={<MdArrowUpward className="text-red-500 text-xl" />}
                />
            </div>

            {/* Monthly revenue chart */}
            {data.monthlyChart.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Monthly Revenue</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.monthlyChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatNaira(Number(v))} />
                            <Bar dataKey="amount" name="Revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Revenue by source */}
            <div className="bg-white border rounded-2xl p-4">
                <h2 className="text-sm font-semibold mb-3">Revenue by Source</h2>
                <div className="flex flex-col gap-3">
                    {sourceItems.map((s) => {
                        const pct = sourceTotal > 0 ? Math.round((s.value / sourceTotal) * 100) : 0
                        return (
                            <div key={s.label} className="flex items-center gap-3">
                                <span className="text-sm w-28">{s.label}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold w-24 text-right">{formatNaira(s.value)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Revenue by event */}
            {data.revenueByEvent.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Revenue by Event</h2>
                    <div className="flex flex-col divide-y">
                        {data.revenueByEvent.map((e) => (
                            <Link
                                key={e.eventId}
                                href={ROUTES.OWNER.EVENT(e.eventId)}
                                className="flex items-center justify-between py-3 hover:bg-muted/30 px-1 rounded transition"
                            >
                                <div>
                                    <p className="text-sm font-medium">{e.eventName}</p>
                                    <p className="text-xs text-muted-foreground">{e.sold?.toLocaleString() ?? 0} tickets</p>
                                </div>
                                <span className="text-sm font-bold text-primary">{formatNaira(e.revenue)}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* All transactions */}
            <div className="bg-white border rounded-2xl p-4">
                <h2 className="text-sm font-semibold mb-3">Recent Transactions</h2>
                {data.recentTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                    <div className="flex flex-col divide-y">
                        {data.recentTransactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium capitalize">{tx.description || tx.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold ${txTypeColor[tx.type] || txTypeColor.default}`}>
                                    {tx.type === 'credit' ? '+' : '-'}{formatNaira(Math.abs(Number(tx.amount)))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payout history */}
            {data.payoutHistory.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Payout History</h2>
                    <div className="flex flex-col divide-y">
                        {data.payoutHistory.map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(p.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                <span className="text-sm font-bold text-red-500">-{formatNaira(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default WalletPage
