"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import useFetch from '@/hooks/useFetch'
import useMutate from '@/hooks/useMutate'
import NoResult from '@/components/NoResult'
import { apiGetContestants } from '@/services/AuthService'
import {
    apiAddContestant, apiDeleteContestant,
    apiGetVotePackages, apiCreateVotePackage,
    apiUpdateVotePackage, apiDeleteVotePackage,
} from '@/services/EventService'
import {
    IContestantsResponse, ICreateContestant,
    IVotePackage, IVotePackagesResponse,
    ICreateVotePackage, IUpdateVotePackage,
} from '@/interfaces'
import { formatNaira } from '@/lib/utils'
import { MdAdd, MdDelete, MdEdit, MdPackage } from 'react-icons/md'
import { toast } from 'react-toastify'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GOLD       = '#F5C518'
const GOLD_DARK  = '#a8893a'
const RED        = '#e53e3e'
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

const MEDALS = ['🥇', '🥈', '🥉']

const EMPTY_PACKAGE: Omit<ICreateVotePackage, 'eventId' | 'contestantId'> = {
    name: '', votes: 10, price: 450, description: '', totalSlots: 0,
}

interface Props { eventId: string }

export default function ContestantsTab({ eventId }: Props) {
    // ── Contestants ──────────────────────────────────────────
    const [showAddForm, setShowAddForm]     = useState(false)
    const [form, setForm]                   = useState<ICreateContestant>({
        event_id: eventId, fullname: '', nickname: '', image_url: '',
    })

    const { data, isLoading, refetch } = useFetch<IContestantsResponse>({
        api: apiGetContestants,
        key: ['CONTESTANTS', eventId],
        param: { id: eventId },
    })

    const addMutation = useMutate<ICreateContestant, unknown>(apiAddContestant, {
        onSuccess: () => {
            toast.success('Contestant added')
            setShowAddForm(false)
            setForm({ event_id: eventId, fullname: '', nickname: '', image_url: '' })
            refetch()
        },
        showErrorMessage: true,
    })

    const deleteMutation = useMutate<null, unknown>(apiDeleteContestant, {
        onSuccess: () => { toast.success('Contestant removed'); refetch() },
        showErrorMessage: true,
    })

    // ── Packages ─────────────────────────────────────────────
    const [activePkgContestant, setActivePkgContestant] = useState<string | null>(null)
    const [showPkgForm,  setShowPkgForm]  = useState(false)
    const [editingPkg,   setEditingPkg]   = useState<IVotePackage | null>(null)
    const [pkgForm, setPkgForm]           = useState<Omit<ICreateVotePackage, 'eventId' | 'contestantId'>>(EMPTY_PACKAGE)

    const {
        data: pkgData,
        isLoading: pkgLoading,
        refetch: refetchPkgs,
    } = useFetch<IVotePackagesResponse>({
        api: apiGetVotePackages,
        key: ['VOTE_PACKAGES', eventId, activePkgContestant ?? ''],
        param: { id: eventId, contestantId: activePkgContestant ?? undefined },
        enabled: !!activePkgContestant,
    })

    const createPkgMutation = useMutate<ICreateVotePackage, unknown>(apiCreateVotePackage, {
        onSuccess: () => {
            toast.success('Package created')
            setShowPkgForm(false)
            setPkgForm(EMPTY_PACKAGE)
            refetchPkgs()
        },
        showErrorMessage: true,
    })

    const updatePkgMutation = useMutate<IUpdateVotePackage, unknown>(apiUpdateVotePackage, {
        onSuccess: () => {
            toast.success('Package updated')
            setEditingPkg(null)
            setShowPkgForm(false)
            refetchPkgs()
        },
        showErrorMessage: true,
    })

    const deletePkgMutation = useMutate<null, unknown>(apiDeleteVotePackage, {
        onSuccess: () => { toast.success('Package removed'); refetchPkgs() },
        showErrorMessage: true,
    })

    const contestants  = data?.contestant  ?? []
    const costPerVote  = data?.cost_per_vote ?? 0
    const totalVotes   = contestants.reduce((s, c) => s + c.vote_count, 0)
    const grossRevenue = totalVotes * costPerVote
    const packages     = pkgData?.packages  ?? []

    const openPackages = (contestantId: string) => {
        setActivePkgContestant(prev => prev === contestantId ? null : contestantId)
        setShowPkgForm(false)
        setEditingPkg(null)
    }

    const startCreatePkg = (contestantId: string) => {
        setEditingPkg(null)
        setPkgForm(EMPTY_PACKAGE)
        setShowPkgForm(true)
        setActivePkgContestant(contestantId)
    }

    const startEditPkg = (pkg: IVotePackage) => {
        setEditingPkg(pkg)
        setPkgForm({
            name: pkg.name, votes: pkg.votes, price: pkg.price,
            description: pkg.description ?? '', totalSlots: pkg.totalSlots,
        })
        setShowPkgForm(true)
    }

    const savePkg = (contestantId: string) => {
        if (editingPkg) {
            updatePkgMutation.mutate(pkgForm, { id: editingPkg._id } as Parameters<typeof updatePkgMutation.mutate>[1])
        } else {
            createPkgMutation.mutate(
                { ...pkgForm, eventId, contestantId },
                { id: eventId } as Parameters<typeof createPkgMutation.mutate>[1]
            )
        }
    }

    if (isLoading) return <NoResult isLoading desc="Loading contestants…" />

    return (
        <div className="flex flex-col gap-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Total Votes</p>
                    <p className="text-2xl font-bold mt-1">{totalVotes.toLocaleString()}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Revenue</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: GREEN }}>{formatNaira(grossRevenue)}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Contestants</p>
                    <p className="text-2xl font-bold mt-1">{contestants.length}</p>
                </Card>
                <Card>
                    <p className="text-xs font-semibold uppercase" style={{ color: TEXT_LIGHT }}>Cost / Vote</p>
                    <p className="text-2xl font-bold mt-1">{formatNaira(costPerVote)}</p>
                </Card>
            </div>

            {/* Leaderboard + packages */}
            <Card>
                <SectionHeader
                    title={`Leaderboard · ${totalVotes.toLocaleString()} total votes`}
                    action={
                        <button
                            onClick={() => setShowAddForm(v => !v)}
                            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                            style={{ backgroundColor: GREEN }}
                        >
                            <MdAdd className="text-base" /> Add Contestant
                        </button>
                    }
                />

                {/* Add contestant form */}
                {showAddForm && (
                    <div className="rounded-xl p-4 mb-4 flex flex-col gap-3"
                         style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TEXT_MID }}>New Contestant</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Full Name</label>
                                <input type="text" placeholder="DJ Khalid"
                                       value={form.fullname}
                                       onChange={e => setForm(p => ({ ...p, fullname: e.target.value }))}
                                       className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                       style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Nickname</label>
                                <input type="text" placeholder="Khalid"
                                       value={form.nickname}
                                       onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                                       className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                       style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Photo URL</label>
                            <input type="url" placeholder="https://..."
                                   value={form.image_url}
                                   onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                                   className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                   style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => addMutation.mutate(form)}
                                    disabled={addMutation.isPending || !form.fullname || !form.nickname}
                                    className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                                    style={{ backgroundColor: GREEN }}>
                                {addMutation.isPending ? 'Saving…' : 'Add Contestant'}
                            </button>
                            <button onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 rounded-lg text-sm"
                                    style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {contestants.length === 0 && (
                    <p className="text-sm py-2" style={{ color: TEXT_LIGHT }}>No contestants yet. Add one above.</p>
                )}

                <div className="flex flex-col gap-4">
                    {contestants.map((c, i) => {
                        const pct         = totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100) : 0
                        const pkgsOpen    = activePkgContestant === c._id
                        const contestantPackages = pkgsOpen ? packages : []

                        return (
                            <div key={c._id}>
                                {/* Contestant row */}
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl w-8 text-center shrink-0">
                                        {i < 3
                                            ? MEDALS[i]
                                            : <span className="text-sm font-bold" style={{ color: TEXT_LIGHT }}>{i + 1}.</span>
                                        }
                                    </span>

                                    {c.image_url ? (
                                        <Image src={c.image_url} width={44} height={44} alt={c.fullname}
                                               className="rounded-full object-cover w-11 h-11 border-2 shrink-0"
                                               style={{ borderColor: i === 0 ? GOLD : BORDER }} />
                                    ) : (
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                                             style={{ backgroundColor: GREEN }}>
                                            {c.fullname.charAt(0)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: GREEN_DEEP }}>{c.fullname}</p>
                                                <p className="text-xs" style={{ color: TEXT_LIGHT }}>&#64;{c.nickname}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-black">{c.vote_count.toLocaleString()}</span>

                                                {/* Packages toggle */}
                                                <button
                                                    onClick={() => openPackages(c._id)}
                                                    title="Vote packages"
                                                    className="p-1.5 rounded-lg transition"
                                                    style={{
                                                        color:      pkgsOpen ? '#fff' : GOLD_DARK,
                                                        background: pkgsOpen ? GOLD_DARK : 'rgba(201,168,76,.1)',
                                                    }}>
                                                    <MdPackage className="text-base" />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Remove "${c.fullname}"?`)) {
                                                            deleteMutation.mutate(null, { id: c._id } as Parameters<typeof deleteMutation.mutate>[1])
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 transition"
                                                    style={{ color: RED }}>
                                                    <MdDelete className="text-base" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: BORDER }}>
                                                <div className="h-full rounded-full"
                                                     style={{
                                                         width: `${pct}%`,
                                                         backgroundColor: i === 0 ? GREEN : i === 1 ? GOLD : TEXT_LIGHT,
                                                     }} />
                                            </div>
                                            <span className="text-xs font-semibold w-8 text-right" style={{ color: TEXT_LIGHT }}>
                                                {pct}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Vote packages panel ──────────────────── */}
                                {pkgsOpen && (
                                    <div className="mt-3 ml-11 rounded-xl overflow-hidden"
                                         style={{ border: `1.5px solid rgba(201,168,76,.3)`, background: '#fffdf5' }}>

                                        <div className="flex items-center justify-between px-4 py-3"
                                             style={{ borderBottom: `1px solid rgba(201,168,76,.2)` }}>
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD_DARK }}>
                                                Vote Packages
                                            </span>
                                            <button
                                                onClick={() => startCreatePkg(c._id)}
                                                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white"
                                                style={{ backgroundColor: GOLD_DARK }}>
                                                <MdAdd /> Add Package
                                            </button>
                                        </div>

                                        {/* Create / edit form */}
                                        {showPkgForm && (activePkgContestant === c._id) && (
                                            <div className="p-4 flex flex-col gap-3"
                                                 style={{ borderBottom: `1px solid rgba(201,168,76,.2)`, backgroundColor: SURFACE }}>
                                                <p className="text-xs font-bold uppercase" style={{ color: TEXT_MID }}>
                                                    {editingPkg ? 'Edit Package' : 'New Package'}
                                                </p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Name</label>
                                                        <input type="text" placeholder='e.g. "Fan Pack"'
                                                               value={pkgForm.name}
                                                               onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))}
                                                               className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                                               style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Votes granted</label>
                                                        <input type="number" min={1} placeholder="10"
                                                               value={pkgForm.votes}
                                                               onChange={e => setPkgForm(p => ({ ...p, votes: Number(e.target.value) }))}
                                                               className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                                               style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Price (₦)</label>
                                                        <input type="number" min={0} placeholder="450"
                                                               value={pkgForm.price}
                                                               onChange={e => setPkgForm(p => ({ ...p, price: Number(e.target.value) }))}
                                                               className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                                               style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>
                                                            Slots <span className="font-normal" style={{ color: TEXT_LIGHT }}>(0 = ∞)</span>
                                                        </label>
                                                        <input type="number" min={0} placeholder="0"
                                                               value={pkgForm.totalSlots}
                                                               onChange={e => setPkgForm(p => ({ ...p, totalSlots: Math.max(0, Number(e.target.value)) }))}
                                                               className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                                               style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Description (optional)</label>
                                                    <input type="text" placeholder='e.g. "Support your favourite!"'
                                                           value={pkgForm.description ?? ''}
                                                           onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))}
                                                           className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                                           style={{ border: `1px solid ${BORDER}`, backgroundColor: '#fff' }} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => savePkg(c._id)}
                                                        disabled={createPkgMutation.isPending || updatePkgMutation.isPending || !pkgForm.name || pkgForm.votes < 1}
                                                        className="flex-1 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                                                        style={{ backgroundColor: GOLD_DARK }}>
                                                        {(createPkgMutation.isPending || updatePkgMutation.isPending) ? 'Saving…' : editingPkg ? 'Update' : 'Create Package'}
                                                    </button>
                                                    <button onClick={() => { setShowPkgForm(false); setEditingPkg(null) }}
                                                            className="px-4 py-2 rounded-lg text-sm"
                                                            style={{ border: `1px solid ${BORDER}`, color: TEXT_LIGHT }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Package list */}
                                        {pkgLoading && (
                                            <p className="text-sm px-4 py-3" style={{ color: TEXT_LIGHT }}>Loading packages…</p>
                                        )}
                                        {!pkgLoading && contestantPackages.length === 0 && (
                                            <p className="text-sm px-4 py-3" style={{ color: TEXT_LIGHT }}>
                                                No packages yet. Add one to offer vote bundles on the voting page.
                                            </p>
                                        )}
                                        <div className="divide-y" style={{ borderColor: 'rgba(201,168,76,.15)' }}>
                                            {contestantPackages.map(pkg => (
                                                <div key={pkg._id} className="flex items-center gap-3 px-4 py-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-bold">{pkg.name}</span>
                                                            {!pkg.active && (
                                                                <span className="text-xs px-1.5 py-0.5 rounded"
                                                                      style={{ background: '#fee2e2', color: RED }}>
                                                                    Inactive
                                                                </span>
                                                            )}
                                                            {pkg.isSoldOut && (
                                                                <span className="text-xs px-1.5 py-0.5 rounded"
                                                                      style={{ background: '#fee2e2', color: RED }}>
                                                                    Sold Out
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>
                                                            {pkg.votes} votes · {formatNaira(pkg.price)}
                                                            {pkg.totalSlots > 0 && ` · ${pkg.soldSlots}/${pkg.totalSlots} sold`}
                                                        </p>
                                                        {pkg.description && (
                                                            <p className="text-xs italic mt-0.5" style={{ color: TEXT_LIGHT }}>{pkg.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => startEditPkg(pkg)}
                                                                className="p-1.5 rounded-lg transition hover:bg-yellow-50"
                                                                style={{ color: GOLD_DARK }}>
                                                            <MdEdit className="text-sm" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Remove "${pkg.name}"? (Sets inactive)`)) {
                                                                    deletePkgMutation.mutate(null, { id: pkg._id } as Parameters<typeof deletePkgMutation.mutate>[1])
                                                                }
                                                            }}
                                                            className="p-1.5 rounded-lg transition hover:bg-red-50"
                                                            style={{ color: RED }}>
                                                            <MdDelete className="text-sm" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </Card>
        </div>
    )
}
