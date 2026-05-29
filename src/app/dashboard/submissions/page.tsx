"use client"
import React, { useState } from 'react'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import { apiGetAllSubmissions, apiExportSubmissionsCSV } from '@/services/AuthService'
import { IAllSubmissionsResponse, ISubmissionRow } from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import Link from 'next/link'
import {
    MdSearch, MdOutlineFileDownload, MdArticle,
    MdChevronLeft, MdChevronRight, MdClose,
} from 'react-icons/md'
import { toast } from 'react-toastify'
import { FieldValue } from '@/components/ImagePreview'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GOLD       = '#F5C518'
const SURFACE    = '#f4f8f4'
const BORDER     = '#d4e8d6'
const TEXT_LIGHT = '#6b8f70'
const TEXT_MID   = '#3d5c42'

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border rounded-2xl p-4 ${className}`} style={{ borderColor: BORDER }}>
        {children}
    </div>
)

function SubmissionRow({
    row,
    onView,
}: {
    row: ISubmissionRow
    onView: (row: ISubmissionRow) => void
}) {
    const nameField = row.fields.find((f) =>
        ['fullname', 'full_name', 'name', 'Full Name'].includes(f.name ?? f.label)
    )
    const displayName = nameField?.value
        ? String(nameField.value)
        : row.fields[0]?.value
            ? String(row.fields[0].value).slice(0, 30)
            : `Entry #${row.index}`
//tested
    return (
        <div
            className="flex items-center gap-3 py-3 cursor-pointer hover:bg-[#f4f8f4] -mx-4 px-4 rounded-lg transition"
            onClick={() => onView(row)}
        >
            <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: GREEN }}
            >
                {row.index}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: GREEN_DEEP }}>{displayName}</p>
                <p className="text-xs truncate" style={{ color: TEXT_LIGHT }}>
                    {row.formTitle || row.eventName} · {timeAgo(row.submittedAt)}
                </p>
            </div>
            <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: GREEN }}>
                    {formatNaira(row.pricePerEntry ?? 0)}
                </p>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                    {new Date(row.submittedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </p>
            </div>
        </div>
    )
}

function DetailPanel({
    row,
    onClose,
}: {
    row: ISubmissionRow
    onClose: () => void
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl z-10"
                style={{ border: `1px solid ${BORDER}` }}
            >
                <div
                    className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                    <div>
                        <p className="text-sm font-bold" style={{ color: GREEN_DEEP }}>Submission #{row.index}</p>
                        <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>
                            {row.formTitle} · {row.eventName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition"
                        style={{ color: TEXT_LIGHT }}
                    >
                        <MdClose className="text-xl" />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Meta */}
                    <div
                        className="rounded-xl px-4 py-3 flex items-center justify-between"
                        style={{ backgroundColor: SURFACE }}
                    >
                        <div>
                            <p className="text-xs" style={{ color: TEXT_LIGHT }}>Submitted</p>
                            <p className="text-sm font-semibold">
                                {new Date(row.submittedAt).toLocaleString('en-NG', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs" style={{ color: TEXT_LIGHT }}>Amount paid</p>
                            <p className="text-sm font-bold" style={{ color: GREEN }}>
                                {formatNaira(row.pricePerEntry ?? 0)}
                            </p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="flex flex-col gap-3">
                        {row.fields.map((f) => (
                            <div key={f.name}>
                                <p className="text-xs font-semibold mb-1" style={{ color: TEXT_MID }}>{f.label}</p>
                                <div
                                    className="rounded-xl px-4 py-3 text-sm"
                                    style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                                >
                                    <FieldValue value={f.value} type={f.type} label={f.label} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Open event link */}
                    {row.eventId && (
                        <Link
                            href={ROUTES.OWNER.EVENT(row.eventId)}
                            className="text-sm font-semibold text-center py-2 rounded-xl block transition"
                            style={{ border: `1.5px solid ${GREEN}`, color: GREEN }}
                            onClick={onClose}
                        >
                            View Event →
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function SubmissionsPage() {
    const token = useAuthStore((s) => s.token)

    const [page,         setPage]         = useState(1)
    const [search,       setSearch]       = useState('')
    const [activeSearch, setActiveSearch] = useState('')
    const [from,         setFrom]         = useState('')
    const [to,           setTo]           = useState('')
    const [filterEvent,  setFilterEvent]  = useState('')
    const [selected,     setSelected]     = useState<ISubmissionRow | null>(null)
    const [exporting,    setExporting]    = useState<string | null>(null)

    const { data, isLoading } = useFetch<IAllSubmissionsResponse>({
        api: apiGetAllSubmissions,
        key: ['ALL_SUBMISSIONS', page, activeSearch, from, to, filterEvent],
        param: {
            page,
            limit:   20,
            search:  activeSearch || undefined,
            from:    from         || undefined,
            to:      to           || undefined,
            eventId: filterEvent  || undefined,
        },
    })

    const handleSearch = () => { setPage(1); setActiveSearch(search) }

    const handleExport = async (eventId: string) => {
        setExporting(eventId)
        try {
            const res  = await apiExportSubmissionsCSV(token, {
                id:     eventId,
                search: activeSearch || undefined,
                from:   from         || undefined,
                to:     to           || undefined,
            })
            const blob  = new Blob([res.data], { type: 'text/csv' })
            const url   = URL.createObjectURL(blob)
            const a     = document.createElement('a')
            const cd    = (res.headers['content-disposition'] as string) ?? ''
            const fname = cd.match(/filename="?([^"]+)"?/)?.[1] ?? `submissions-${eventId}.csv`
            a.href = url; a.download = fname; a.click()
            URL.revokeObjectURL(url)
            toast.success('CSV downloaded')
        } catch {
            toast.error('Export failed')
        } finally {
            setExporting(null)
        }
    }

    const meta    = data?.meta
    const summary = data?.summary
    const events  = data?.events ?? []
    const rows    = data?.data   ?? []

    return (
        <div className="flex flex-col gap-5">
            <h1 className="text-xl font-bold" style={{ color: GREEN_DEEP }}>All Submissions</h1>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Total</p>
                        <p className="text-2xl font-bold mt-1">{summary.totalSubmissions}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>
                            {formatNaira(summary.totalRevenue)}
                        </p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Forms Active</p>
                        <p className="text-2xl font-bold mt-1">{summary.eventsWithForms}</p>
                    </Card>
                </div>
            )}

            {/* Events breakdown */}
            {events.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => { setFilterEvent(''); setPage(1) }}
                        className="text-xs px-3 py-1.5 rounded-full font-medium border transition"
                        style={{
                            backgroundColor: !filterEvent ? GREEN : 'transparent',
                            color:           !filterEvent ? '#fff' : TEXT_LIGHT,
                            borderColor:     !filterEvent ? GREEN  : BORDER,
                        }}
                    >
                        All events
                    </button>
                    {events.map((e) => (
                        <button
                            key={String(e._id)}
                            onClick={() => { setFilterEvent(String(e._id)); setPage(1) }}
                            className="text-xs px-3 py-1.5 rounded-full font-medium border transition flex items-center gap-1.5"
                            style={{
                                backgroundColor: filterEvent === String(e._id) ? GREEN : 'transparent',
                                color:           filterEvent === String(e._id) ? '#fff' : TEXT_MID,
                                borderColor:     filterEvent === String(e._id) ? GREEN  : BORDER,
                            }}
                        >
                            <MdArticle className="text-sm" />
                            {e.eventName}
                            <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                    backgroundColor: filterEvent === String(e._id) ? 'rgba(255,255,255,0.3)' : SURFACE,
                                    color:           filterEvent === String(e._id) ? '#fff' : TEXT_LIGHT,
                                }}
                            >
                                {e.count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Filters */}
            <Card>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div
                            className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl"
                            style={{ border: `1.5px solid ${BORDER}`, backgroundColor: SURFACE }}
                        >
                            <MdSearch className="text-lg shrink-0" style={{ color: TEXT_LIGHT }} />
                            <input
                                type="text"
                                placeholder="Search submissions…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1 text-sm bg-transparent outline-none"
                                style={{ color: GREEN_DEEP }}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{ backgroundColor: GREEN }}
                        >
                            Search
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block" style={{ color: TEXT_MID }}>From</label>
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => { setFrom(e.target.value); setPage(1) }}
                                className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                                style={{ border: `1.5px solid ${BORDER}`, backgroundColor: SURFACE, color: GREEN_DEEP }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium mb-1 block" style={{ color: TEXT_MID }}>To</label>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => { setTo(e.target.value); setPage(1) }}
                                className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                                style={{ border: `1.5px solid ${BORDER}`, backgroundColor: SURFACE, color: GREEN_DEEP }}
                            />
                        </div>
                        {(from || to || activeSearch || filterEvent) && (
                            <button
                                onClick={() => {
                                    setSearch(''); setActiveSearch(''); setFrom('')
                                    setTo(''); setFilterEvent(''); setPage(1)
                                }}
                                className="self-end px-3 py-2 rounded-xl text-xs font-medium"
                                style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* List */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>
                        {meta ? `${meta.total} results` : 'Submissions'}
                    </h3>
                    {/* Per-event export buttons */}
                    {filterEvent && events.find((e) => String(e._id) === filterEvent) && (
                        <button
                            onClick={() => handleExport(filterEvent)}
                            disabled={!!exporting}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition disabled:opacity-50"
                            style={{ borderColor: GREEN, color: GREEN }}
                        >
                            <MdOutlineFileDownload className="text-base" />
                            {exporting === filterEvent ? 'Exporting…' : 'Export CSV'}
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-sm py-6 text-center" style={{ color: TEXT_LIGHT }}>Loading…</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: TEXT_LIGHT }}>
                        {activeSearch || from || to ? 'No submissions match your filters.' : 'No form submissions yet.'}
                    </p>
                ) : (
                    <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                        {rows.map((row) => (
                            <SubmissionRow key={row._id} row={row} onView={setSelected} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                            style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}
                        >
                            <MdChevronLeft /> Prev
                        </button>
                        <span className="text-sm font-semibold" style={{ color: GREEN_DEEP }}>
                            {page} / {meta.pages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                            disabled={page === meta.pages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                            style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}
                        >
                            Next <MdChevronRight />
                        </button>
                    </div>
                )}
            </Card>

            {selected && (
                <DetailPanel row={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    )
}
