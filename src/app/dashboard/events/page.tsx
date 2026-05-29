"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import ProgressBar from '@/components/ProgressBar'
import { apiGetEvents } from '@/services/AuthService'
import { IEventResponse, IEvent } from '@/interfaces'
import { formatNaira } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { MdChevronRight } from 'react-icons/md'

const TYPE_FILTERS = ['All', 'TICKETING', 'VOTING', 'FORM-SALES'] as const
const STATUS_FILTERS = ['All', 'APPROVED', 'PENDING', 'REJECTED'] as const

const typeEmoji: Record<string, string> = {
    TICKETING: '🎟',
    VOTING: '🗳',
    'FORM-SALES': '📋',
}

const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    PENDING:  'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
}

const EventCard = ({ event }: { event: IEvent }) => (
    <Link
        href={ROUTES.OWNER.EVENT(event._id)}
        className="flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition group"
    >
        <div className="relative h-36 bg-muted">
            <Image
                src={event.image_url}
                fill
                alt={event.eventName}
                className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 left-2 flex gap-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[event.status] || 'bg-gray-100 text-gray-600'}`}>
                    {event.status}
                </span>
                {event.event_is_live && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500 text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                        LIVE
                    </span>
                )}
            </div>
        </div>

        <div className="p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <span className="text-base font-semibold line-clamp-1">{event.eventName}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {typeEmoji[event.type]} {event.type.toLowerCase()} · {event.venue || 'No venue'}
                    </p>
                </div>
                <MdChevronRight className="text-muted-foreground text-xl mt-1 shrink-0" />
            </div>

            {event.startDate && (
                <p className="text-xs text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {event.startTime ? ` · ${event.startTime}` : ''}
                </p>
            )}

            <div className="flex items-center justify-between mt-1">
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                        {event.type === 'TICKETING' ? 'Sold' : event.type === 'VOTING' ? 'Votes' : 'Submissions'}
                    </span>
                    <span className="text-sm font-bold">{event.totalCount.toLocaleString()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {formatNaira(0)} earned
                </span>
            </div>

            {event.type === 'TICKETING' && (
                <ProgressBar value={event.totalCount} max={500} showLabel className="mt-1" />
            )}
        </div>
    </Link>
)

const EventsHub = () => {
    const [typeFilter, setTypeFilter] = useState<string>('All')
    const [statusFilter, setStatusFilter] = useState<string>('All')

    const { data, isLoading } = useFetch<IEventResponse>({
        api: apiGetEvents,
        key: ['EVENTS'],
    })

    const events = data?.myEvent ?? []

    const filtered = events.filter((e) => {
        const typeOk   = typeFilter   === 'All' || e.type   === typeFilter
        const statusOk = statusFilter === 'All' || e.status === statusFilter
        return typeOk && statusOk
    })

    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">My Events ({events.length})</h1>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-1.5">
                    {TYPE_FILTERS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                                typeFilter === t
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-muted-foreground border-border hover:border-primary'
                            }`}
                        >
                            {t === 'All' ? 'All types' : t.toLowerCase()}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_FILTERS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition ${
                                statusFilter === s
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-muted-foreground border-border hover:border-primary'
                            }`}
                        >
                            {s === 'All' ? 'All statuses' : s.toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <NoResult isLoading={isLoading} desc="No events match your filters" />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((event) => (
                        <EventCard key={event._id} event={event} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default EventsHub
