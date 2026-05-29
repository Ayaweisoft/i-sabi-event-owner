"use client"
import React, { useState } from 'react'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import {
    apiGetEventSubmissions,
    apiGetSubmissionDetail,
    apiExportSubmissionsCSV,
} from '@/services/AuthService'
import {
    IEventSubmissionsResponse,
    ISubmissionDetail,
    ISubmissionRow,
} from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { MdSearch, MdOutlineFileDownload, MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md'
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

// ── Detail Modal ──────────────────────────────────────────────────────────────
function SubmissionModal({
    eventId,
    submissionId,
    onClose,
}: {
    eventId: string
    submissionId: string
    onClose: () => void
}) {
    const { data, isLoading } = useFetch<ISubmissionDetail>({
        api: apiGetSubmissionDetail,
        key: ['SUB_DETAIL', eventId, submissionId],
        param: { id: eventId, submissionId },
    })

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl z-10"
                style={{ border: `1px solid ${BORDER}` }}
            >
                <div
                    className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                    <div>
                        <h3 className="text-sm font-bold" style={{ color: GREEN_DEEP }}>
                            Submission Detail
                        </h3>
                        {data?.form && (
                            <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>{data.form.title}</p>
                        )}
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
                    {isLoading ? (
                        <p className="text-sm text-center py-8" style={{ color: TEXT_LIGHT }}>Loading…</p>
                    ) : !data ? (
                        <p className="text-sm text-center py-8" style={{ color: TEXT_LIGHT }}>Submission not found.</p>
                    ) : (
                        <>
                            {/* Meta */}
                            <div
                                className="rounded-xl px-4 py-3 flex items-center justify-between"
                                style={{ backgroundColor: SURFACE }}
                            >
                                <div>
                                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>Submitted</p>
                                    <p className="text-sm font-semibold">
                                        {new Date(data.submittedAt).toLocaleString('en-NG', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                {data.form?.price && (
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: TEXT_LIGHT }}>Amount paid</p>
                                        <p className="text-sm font-bold" style={{ color: GREEN }}>
                                            {formatNaira(data.form.price)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Fields */}
                            <div className="flex flex-col gap-3">
                                {data.fields.map((f) => (
                                    <div key={f.name}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: TEXT_MID }}>
                                            {f.label}
                                        </p>
                                        <div
                                            className="rounded-xl px-4 py-3 text-sm"
                                            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
                                        >
                                            <FieldValue
                                                value={f.value}
                                                type={f.type}
                                                label={f.label}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Row component ─────────────────────────────────────────────────────────────
function SubmissionRow({
    row,
    pricePerEntry,
    onView,
}: {
    row: ISubmissionRow
    pricePerEntry: number
    onView: (id: string) => void
}) {
    const nameField = row.fields.find((f) =>
        ['fullname', 'full_name', 'name', 'Full Name'].includes(f.name ?? f.label)
    )
    const displayName = nameField?.value
        ? String(nameField.value)
        : row.fields[0]?.value
            ? String(row.fields[0].value).slice(0, 30)
            : `Entry #${row.index}`

    return (
        <div
            className="flex items-center justify-between py-3 cursor-pointer hover:bg-[#f4f8f4] -mx-4 px-4 rounded-lg transition"
            onClick={() => onView(row._id)}
        >
            <div className="flex items-center gap-3">
                <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: GREEN }}
                >
                    {row.index}
                </span>
                <div>
                    <p className="text-sm font-semibold" style={{ color: GREEN_DEEP }}>{displayName}</p>
                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                        {timeAgo(row.submittedAt)} · {row.fields.length} field{row.fields.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
            <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold" style={{ color: GREEN }}>
                    {formatNaira(pricePerEntry)}
                </p>
                <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                    {new Date(row.submittedAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                    })}
                </p>
            </div>
        </div>
    )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
interface Props { eventId: string }

export default function SubmissionsTab({ eventId }: Props) {
    const token = useAuthStore((s) => s.token)

    const [page,   setPage]   = useState(1)
    const [search, setSearch] = useState('')
    const [from,   setFrom]   = useState('')
    const [to,     setTo]     = useState('')
    const [activeSearch, setActiveSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)

    const { data, isLoading } = useFetch<IEventSubmissionsResponse>({
        api: apiGetEventSubmissions,
        key: ['EVENT_SUBMISSIONS', eventId, page, activeSearch, from, to],
        param: { id: eventId, page, limit: 20, search: activeSearch || undefined, from: from || undefined, to: to || undefined },
    })

    const handleSearch = () => {
        setPage(1)
        setActiveSearch(search)
    }

    const handleExport = async () => {
        setExporting(true)
        try {
            const res = await apiExportSubmissionsCSV(token, {
                id: eventId,
                search: activeSearch || undefined,
                from:   from || undefined,
                to:     to   || undefined,
            })
            const blob = new Blob([res.data], { type: 'text/csv' })
            const url  = URL.createObjectURL(blob)
            const a    = document.createElement('a')
            const cd   = (res.headers['content-disposition'] as string) ?? ''
            const fname = cd.match(/filename="?([^"]+)"?/)?.[1] ?? `submissions-${eventId}.csv`
            a.href = url
            a.download = fname
            a.click()
            URL.revokeObjectURL(url)
            toast.success('CSV downloaded')
        } catch {
            toast.error('Export failed')
        } finally {
            setExporting(false)
        }
    }

    const form         = data?.form
    const meta         = data?.meta
    const summary      = data?.summary
    const rows         = data?.data ?? []
    const pricePerEntry = summary?.pricePerEntry ?? 0

    return (
        <div className="flex flex-col gap-4">
            {/* Form info */}
            {form && (
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold" style={{ color: GREEN_DEEP }}>{form.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>
                                {form.fieldCount} field{form.fieldCount !== 1 ? 's' : ''} · {formatNaira(form.price)} per entry
                            </p>
                        </div>
                        <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={{
                                backgroundColor: form.active ? '#dcfce7' : '#f3f4f6',
                                color: form.active ? '#15803d' : '#6b7280',
                            }}
                        >
                            {form.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </Card>
            )}

            {/* Summary stats */}
            {summary && (
                <div className="grid grid-cols-3 gap-3">
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Submissions</p>
                        <p className="text-2xl font-bold mt-1">{summary.totalSubmissions}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(summary.revenue)}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Per Entry</p>
                        <p className="text-2xl font-bold mt-1">{formatNaira(pricePerEntry)}</p>
                    </Card>
                </div>
            )}

            {/* Filters + export */}
            <Card>
                <div className="flex flex-col gap-3">
                    {/* Search */}
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

                    {/* Date range */}
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
                        {(from || to || activeSearch) && (
                            <button
                                onClick={() => { setSearch(''); setActiveSearch(''); setFrom(''); setTo(''); setPage(1) }}
                                className="self-end px-3 py-2 rounded-xl text-xs font-medium"
                                style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Export */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleExport}
                            disabled={exporting || !rows.length}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                            style={{ border: `1.5px solid ${GREEN}`, color: GREEN, backgroundColor: 'transparent' }}
                        >
                            <MdOutlineFileDownload className="text-base" />
                            {exporting ? 'Exporting…' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Submissions list */}
            <Card>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: TEXT_LIGHT }}>
                        {meta ? `${meta.total} submissions` : 'Submissions'}
                    </h3>
                    {meta && meta.pages > 1 && (
                        <span className="text-xs" style={{ color: TEXT_LIGHT }}>
                            Page {meta.page} of {meta.pages}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-sm py-6 text-center" style={{ color: TEXT_LIGHT }}>Loading submissions…</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: TEXT_LIGHT }}>
                        {activeSearch || from || to ? 'No submissions match your filters.' : 'No submissions yet.'}
                    </p>
                ) : (
                    <div className="flex flex-col divide-y" style={{ borderColor: BORDER }}>
                        {rows.map((row) => (
                            <SubmissionRow
                                key={row._id}
                                row={row}
                                pricePerEntry={pricePerEntry}
                                onView={setSelectedId}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.pages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition"
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition"
                            style={{ border: `1px solid ${BORDER}`, color: TEXT_MID }}
                        >
                            Next <MdChevronRight />
                        </button>
                    </div>
                )}
            </Card>

            {/* Detail modal */}
            {selectedId && (
                <SubmissionModal
                    eventId={eventId}
                    submissionId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    )
}
