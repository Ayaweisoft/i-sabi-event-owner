"use client"
import React, { useState } from 'react'
import useFetch from '@/hooks/useFetch'
import useMutate from '@/hooks/useMutate'
import ProgressBar from '@/components/ProgressBar'
import {
    apiGetCheckinStats,
    apiGetCheckinAttendees,
    apiGetCheckinPins,
    apiGetCheckinTrend,
} from '@/services/AuthService'
import { apiAddPin, apiRemovePin, apiReplaceAllPins } from '@/services/EventService'
import {
    ICheckinStats, IAttendeesResponse, IPinsResponse, ICheckinTrend,
} from '@/interfaces'
import { toast } from 'react-toastify'
import { MdCheckCircle, MdPending, MdAdd, MdDelete, MdRefresh } from 'react-icons/md'
import { BsCircleFill } from 'react-icons/bs'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const SURFACE    = '#f4f8f4'
const BORDER     = '#d4e8d6'
const TEXT_LIGHT = '#6b8f70'
const TEXT_MID   = '#3d5c42'

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

export default function CheckinTab({ eventId }: Props) {
    const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked' | 'pending'>('all')
    const [newPin, setNewPin] = useState('')
    const [showBulkReplace, setShowBulkReplace] = useState(false)
    const [bulkPins, setBulkPins] = useState('')

    const {
        data: stats,
        isLoading: statsLoading,
        refetch: refetchStats,
    } = useFetch<ICheckinStats>({
        api: apiGetCheckinStats,
        key: ['CHECKIN_STATS', eventId],
        param: { id: eventId },
    })

    const {
        data: attendees,
        isLoading: attendeesLoading,
        refetch: refetchAttendees,
    } = useFetch<IAttendeesResponse>({
        api: apiGetCheckinAttendees,
        key: ['ATTENDEES', eventId, attendeeFilter],
        param: { id: eventId, status: attendeeFilter },
    })

    const {
        data: pinsData,
        refetch: refetchPins,
    } = useFetch<IPinsResponse>({
        api: apiGetCheckinPins,
        key: ['PINS', eventId],
        param: { id: eventId },
    })

    const { data: trendData } = useFetch<ICheckinTrend>({
        api: apiGetCheckinTrend,
        key: ['CHECKIN_TREND_H', eventId],
        param: { id: eventId, period: 'hourly' },
    })

    const addPinMutation = useMutate<{ pin: string }, unknown>(apiAddPin, {
        id: eventId,
        onSuccess: () => {
            toast.success('PIN added')
            setNewPin('')
            refetchPins()
        },
        showErrorMessage: true,
    })

    const removePinMutation = useMutate<{ pin: string }, unknown>(apiRemovePin, {
        id: eventId,
        onSuccess: () => {
            toast.success('PIN removed')
            refetchPins()
        },
        showErrorMessage: true,
    })

    const replaceAllMutation = useMutate<{ pins: string[] }, unknown>(apiReplaceAllPins, {
        id: eventId,
        onSuccess: () => {
            toast.success('PINs updated')
            setShowBulkReplace(false)
            setBulkPins('')
            refetchPins()
        },
        showErrorMessage: true,
    })

    const handleAddPin = () => {
        const pin = newPin.trim()
        if (!pin) return
        addPinMutation.mutate({ pin })
    }

    const handleBulkReplace = () => {
        const pins = bulkPins.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean)
        if (pins.length === 0) return
        replaceAllMutation.mutate({ pins })
    }

    const pins = pinsData?.pins ?? []

    return (
        <div className="flex flex-col gap-4">
            {/* Live attendance */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>
                        Live Attendance
                    </h3>
                    <button
                        onClick={() => { refetchStats(); refetchAttendees() }}
                        className="p-1.5 rounded-lg transition hover:bg-muted"
                        style={{ color: TEXT_LIGHT }}
                    >
                        <MdRefresh className="text-base" />
                    </button>
                </div>
                {statsLoading ? (
                    <p className="text-sm" style={{ color: TEXT_LIGHT }}>Loading…</p>
                ) : stats ? (
                    <>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black" style={{ color: GREEN }}>{stats.checkedIn}</span>
                            <span className="text-base font-semibold mb-1" style={{ color: TEXT_LIGHT }}>
                                checked in of {stats.totalSeats} sold
                            </span>
                        </div>
                        <ProgressBar value={stats.percentFull} showLabel />
                        <div className="flex gap-6 mt-3">
                            <div>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>Checked in</p>
                                <p className="text-lg font-bold" style={{ color: GREEN }}>{stats.checkedIn}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>Remaining</p>
                                <p className="text-lg font-bold" style={{ color: '#e74c3c' }}>{stats.remaining}</p>
                            </div>
                            <div>
                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>Capacity</p>
                                <p className="text-lg font-bold">{stats.totalSeats}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm" style={{ color: TEXT_LIGHT }}>No check-in data yet.</p>
                )}
            </Card>

            {/* Hourly trend */}
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

            {/* PIN management */}
            <Card>
                <SectionHeader
                    title={`Check-in PINs (${pins.length} active)`}
                    action={
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowBulkReplace((v) => !v)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition"
                                style={{ borderColor: BORDER, color: TEXT_MID }}
                            >
                                Replace all
                            </button>
                        </div>
                    }
                />

                {/* Bulk replace form */}
                {showBulkReplace && (
                    <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                        <p className="text-xs mb-2" style={{ color: TEXT_MID }}>
                            Enter PINs separated by commas or spaces (replaces all existing PINs)
                        </p>
                        <textarea
                            rows={2}
                            placeholder="1234, 5678, 9012"
                            value={bulkPins}
                            onChange={(e) => setBulkPins(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                            style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleBulkReplace}
                                disabled={replaceAllMutation.isPending || !bulkPins.trim()}
                                className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                                style={{ backgroundColor: GREEN }}
                            >
                                {replaceAllMutation.isPending ? 'Saving…' : 'Save PINs'}
                            </button>
                            <button
                                onClick={() => setShowBulkReplace(false)}
                                className="px-4 py-2 rounded-lg text-sm"
                                style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Add PIN */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Enter new PIN…"
                        value={newPin}
                        maxLength={8}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddPin()}
                        className="flex-1 px-3 py-2.5 text-sm rounded-xl outline-none"
                        style={{ border: `1.5px solid ${BORDER}`, backgroundColor: SURFACE }}
                    />
                    <button
                        onClick={handleAddPin}
                        disabled={addPinMutation.isPending || !newPin.trim()}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                        style={{ backgroundColor: GREEN }}
                    >
                        <MdAdd className="text-base" />
                        {addPinMutation.isPending ? '…' : 'Add'}
                    </button>
                </div>

                {/* PIN list */}
                {pins.length === 0 ? (
                    <div className="rounded-xl px-4 py-3 text-sm border border-red-200 bg-red-50 text-red-700">
                        ⚠️ No check-in PINs set. Gate staff cannot scan tickets without a PIN.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {pins.map((pin) => (
                            <div
                                key={pin}
                                className="flex items-center justify-between px-4 py-3 rounded-xl"
                                style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                            >
                                <div className="flex items-center gap-3">
                                    <BsCircleFill className="text-[8px]" style={{ color: GREEN }} />
                                    <span className="text-base font-bold tracking-widest" style={{ color: GREEN_DEEP }}>
                                        {pin}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removePinMutation.mutate({ pin })}
                                    disabled={removePinMutation.isPending}
                                    className="p-1.5 rounded-lg hover:bg-red-50 transition"
                                    style={{ color: '#e74c3c' }}
                                >
                                    <MdDelete className="text-base" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Attendees */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>
                        Attendees {attendees?.total != null ? `(${attendees.total})` : ''}
                    </h3>
                    <div className="flex gap-1">
                        {(['all', 'checked', 'pending'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setAttendeeFilter(f)}
                                className="text-xs px-2.5 py-1.5 rounded-full border font-medium transition"
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

                {attendeesLoading && (
                    <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>Loading attendees…</p>
                )}
                {!attendeesLoading && !attendees?.tickets?.length && (
                    <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>No attendees match this filter.</p>
                )}

                <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                    {attendees?.tickets?.slice(0, 50).map((a, i) => {
                        const checkedIn = (a.numberOfTicketUsed || 0) > 0
                        return (
                            <div key={i} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: GREEN_DEEP }}>{a.name}</p>
                                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                        {a.ticketType} × {a.numberOfTicket}
                                        {a.email ? ` · ${a.email}` : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    {checkedIn ? (
                                        <>
                                            <p className="text-xs font-bold flex items-center gap-1 justify-end" style={{ color: GREEN }}>
                                                <MdCheckCircle /> Checked in
                                            </p>
                                            <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                                                {a.checkedInAt
                                                    ? new Date(a.checkedInAt).toLocaleTimeString('en-NG', {
                                                        hour: '2-digit', minute: '2-digit',
                                                      })
                                                    : ''}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs flex items-center gap-1 justify-end" style={{ color: TEXT_LIGHT }}>
                                            <MdPending /> Pending
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {(attendees?.total ?? 0) > 50 && (
                    <p className="text-xs text-center mt-3" style={{ color: TEXT_LIGHT }}>
                        Showing 50 of {attendees!.total} attendees
                    </p>
                )}
            </Card>
        </div>
    )
}
