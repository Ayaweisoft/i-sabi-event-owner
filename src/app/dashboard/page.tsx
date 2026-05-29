"use client"
import React from 'react'
import Link from 'next/link'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import StatCard from '@/components/StatCard'
import { apiGetOwnerSummary } from '@/services/AuthService'
import { IOwnerSummary } from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
    MdEvent, MdConfirmationNumber, MdHowToVote,
    MdArticle, MdAccountBalanceWallet, MdCheckCircle,
} from 'react-icons/md'
import { BiSolidBell } from 'react-icons/bi'

const levelColors: Record<string, string> = {
    alert:   'bg-orange-50 border-orange-300 text-orange-700',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    danger:  'bg-red-50 border-red-300 text-red-700',
    info:    'bg-blue-50 border-blue-300 text-blue-700',
    success: 'bg-green-50 border-green-300 text-green-700',
}

const activityIcon: Record<string, React.ReactNode> = {
    ticket_sale:     <MdConfirmationNumber className="text-primary" />,
    check_in:        <MdCheckCircle className="text-green-500" />,
    vote:            <MdHowToVote className="text-purple-500" />,
    form_submission: <MdArticle className="text-blue-500" />,
}

const Overview = () => {
    const { data, isLoading } = useFetch<IOwnerSummary>({
        api: apiGetOwnerSummary,
        key: ['OWNER_SUMMARY'],
    })

    if (isLoading || !data) {
        return <NoResult isLoading={isLoading} desc="Loading overview…" />
    }

    const { owner, stats, alerts, recentActivity, liveEvents } = data

    return (
        <div className="flex flex-col gap-6">
            {/* Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Good day, {owner.name || owner.username} 👋</h1>
                    <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your events</p>
                </div>
                <Link href={ROUTES.OWNER.NOTIFICATIONS} className="relative p-2">
                    <BiSolidBell className="text-2xl text-muted-foreground" />
                    {alerts.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                            {alerts.length}
                        </span>
                    )}
                </Link>
            </div>

            {/* Wallet card */}
            <div className="bg-primary text-white rounded-2xl p-6 flex flex-col gap-3">
                <span className="text-sm opacity-80 font-medium uppercase tracking-wide">Wallet Balance</span>
                <span className="text-4xl font-bold">{formatNaira(owner.balance)}</span>
                <div className="flex gap-3 mt-1">
                    <Link
                        href={ROUTES.OWNER.WITHDRAW.INDEX}
                        className="bg-white text-primary text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                        Withdraw
                    </Link>
                    <Link
                        href={ROUTES.OWNER.WALLET}
                        className="bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                        View Wallet
                    </Link>
                </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                    label="Total Events"
                    value={stats.totalEvents}
                    sub={`${stats.liveEvents} live now`}
                    icon={<MdEvent className="text-xl" />}
                />
                <StatCard
                    label="Tickets Sold"
                    value={stats.ticketsSold.toLocaleString()}
                    sub={`${stats.checkedIn.toLocaleString()} checked in`}
                    icon={<MdConfirmationNumber className="text-xl" />}
                />
                <StatCard
                    label="Total Votes"
                    value={stats.totalVotes.toLocaleString()}
                    icon={<MdHowToVote className="text-xl" />}
                />
                <StatCard
                    label="Form Submissions"
                    value={stats.formSubmissions.toLocaleString()}
                    icon={<MdArticle className="text-xl" />}
                />
                <StatCard
                    label="Total Earned"
                    value={formatNaira(stats.totalEarned)}
                    icon={<MdAccountBalanceWallet className="text-xl" />}
                    className="col-span-2 lg:col-span-1"
                />
            </div>

            {/* Live events */}
            {liveEvents.length > 0 && (
                <div>
                    <h2 className="font-semibold text-sm mb-2">🟢 Live Right Now</h2>
                    <div className="flex flex-col gap-2">
                        {liveEvents.map((e) => (
                            <Link
                                key={e._id}
                                href={ROUTES.OWNER.EVENT(e._id)}
                                className="flex items-center justify-between border rounded-xl px-4 py-3 bg-green-50 border-green-200 hover:bg-green-100 transition"
                            >
                                <span className="font-medium text-sm">{e.eventName}</span>
                                <span className="text-xs text-muted-foreground capitalize">{e.type.toLowerCase()}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
                <div>
                    <h2 className="font-semibold text-sm mb-2">⚠️ Actions Needed</h2>
                    <div className="flex flex-col gap-2">
                        {alerts.map((a, i) => (
                            <div
                                key={i}
                                className={`border rounded-xl px-4 py-3 text-sm ${levelColors[a.level] || levelColors.info}`}
                            >
                                {a.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent activity */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-sm">Recent Activity</h2>
                    <Link href={ROUTES.OWNER.EVENTS} className="text-xs text-primary font-medium">
                        All events →
                    </Link>
                </div>
                {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity.</p>
                ) : (
                    <div className="flex flex-col divide-y border rounded-xl overflow-hidden">
                        {recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 bg-white">
                                <span className="text-lg mt-0.5">{activityIcon[a.type] || '•'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{a.message}</p>
                                    <p className="text-xs text-muted-foreground truncate">{a.eventName}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {a.amount !== undefined && (
                                        <span className="text-xs font-semibold text-green-600">+{formatNaira(a.amount)}</span>
                                    )}
                                    <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Overview
