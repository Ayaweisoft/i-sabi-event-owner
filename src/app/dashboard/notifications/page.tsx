"use client"
import React, { useState } from 'react'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import { apiGetNotifications } from '@/services/AuthService'
import { INotificationsResponse } from '@/interfaces'
import { timeAgo } from '@/lib/utils'

const TYPE_FILTERS = [
    { id: 'all',       label: 'All' },
    { id: 'alert',     label: 'Alerts' },
    { id: 'sale',      label: 'Sales' },
    { id: 'checkin',   label: 'Check-in' },
    { id: 'vote',      label: 'Votes' },
    { id: 'milestone', label: 'Milestones' },
]

const levelConfig: Record<string, { bg: string; border: string; dot: string }> = {
    danger:  { bg: 'bg-red-50',     border: 'border-red-200',    dot: 'bg-red-500' },
    warning: { bg: 'bg-yellow-50',  border: 'border-yellow-200', dot: 'bg-yellow-500' },
    success: { bg: 'bg-green-50',   border: 'border-green-200',  dot: 'bg-green-500' },
    info:    { bg: 'bg-blue-50',    border: 'border-blue-200',   dot: 'bg-blue-400' },
}

const typeIcon: Record<string, string> = {
    alert:     '⚠️',
    sale:      '🎟',
    checkin:   '✅',
    vote:      '🗳',
    milestone: '🎉',
}

const NotificationsPage = () => {
    const [typeFilter, setTypeFilter] = useState('all')

    const { data, isLoading } = useFetch<INotificationsResponse>({
        api: apiGetNotifications,
        key: ['NOTIFICATIONS', typeFilter],
        param: { type: typeFilter, limit: 50 },
    })

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Notifications</h1>
                    {data && <p className="text-sm text-muted-foreground">{data.total} total</p>}
                </div>
                {data && data.total > 0 && (
                    <button className="text-xs text-primary font-medium">Mark all read</button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
                {TYPE_FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setTypeFilter(f.id)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border whitespace-nowrap transition ${
                            typeFilter === f.id
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-muted-foreground border-border hover:border-primary'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {!data?.notifications?.length ? (
                <NoResult isLoading={isLoading} desc="No notifications" />
            ) : (
                <div className="flex flex-col gap-2">
                    {data.notifications.map((n, i) => {
                        const cfg = levelConfig[n.level] || levelConfig.info
                        return (
                            <div
                                key={i}
                                className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${cfg.bg} ${cfg.border}`}
                            >
                                <span className="text-lg mt-0.5">{typeIcon[n.type] || '•'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">{n.title}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                                    {n.eventName && (
                                        <p className="text-xs text-muted-foreground mt-1">📍 {n.eventName}</p>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(n.at)}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default NotificationsPage
