"use client"

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'react-toastify'
import { MdAdd, MdEdit, MdDeleteOutline, MdClose, MdCloudUpload, MdImage } from 'react-icons/md'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import { apiGetEvents } from '@/services/AuthService'
import {
    apiCreateEventGroup, apiGetMyEventGroups, apiUpdateEventGroup, apiDeleteEventGroup,
} from '@/services/EventService'
import { IEventResponse, IEventGroupsResponse, IEventGroup, ICreateEventGroup } from '@/interfaces'
import { uploadImageToCloudinary } from '@/lib/cloudinaryUpload'
import { Card, SectionTitle, formatGroupDate } from './shared'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const BORDER     = '#d7e6d6'
const TEXT_LIGHT = '#6b8f70'

const extractErrorMessage = (error: unknown, fallback: string) => {
    const data = (error as { response?: { data?: { message?: string | string[]; error?: string } } })?.response?.data
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message)) return data.message[0]
    if (typeof data?.error === 'string') return data.error
    return fallback
}

const emptyForm: ICreateEventGroup = { name: '', eventIds: [], image_url: '', description: '' }

// "Classic" — a thin bundle of the owner's own events (any mix of
// ticketing/voting/forms) behind one identifier. The unified public viewer
// page that will render a group's slug isn't built yet (a separate,
// larger, infrastructure-touching project) — this panel manages the
// bundle itself, ahead of that.
const GroupsClient = () => {
    const token = useAuthStore((s) => s.token)

    const { data: groupsData, isLoading, refetch } = useFetch<IEventGroupsResponse>({
        api: apiGetMyEventGroups,
        key: ['event-groups', 'mine'],
        requireAuth: true,
    })
    const { data: eventsData } = useFetch<IEventResponse>({
        api: apiGetEvents,
        key: ['events', 'my-event-list'],
        requireAuth: true,
    })

    const myEvents = (eventsData?.myEvent ?? []).filter((e) => e.status === 'APPROVED')
    const groups = groupsData?.groups ?? []
    const eventNameById = new Map(myEvents.map((e) => [e._id, e.eventName]))

    const [editingId, setEditingId] = useState<string | null>(null) // null = closed, 'new' = creating, else = editing that group's _id
    const [form, setForm] = useState<ICreateEventGroup>(emptyForm)
    const [busy, setBusy] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const startCreate = () => { setForm(emptyForm); setEditingId('new') }
    const startEdit = (group: IEventGroup) => {
        setForm({ name: group.name, eventIds: group.eventIds, image_url: group.image_url || '', description: group.description || '' })
        setEditingId(group._id)
    }
    const cancel = () => { setEditingId(null); setForm(emptyForm) }

    const handleImagePick = async (file: File | undefined) => {
        if (!file) return
        setUploading(true)
        try {
            const url = await uploadImageToCloudinary(file)
            setForm((p) => ({ ...p, image_url: url }))
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Image upload failed')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const toggleEvent = (id: string) => {
        setForm((p) => ({
            ...p,
            eventIds: p.eventIds.includes(id) ? p.eventIds.filter((e) => e !== id) : [...p.eventIds, id],
        }))
    }

    const save = async () => {
        if (!token || !editingId) return
        if (!form.name.trim()) { toast.error('Name is required'); return }
        if (form.eventIds.length === 0) { toast.error('Pick at least one event'); return }
        setBusy(true)
        try {
            if (editingId === 'new') {
                await apiCreateEventGroup(form, { token })
                toast.success('Group created')
            } else {
                await apiUpdateEventGroup(form, { id: editingId, token })
                toast.success('Group updated')
            }
            cancel()
            refetch()
        } catch (error) {
            toast.error(extractErrorMessage(error, 'Something went wrong'))
        } finally {
            setBusy(false)
        }
    }

    const remove = async (id: string) => {
        if (!token) return
        if (!window.confirm('Remove this group? The underlying events are never touched — only the bundle is removed.')) return
        setBusy(true)
        try {
            await apiDeleteEventGroup(null, { id, token })
            toast.success('Group removed')
            refetch()
        } catch (error) {
            toast.error(extractErrorMessage(error, 'Something went wrong'))
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d7e6d6] bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ef_55%,#edf7ee_100%)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2">
                    <span className="inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2d8c3e]">
                        Classic
                    </span>
                    <SectionTitle
                        title="Event Groups"
                        subtitle="Bundle your own related events — ticketing, voting, forms, any mix — behind one identifier so viewers can move between them in one place."
                    />
                </div>
                {editingId === null && (
                    <button
                        onClick={startCreate}
                        className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-white shrink-0"
                        style={{ background: GREEN }}
                    >
                        <MdAdd /> New Group
                    </button>
                )}
            </div>

            {editingId !== null && (
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold" style={{ color: GREEN_DEEP }}>
                            {editingId === 'new' ? 'New Event Group' : 'Edit Event Group'}
                        </h3>
                        <button onClick={cancel} style={{ color: TEXT_LIGHT }}><MdClose /></button>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Homecoming Weekend"
                                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                style={{ border: `1px solid ${BORDER}` }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Description (optional)</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                                style={{ border: `1px solid ${BORDER}` }}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>Cover image (optional)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImagePick(e.target.files?.[0])}
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center disabled:opacity-60"
                                    style={{ border: `1.5px dashed ${BORDER}`, background: '#f4f8f4' }}
                                >
                                    {form.image_url ? (
                                        <Image src={form.image_url} alt="Cover" fill className="object-cover" unoptimized />
                                    ) : (
                                        <MdImage className="text-2xl" style={{ color: TEXT_LIGHT }} />
                                    )}
                                </button>
                                <div className="flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
                                        style={{ color: GREEN, background: 'rgba(45,140,62,.1)' }}
                                    >
                                        <MdCloudUpload className="text-sm" />
                                        {uploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}
                                    </button>
                                    {form.image_url && !uploading && (
                                        <button
                                            type="button"
                                            onClick={() => setForm((p) => ({ ...p, image_url: '' }))}
                                            className="text-xs font-medium text-left"
                                            style={{ color: TEXT_LIGHT }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block" style={{ color: GREEN_DEEP }}>
                                Events in this group ({form.eventIds.length} selected)
                            </label>
                            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto rounded-lg p-2" style={{ border: `1px solid ${BORDER}` }}>
                                {myEvents.length === 0 && (
                                    <p className="text-xs py-2" style={{ color: TEXT_LIGHT }}>No approved events yet.</p>
                                )}
                                {myEvents.map((e) => (
                                    <label key={e._id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#f4f8f4]">
                                        <input
                                            type="checkbox"
                                            checked={form.eventIds.includes(e._id)}
                                            onChange={() => toggleEvent(e._id)}
                                        />
                                        <span className="text-sm flex-1 truncate">{e.eventName}</span>
                                        <span className="text-xs capitalize" style={{ color: TEXT_LIGHT }}>{e.type.toLowerCase().replace('-', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={save}
                            disabled={busy || uploading}
                            className="mt-1 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                            style={{ background: GREEN }}
                        >
                            {busy ? 'Saving…' : editingId === 'new' ? 'Create Group' : 'Save Changes'}
                        </button>
                    </div>
                </Card>
            )}

            {!isLoading && groups.length === 0 && editingId === null && (
                <Card className="p-8 text-center">
                    <p className="text-sm" style={{ color: TEXT_LIGHT }}>
                        No event groups yet. Bundle related events — like a festival&apos;s ticketing, its talent-show voting, and a
                        registration form — behind one group so viewers can find them all in one place.
                    </p>
                </Card>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
                {groups.map((group) => (
                    <Card key={group._id} className="overflow-hidden">
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div
                                        className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                                        style={{ background: '#f4f8f4', border: `1px solid ${BORDER}` }}
                                    >
                                        {group.image_url ? (
                                            <Image src={group.image_url} alt={group.name} fill className="object-cover" unoptimized />
                                        ) : (
                                            <MdImage className="text-lg" style={{ color: TEXT_LIGHT }} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-semibold text-slate-900 truncate">{group.name}</h3>
                                        <p className="text-xs mt-0.5" style={{ color: TEXT_LIGHT }}>
                                            Slug: <span className="font-mono">{group.slug}</span> · Created {formatGroupDate(group.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => startEdit(group)} title="Edit" className="p-2 rounded-lg" style={{ color: TEXT_LIGHT, background: '#f4f8f4' }}>
                                        <MdEdit />
                                    </button>
                                    <button onClick={() => remove(group._id)} title="Delete" className="p-2 rounded-lg" style={{ color: '#c0392b', background: '#fdf1f0' }}>
                                        <MdDeleteOutline />
                                    </button>
                                </div>
                            </div>
                            {group.description && (
                                <p className="text-sm mt-2" style={{ color: TEXT_LIGHT }}>{group.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {group.eventIds.map((eid) => (
                                    <span key={eid} className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#f4f8f4', color: GREEN_DEEP }}>
                                        {eventNameById.get(eid) || 'Event'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default GroupsClient
