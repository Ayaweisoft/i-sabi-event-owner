"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { MdArrowBack, MdContentCopy, MdAdd, MdDelete } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import NoResult from '@/components/NoResult'
import useFetch from '@/hooks/useFetch'
import useMutate from '@/hooks/useMutate'
import useCopyToClipboard from '@/hooks/useCopy'
import { ROUTES } from '@/constants/routes'
import {
    apiGetFormById,
    apiGetFormShareInfo,
    apiGetFormSubmissions,
    apiUpdateForm,
} from '@/services/EventService'
import {
    IForm,
    IFormField,
    IFormShareInfo,
    IFormStep,
    IFormSubmissionsResponse,
    IUpdateFormPayload,
    FORM_FIELD_TYPES,
    FORM_THEME_NAMES,
} from '@/interfaces/forms'
import { Card, SectionTitle, FormStatusBadge, formatFormDate, getPriceLabel } from './shared'

const blankField = (): IFormField => ({
    label: '', name: '', type: 'text', required: false, options: [],
})

const slugifyName = (label: string) =>
    label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field'

const FormDetailClient = ({ formId }: { formId: string }) => {
    const queryClient = useQueryClient()
    const { copy } = useCopyToClipboard()
    const [page, setPage] = useState(1)

    const { data: form, isLoading } = useFetch<IForm>({
        api: apiGetFormById,
        key: ['forms', 'detail', formId],
        param: { id: formId },
        requireAuth: true,
        enabled: !!formId,
    })

    const { data: shareInfo } = useFetch<IFormShareInfo>({
        api: apiGetFormShareInfo,
        key: ['forms', 'share', formId],
        param: { id: formId },
        requireAuth: true,
        enabled: !!formId,
    })

    const { data: submissionsRes, isLoading: submissionsLoading } = useFetch<IFormSubmissionsResponse>({
        api: apiGetFormSubmissions,
        key: ['forms', 'submissions', formId, page],
        param: { id: formId, params: { page, limit: 20 } },
        requireAuth: true,
        enabled: !!formId,
    })

    // Local editable copy — seeded once the form loads, saved on demand.
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [active, setActive] = useState(false)
    const [colorTheme, setColorTheme] = useState<IForm['colorTheme']>('ocean')
    const [colorHex, setColorHex] = useState('')
    const [fields, setFields] = useState<IFormField[]>([])
    const [steps, setSteps] = useState<IFormStep[]>([])

    useEffect(() => {
        if (!form) return
        setTitle(form.title)
        setDescription(form.description || '')
        setActive(form.active)
        setColorTheme(form.colorTheme)
        setColorHex(form.colorHex || '')
        setFields(form.fields || [])
        setSteps(form.steps || [])
    }, [form])

    const { mutate: save, isPending: saving } = useMutate<IUpdateFormPayload, IForm>(apiUpdateForm, {
        id: formId,
        showSuccessMessage: true,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] })
            queryClient.invalidateQueries({ queryKey: ['forms', 'owner'] })
        },
    })

    const handleSave = () => {
        save({
            title, description, active, colorTheme,
            colorHex: colorTheme === 'custom' ? colorHex : undefined,
            fields, steps,
        })
    }

    // ── Field editing ─────────────────────────────────────────────────────────
    const updateField = (idx: number, patch: Partial<IFormField>) => {
        setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)))
    }
    const addField = () => setFields((prev) => [...prev, blankField()])
    const removeField = (idx: number) => {
        setFields((prev) => prev.filter((_, i) => i !== idx))
        // Keep step field-indexes in sync — drop the removed index and shift
        // everything after it down by one, exactly like the mobile builder.
        setSteps((prev) => prev.map((s) => ({
            ...s,
            fieldIndexes: s.fieldIndexes.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)),
        })))
    }

    // ── Step editing ──────────────────────────────────────────────────────────
    const addStep = () => setSteps((prev) => [...prev, { title: `Step ${prev.length + 1}`, description: '', fieldIndexes: [] }])
    const removeStep = (idx: number) => setSteps((prev) => prev.filter((_, i) => i !== idx))
    const updateStep = (idx: number, patch: Partial<IFormStep>) => {
        setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
    }
    const toggleFieldInStep = (stepIdx: number, fieldIdx: number) => {
        setSteps((prev) => prev.map((s, i) => {
            if (i !== stepIdx) return s
            const has = s.fieldIndexes.includes(fieldIdx)
            return { ...s, fieldIndexes: has ? s.fieldIndexes.filter((x) => x !== fieldIdx) : [...s.fieldIndexes, fieldIdx] }
        }))
    }

    const submissions = useMemo(() => submissionsRes?.data ?? [], [submissionsRes])
    const meta = submissionsRes?.meta

    const submissionColumns = useMemo(() => {
        const keys = new Set<string>()
        submissions.forEach((s) => Object.keys(s.data || {}).forEach((k) => keys.add(k)))
        return Array.from(keys)
    }, [submissions])

    if (isLoading) {
        return <NoResult isLoading desc="Loading form…" />
    }
    if (!form) {
        return <NoResult isLoading={false} desc="Form not found." />
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href={ROUTES.OWNER.FORMS.INDEX}>
                        <MdArrowBack className="text-base" /> Back to forms
                    </Link>
                </Button>
            </div>

            <Card className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <FormStatusBadge active={form.active} />
                        <SectionTitle title={form.title} subtitle={`Created ${formatFormDate(form.createdAt)} · ${getPriceLabel(form)}`} />
                    </div>
                </div>
            </Card>

            {/* ── Share link ─────────────────────────────────────────────── */}
            <Card className="p-6">
                <SectionTitle title="Share link" subtitle="Send this to your audience, or embed it on your own site." />
                <div className="mt-4 flex flex-col gap-3">
                    {(['direct', 'embed'] as const).map((kind) => (
                        <div key={kind} className="flex items-center gap-2 rounded-xl border border-[#d7e6d6] bg-[#f7fbf6] px-3 py-2">
                            <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">{kind}</span>
                            <span className="flex-1 truncate text-sm text-slate-700">{shareInfo?.links?.[kind] || '—'}</span>
                            <Button
                                variant="outline" size="sm"
                                disabled={!shareInfo?.links?.[kind]}
                                onClick={() => shareInfo?.links?.[kind] && copy(shareInfo.links[kind])}
                            >
                                <MdContentCopy className="text-base" /> Copy
                            </Button>
                        </div>
                    ))}
                    {!form.active && (
                        <p className="text-xs text-amber-600">
                            This form is pending admin approval — the link won&apos;t accept submissions until it&apos;s active.
                        </p>
                    )}
                </div>
            </Card>

            {/* ── Basic details ──────────────────────────────────────────── */}
            <Card className="p-6">
                <SectionTitle title="Details" />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Theme</Label>
                        <select
                            value={colorTheme}
                            onChange={(e) => setColorTheme(e.target.value as IForm['colorTheme'])}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                        >
                            {FORM_THEME_NAMES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {colorTheme === 'custom' && (
                        <div className="space-y-2">
                            <Label>Custom colour (hex)</Label>
                            <Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} placeholder="#3b82f6" />
                        </div>
                    )}
                    <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                        Accepting submissions (active)
                    </label>
                </div>
            </Card>

            {/* ── Fields ─────────────────────────────────────────────────── */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <SectionTitle title="Fields" subtitle="What the submitter fills in." />
                    <Button size="sm" variant="outline" onClick={addField}><MdAdd /> Add field</Button>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                    {fields.map((field, idx) => (
                        <div key={idx} className="rounded-xl border border-[#d7e6d6] p-4">
                            <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]">
                                <Input
                                    placeholder="Label"
                                    value={field.label}
                                    onChange={(e) => updateField(idx, { label: e.target.value, name: field.name || slugifyName(e.target.value) })}
                                />
                                <select
                                    value={field.type}
                                    onChange={(e) => updateField(idx, { type: e.target.value as IFormField['type'] })}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                                >
                                    {FORM_FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <label className="flex items-center gap-2 whitespace-nowrap text-sm">
                                    <input type="checkbox" checked={field.required} onChange={(e) => updateField(idx, { required: e.target.checked })} />
                                    Required
                                </label>
                                <Button variant="ghost" size="sm" onClick={() => removeField(idx)}><MdDelete /></Button>
                            </div>
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                                <div className="mt-3">
                                    <Label className="text-xs text-slate-500">Options (comma-separated)</Label>
                                    <Input
                                        value={(field.options || []).join(', ')}
                                        onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    {fields.length === 0 && <p className="text-sm text-slate-500">No fields yet — add one above.</p>}
                </div>
            </Card>

            {/* ── Steps ──────────────────────────────────────────────────── */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <SectionTitle title="Steps" subtitle="Optional — group fields into a multi-step flow. Leave empty for one flat page." />
                    <Button size="sm" variant="outline" onClick={addStep} disabled={fields.length === 0}><MdAdd /> Add step</Button>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                    {steps.map((step, sIdx) => (
                        <div key={sIdx} className="rounded-xl border border-[#d7e6d6] p-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                                <Input placeholder="Step title" value={step.title} onChange={(e) => updateStep(sIdx, { title: e.target.value })} />
                                <Input placeholder="Description (optional)" value={step.description || ''} onChange={(e) => updateStep(sIdx, { description: e.target.value })} />
                                <Button variant="ghost" size="sm" onClick={() => removeStep(sIdx)}><MdDelete /></Button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {fields.map((f, fIdx) => (
                                    <label key={fIdx} className="flex items-center gap-1.5 text-xs text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={step.fieldIndexes.includes(fIdx)}
                                            onChange={() => toggleFieldInStep(sIdx, fIdx)}
                                        />
                                        {f.label || `Field ${fIdx + 1}`}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    {steps.length === 0 && <p className="text-sm text-slate-500">No steps — every field renders on one page.</p>}
                </div>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="rounded-full px-6">
                    {saving ? 'Saving…' : 'Save changes'}
                </Button>
            </div>

            {/* ── Submissions ────────────────────────────────────────────── */}
            <Card className="p-6">
                <SectionTitle title="Submissions" subtitle={meta ? `${meta.total} total` : undefined} />
                {submissions.length === 0 ? (
                    <NoResult isLoading={submissionsLoading} desc="No submissions yet." className="py-10" />
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[600px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[#ecf2eb] text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="py-2 pr-4">Submitted</th>
                                    {submissionColumns.map((col) => <th key={col} className="py-2 pr-4">{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((s) => (
                                    <tr key={s._id} className="border-b border-[#f3f6f2]">
                                        <td className="py-2 pr-4 whitespace-nowrap text-slate-500">{formatFormDate(s.createdAt)}</td>
                                        {submissionColumns.map((col) => (
                                            <td key={col} className="py-2 pr-4 max-w-[240px] truncate">{String(s.data?.[col] ?? '—')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {meta && meta.pages > 1 && (
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                                <span className="text-xs text-slate-500">Page {meta.page} of {meta.pages}</span>
                                <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default FormDetailClient
