"use client"

import Link from 'next/link'
import { useState } from 'react'
import { MdArrowForward, MdGridView, MdTableRows } from 'react-icons/md'
import NoResult from '@/components/NoResult'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import { ROUTES } from '@/constants/routes'
import { apiGetFormsByOwner } from '@/services/EventService'
import { apiGetEvents } from '@/services/AuthService'
import { IEventResponse } from '@/interfaces'
import { IForm, IFormsListResponse } from '@/interfaces/forms'
import { Card, SectionTitle, FormStatusBadge, formatFormDate, getPriceLabel, fieldCount } from './shared'

const FormsClient = () => {
    const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING'>('ALL')
    const [view, setView] = useState<'card' | 'table'>('card')

    const { data, isLoading, isFetching } = useFetch<IFormsListResponse>({
        api: apiGetFormsByOwner,
        key: ['forms', 'owner'],
        requireAuth: true,
    })

    // Forms only carry eventId — join against the owner's events for a
    // human-readable name instead of a bare ObjectId.
    const { data: eventsData } = useFetch<IEventResponse>({
        api: apiGetEvents,
        key: ['events', 'my-event-list'],
        requireAuth: true,
    })

    const eventNameById = new Map((eventsData?.myEvent ?? []).map((e) => [e._id, e.eventName]))

    const forms: IForm[] = data?.data ?? []
    const filtered = forms.filter((f) => {
        if (status === 'ACTIVE') return f.active
        if (status === 'PENDING') return !f.active
        return true
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d7e6d6] bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ef_55%,#edf7ee_100%)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2">
                    <span className="inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2d8c3e]">
                        Form Sales
                    </span>
                    <SectionTitle
                        title="Forms"
                        subtitle="Every form created from your event submissions — edit fields and steps, grab the share link, and review responses."
                    />
                </div>
            </div>

            <Card className="p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        Status
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as typeof status)}
                            className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]"
                        >
                            <option value="ALL">All forms</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PENDING">Pending / Inactive</option>
                        </select>
                    </label>
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-slate-500">
                            {isFetching ? 'Refreshing…' : `${filtered.length} form${filtered.length === 1 ? '' : 's'} loaded`}
                        </p>
                        <div className="flex items-center rounded-xl border border-[#d7e6d6] p-1">
                            <button
                                onClick={() => setView('card')}
                                aria-label="Card view"
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${view === 'card' ? 'bg-[#2d8c3e] text-white' : 'text-slate-500'}`}
                            >
                                <MdGridView className="text-base" /> Cards
                            </button>
                            <button
                                onClick={() => setView('table')}
                                aria-label="Table view"
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${view === 'table' ? 'bg-[#2d8c3e] text-white' : 'text-slate-500'}`}
                            >
                                <MdTableRows className="text-base" /> Table
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {filtered.length === 0 ? (
                <NoResult
                    isLoading={isLoading}
                    desc="No forms match the selected filter yet. Forms are created when you submit a Form Sales event from the i-sabi app."
                />
            ) : view === 'table' ? (
                <Card className="overflow-x-auto p-0">
                    <table className="w-full min-w-[700px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-[#ecf2eb] text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="py-3 pl-5 pr-4">Title</th>
                                <th className="py-3 pr-4">Event</th>
                                <th className="py-3 pr-4">Status</th>
                                <th className="py-3 pr-4">Price</th>
                                <th className="py-3 pr-4">Fields</th>
                                <th className="py-3 pr-4">Created</th>
                                <th className="py-3 pr-5" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((form) => (
                                <tr key={form._id} className="border-b border-[#f3f6f2]">
                                    <td className="py-3 pl-5 pr-4 font-medium text-slate-900">{form.title}</td>
                                    <td className="py-3 pr-4 text-slate-500">{eventNameById.get(form.eventId) || 'Event'}</td>
                                    <td className="py-3 pr-4"><FormStatusBadge active={form.active} /></td>
                                    <td className="py-3 pr-4 text-slate-500">{getPriceLabel(form)}</td>
                                    <td className="py-3 pr-4 text-slate-500">{fieldCount(form)}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap text-slate-500">{formatFormDate(form.createdAt)}</td>
                                    <td className="py-3 pr-5 whitespace-nowrap">
                                        <Button asChild variant="outline" size="sm" className="rounded-full">
                                            <Link href={ROUTES.OWNER.FORMS.DETAIL(form._id)}>
                                                Manage <MdArrowForward className="text-base" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {filtered.map((form) => (
                        <Card key={form._id} className="overflow-hidden">
                            <div className="border-b border-[#ecf2eb] p-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <FormStatusBadge active={form.active} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">{form.title}</h3>
                                            <p className="text-sm text-slate-500">
                                                {eventNameById.get(form.eventId) || 'Event'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left text-sm text-slate-500 md:text-right">
                                        <p>Created {formatFormDate(form.createdAt)}</p>
                                        <p>{getPriceLabel(form)} · {fieldCount(form)} field{fieldCount(form) === 1 ? '' : 's'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 p-5">
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href={ROUTES.OWNER.FORMS.DETAIL(form._id)}>
                                        Manage
                                        <MdArrowForward className="text-base" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default FormsClient
