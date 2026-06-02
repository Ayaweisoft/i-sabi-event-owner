"use client"
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { ADZ_CACHE_POLICY, ADZ_QUERY_KEYS, invalidateAdzCache } from '@/lib/adz-cache'
import { apiCreateAdzCampaign, apiGetAdzCampaign, apiGetAdzCatalog, apiGetAdzEvents, apiSubmitAdzCampaign, apiUpdateAdzCampaign } from '@/services/AdzService'
import {
    AdzCampaignResponse,
    AdzCatalogResponse,
    AdzDestinationType,
    AdzEventsResponse,
    AdzFormat,
    AdzPlacement,
    CreateAdzCampaignDto,
    ADZ_PLACEMENT_LABELS,
} from '@/interfaces/adz'
import { Card, SectionTitle, StatusBadge, formatAdzDate } from './shared'

type StepIndex = 0 | 1 | 2 | 3 | 4

const STEPS = [
    'Goal and format',
    'Creative',
    'Placement and targeting',
    'Budget and schedule',
    'Review and submit',
] as const

const DEFAULT_FORMATS: AdzFormat[] = ['NATIVE', 'REWARDED', 'INTERSTITIAL']
const DEFAULT_PLACEMENTS: AdzPlacement[] = [
    'HOME_FEED',
    'CHAT_PINNED',
    'NOTIFICATIONS_FEED',
    'GAME_SECTION_HERO',
    'PAN_LOBBY',
    'PAN_GAME_OVER',
    'GAME_ROOM',
    'GAME_RESULTS',
    'ONE_VS_ONE_WAITING',
    'ONE_VS_ONE_RESULT',
    'QUIZ_BETWEEN_QUESTIONS',
    'EVENT_DISCOVERY',
    'EVENT_DETAILS',
    'EVENT_DETAIL_SPONSOR',
    'RSVP_CONFIRMATION',
    'VOTING_CONFIRMATION',
    'TICKETING_CONFIRMATION',
    'ONBOARDING_WELCOME',
    'PROFILE_BANNER',
    'SOCIAL_DISCOVERY',
    'WALLET_HOME',
    'TRANSACTION_SUCCESS',
    'SAVINGS_GOAL_COMPLETE',
    'UTILITY_SUCCESS',
    'LEADERBOARD_TITLE',
    'ACHIEVEMENT_BADGE',
    'SPONSORED_ROOM',
]

const createInitialForm = (): CreateAdzCampaignDto => ({
    campaignName: '',
    format: 'NATIVE',
    eventId: null,
    linkedGameSessionId: '',
    placements: [],
    creative: {
        title: '',
        body: '',
        imageUrl: '',
        ctaText: 'Learn more',
        destinationUrl: '',
        destinationType: 'INTERNAL_EVENT',
    },
    reward: {
        enabled: false,
        amount: 0,
        currency: 'NGN',
        instruction: '',
    },
    targeting: {
        countries: ['Nigeria'],
        states: [],
        minAge: null,
        maxAge: null,
    },
    budget: {
        total: 0,
        dailyCap: 0,
        currency: 'NGN',
    },
    pricing: {
        cpm: 0,
        cpc: 0,
        cpv: 0,
    },
    schedule: {
        startsAt: '',
        endsAt: null,
    },
})

const splitCommaValues = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)

const toLocalDateInput = (value?: string | null) => {
    if (!value) return ''
    return new Date(value).toISOString().slice(0, 16)
}

const mapCampaignToForm = (campaign: AdzCampaignResponse['campaign']): CreateAdzCampaignDto => ({
    campaignName: campaign.campaignName,
    format: campaign.format,
    eventId: campaign.eventId ?? null,
    linkedGameSessionId: campaign.linkedGameSessionId ?? '',
    placements: campaign.placements,
    creative: {
        title: campaign.creative.title,
        body: campaign.creative.body,
        imageUrl: campaign.creative.imageUrl,
        ctaText: campaign.creative.ctaText,
        destinationUrl: campaign.creative.destinationUrl,
        destinationType: campaign.creative.destinationType,
    },
    reward: {
        enabled: campaign.reward.enabled,
        amount: campaign.reward.amount ?? 0,
        currency: campaign.reward.currency ?? 'NGN',
        instruction: campaign.reward.instruction ?? '',
    },
    targeting: {
        countries: campaign.targeting?.countries ?? [],
        states: campaign.targeting?.states ?? [],
        minAge: campaign.targeting?.minAge ?? null,
        maxAge: campaign.targeting?.maxAge ?? null,
    },
    budget: {
        total: campaign.budget?.total ?? 0,
        dailyCap: campaign.budget?.dailyCap ?? 0,
        currency: campaign.budget?.currency ?? 'NGN',
    },
    pricing: {
        cpm: campaign.pricing?.cpm ?? 0,
        cpc: campaign.pricing?.cpc ?? 0,
        cpv: campaign.pricing?.cpv ?? 0,
    },
    schedule: {
        startsAt: toLocalDateInput(campaign.schedule?.startsAt),
        endsAt: toLocalDateInput(campaign.schedule?.endsAt),
    },
})

const AdzCampaignForm = ({ campaignId }: { campaignId?: string }) => {
    const isEditing = Boolean(campaignId)
    const router = useRouter()
    const queryClient = useQueryClient()
    const token = useAuthStore((state) => state.token)
    const [step, setStep] = useState<StepIndex>(0)
    const [form, setForm] = useState<CreateAdzCampaignDto>(createInitialForm)
    const [errors, setErrors] = useState<string[]>([])
    const [action, setAction] = useState<'idle' | 'saving' | 'submitting'>('idle')

    const { data: catalogData } = useFetch<AdzCatalogResponse>({
        api: apiGetAdzCatalog,
        key: ADZ_QUERY_KEYS.catalog,
        requireAuth: true,
        ...ADZ_CACHE_POLICY.catalog,
    })

    const { data: eventsData } = useFetch<AdzEventsResponse>({
        api: apiGetAdzEvents,
        key: ADZ_QUERY_KEYS.events,
        requireAuth: true,
        ...ADZ_CACHE_POLICY.events,
    })

    const { data: campaignData, isLoading } = useFetch<AdzCampaignResponse>({
        api: apiGetAdzCampaign,
        key: ADZ_QUERY_KEYS.campaign(campaignId || 'new'),
        param: { id: campaignId || '' },
        enabled: isEditing,
        requireAuth: true,
        ...ADZ_CACHE_POLICY.campaign,
    })

    useEffect(() => {
        if (campaignData?.campaign) {
            setForm(mapCampaignToForm(campaignData.campaign))
        }
    }, [campaignData])

    const formats = catalogData?.formats?.length ? catalogData.formats : DEFAULT_FORMATS
    const placements = catalogData?.placements?.length ? catalogData.placements : DEFAULT_PLACEMENTS

    const cpvWarning = useMemo(() => {
        if (form.format !== 'REWARDED') return ''
        if (form.pricing.cpv > 0) return ''
        return 'Rewarded campaigns usually need a positive CPV so finance and reward accounting stay meaningful.'
    }, [form.format, form.pricing.cpv])

    const setValue = <K extends keyof CreateAdzCampaignDto>(key: K, value: CreateAdzCampaignDto[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const setCreativeValue = <K extends keyof CreateAdzCampaignDto['creative']>(key: K, value: CreateAdzCampaignDto['creative'][K]) => {
        setForm((current) => ({ ...current, creative: { ...current.creative, [key]: value } }))
    }

    const setRewardValue = <K extends keyof CreateAdzCampaignDto['reward']>(key: K, value: CreateAdzCampaignDto['reward'][K]) => {
        setForm((current) => ({ ...current, reward: { ...current.reward, [key]: value } }))
    }

    const setTargetingValue = <K extends keyof CreateAdzCampaignDto['targeting']>(key: K, value: CreateAdzCampaignDto['targeting'][K]) => {
        setForm((current) => ({ ...current, targeting: { ...current.targeting, [key]: value } }))
    }

    const setBudgetValue = <K extends keyof CreateAdzCampaignDto['budget']>(key: K, value: CreateAdzCampaignDto['budget'][K]) => {
        setForm((current) => ({ ...current, budget: { ...current.budget, [key]: value } }))
    }

    const setPricingValue = <K extends keyof CreateAdzCampaignDto['pricing']>(key: K, value: CreateAdzCampaignDto['pricing'][K]) => {
        setForm((current) => ({ ...current, pricing: { ...current.pricing, [key]: value } }))
    }

    const setScheduleValue = <K extends keyof CreateAdzCampaignDto['schedule']>(key: K, value: CreateAdzCampaignDto['schedule'][K]) => {
        setForm((current) => ({ ...current, schedule: { ...current.schedule, [key]: value } }))
    }

    const togglePlacement = (placement: AdzPlacement) => {
        setForm((current) => {
            const exists = current.placements.includes(placement)
            return {
                ...current,
                placements: exists
                    ? current.placements.filter((item) => item !== placement)
                    : [...current.placements, placement],
            }
        })
    }

    const validateStep = (currentStep: StepIndex) => {
        const issues: string[] = []

        if (currentStep === 0) {
            if (!form.campaignName.trim()) issues.push('Campaign name is required.')
            if (!form.format) issues.push('Campaign format is required.')
            if (form.creative.destinationType === 'INTERNAL_EVENT' && !form.eventId) issues.push('Select an event for event-linked campaigns.')
            if (form.creative.destinationType === 'INTERNAL_GAME_ROOM' && !form.linkedGameSessionId?.trim()) issues.push('Enter a game room ID for room-linked campaigns.')
        }

        if (currentStep === 1) {
            if (!form.creative.title.trim()) issues.push('Creative title is required.')
            if (form.creative.body.length > 280) issues.push('Creative body must stay within 280 characters.')
            if (form.creative.ctaText.length > 40) issues.push('CTA text must stay within 40 characters.')
            if (form.creative.destinationType === 'EXTERNAL_URL' && !form.creative.destinationUrl.trim()) issues.push('Destination URL is required for external campaigns.')
        }

        if (currentStep === 2) {
            if (!form.placements.length) issues.push('Select at least one placement.')
            if (form.targeting.minAge && form.targeting.maxAge && form.targeting.minAge > form.targeting.maxAge) {
                issues.push('Minimum age cannot be greater than maximum age.')
            }
        }

        if (currentStep === 3) {
            if (form.budget.total < 0) issues.push('Total budget must be zero or more.')
            if (form.budget.dailyCap < 0) issues.push('Daily cap must be zero or more.')
            if (!form.schedule.startsAt) issues.push('Start date is required.')
            if (form.schedule.endsAt && new Date(form.schedule.endsAt) <= new Date(form.schedule.startsAt)) {
                issues.push('End date must be after the start date.')
            }
        }

        return issues
    }

    const validateAll = () => {
        const issues = STEPS.flatMap((_, index) => validateStep(index as StepIndex))
        setErrors(issues)
        return issues
    }

    const normalizePayload = (): CreateAdzCampaignDto => ({
        ...form,
        eventId: form.creative.destinationType === 'INTERNAL_EVENT' ? form.eventId : null,
        linkedGameSessionId: form.creative.destinationType === 'INTERNAL_GAME_ROOM' ? form.linkedGameSessionId?.trim() || '' : '',
        creative: {
            ...form.creative,
            destinationUrl: form.creative.destinationUrl.trim(),
        },
        reward: {
            ...form.reward,
            amount: form.reward.enabled ? Number(form.reward.amount || 0) : 0,
            currency: form.reward.enabled ? form.reward.currency || 'NGN' : undefined,
            instruction: form.reward.enabled ? form.reward.instruction || '' : undefined,
        },
        targeting: {
            ...form.targeting,
            countries: form.targeting.countries.filter(Boolean),
            states: form.targeting.states.filter(Boolean),
        },
        budget: {
            ...form.budget,
            total: Number(form.budget.total || 0),
            dailyCap: Number(form.budget.dailyCap || 0),
        },
        pricing: {
            cpm: Number(form.pricing.cpm || 0),
            cpc: Number(form.pricing.cpc || 0),
            cpv: Number(form.pricing.cpv || 0),
        },
        schedule: {
            startsAt: form.schedule.startsAt,
            endsAt: form.schedule.endsAt || null,
        },
    })

    const persistCampaign = async (nextAction: 'saving' | 'submitting') => {
        if (!token) return

        const issues = validateAll()
        if (issues.length) {
            const firstBadStep = ([0, 1, 2, 3] as StepIndex[]).find((s) => validateStep(s).length > 0) ?? step
            setStep(firstBadStep)
            toast.error(issues[0])
            return
        }

        try {
            setAction(nextAction)
            const payload = normalizePayload()
            const response = isEditing
                ? await apiUpdateAdzCampaign(payload, { id: campaignId || '', token })
                : await apiCreateAdzCampaign(payload, { id: '', token })

            const savedCampaignId = response.data.campaign._id

            if (nextAction === 'submitting') {
                await apiSubmitAdzCampaign({}, { id: savedCampaignId, token })
                toast.success('Campaign submitted for review.')
            } else {
                toast.success(isEditing ? 'Campaign updated.' : 'Draft campaign created.')
            }

            await invalidateAdzCache(queryClient, savedCampaignId)
            router.push(ROUTES.OWNER.ADZ.DETAIL(savedCampaignId))
        } catch (error: unknown) {
            const message = typeof error === 'object' && error && 'response' in error
                ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
                : undefined

            toast.error(Array.isArray(message) ? message[0] : message || 'Unable to save campaign right now.')
        } finally {
            setAction('idle')
        }
    }

    const nextStep = () => {
        const issues = validateStep(step)
        if (issues.length) {
            setErrors(issues)
            toast.error(issues[0])
            return
        }

        setErrors([])
        setStep((current) => Math.min(current + 1, 4) as StepIndex)
    }

    const previousStep = () => {
        setErrors([])
        setStep((current) => Math.max(current - 1, 0) as StepIndex)
    }

    const destinationType = form.creative.destinationType

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d7e6d6] bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ef_55%,#edf7ee_100%)] p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                            <Button asChild variant="ghost" className="h-auto w-fit rounded-full px-0 text-slate-500 hover:bg-transparent hover:text-slate-900">
                                <Link href={ROUTES.OWNER.ADZ.INDEX}>
                                    <MdArrowBack className="text-base" />
                                    Back to campaigns
                                </Link>
                            </Button>
                            <SectionTitle
                                title={isEditing ? 'Edit campaign' : 'Create campaign'}
                                subtitle="Build the campaign in five steps, then save as draft or submit it for review."
                            />
                        </div>

                        {campaignData?.campaign && <StatusBadge status={campaignData.campaign.status} />}
                    </div>

                    <div className="grid gap-3 md:grid-cols-5">
                        {STEPS.map((label, index) => {
                            const current = index === step
                            const done = index < step

                            return (
                                <div key={label} className="rounded-2xl border border-[#d7e6d6] bg-white/80 p-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${done ? 'bg-[#2d8c3e] text-white' : current ? 'bg-[#07360e] text-white' : 'bg-[#eef5ec] text-slate-500'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Step {index + 1}</p>
                                            <p className="text-sm font-medium text-slate-800">{label}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {errors.length > 0 && (
                    <Card className="border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-700">Resolve these items before proceeding:</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-600">
                            {errors.map((issue) => (
                                <li key={issue}>{issue}</li>
                            ))}
                        </ul>
                    </Card>
                )}

                {isEditing && isLoading ? (
                    <Card className="p-6 text-sm text-slate-500">Loading campaign...</Card>
                ) : (
                    <Card className="p-5 md:p-6">
                        {step === 0 && (
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Campaign name
                                    <Input value={form.campaignName} onChange={(event) => setValue('campaignName', event.target.value)} maxLength={120} placeholder="RainFest headline takeover" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Format
                                    <select value={form.format} onChange={(event) => setValue('format', event.target.value as AdzFormat)} className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]">
                                        {formats.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Link target type
                                    <select value={destinationType} onChange={(event) => setCreativeValue('destinationType', event.target.value as AdzDestinationType)} className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]">
                                        <option value="INTERNAL_EVENT">Internal event</option>
                                        <option value="INTERNAL_GAME_ROOM">Internal game room</option>
                                        <option value="EXTERNAL_URL">External URL</option>
                                        <option value="NONE">No destination</option>
                                    </select>
                                </label>

                                {destinationType === 'INTERNAL_EVENT' ? (
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Linked event
                                        <select value={form.eventId || ''} onChange={(event) => setValue('eventId', event.target.value || null)} className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]">
                                            <option value="">Select an event</option>
                                            {(eventsData?.events ?? []).map((event) => <option key={event._id} value={event._id}>{event.eventName}</option>)}
                                        </select>
                                    </label>
                                ) : (
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Game room ID
                                        <Input value={form.linkedGameSessionId || ''} onChange={(event) => setValue('linkedGameSessionId', event.target.value)} placeholder="room_9x4sdf" />
                                    </label>
                                )}

                                <Card className="md:col-span-2 p-4">
                                    <p className="text-sm text-slate-500">
                                        Rewarded campaigns keep the reward step visible. Use event targets when the ad should deep-link into one of your owner events.
                                    </p>
                                </Card>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Title
                                    <Input value={form.creative.title} onChange={(event) => setCreativeValue('title', event.target.value)} maxLength={120} placeholder="Join the RainFest after-party" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    CTA text
                                    <Input value={form.creative.ctaText} onChange={(event) => setCreativeValue('ctaText', event.target.value)} maxLength={40} placeholder="Reserve now" />
                                </label>

                                <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Body
                                    <textarea value={form.creative.body} onChange={(event) => setCreativeValue('body', event.target.value)} maxLength={280} rows={4} className="min-h-28 rounded-2xl border border-[#d7e6d6] px-3 py-2 text-sm outline-none focus:border-[#2d8c3e]" placeholder="Tell users why this placement matters and what they should do next." />
                                </label>

                                <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Image URL
                                    <Input value={form.creative.imageUrl} onChange={(event) => setCreativeValue('imageUrl', event.target.value)} placeholder="https://cdn.example.com/rainfest-banner.jpg" />
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Destination type
                                    <select value={form.creative.destinationType} onChange={(event) => setCreativeValue('destinationType', event.target.value as AdzDestinationType)} className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]">
                                        <option value="INTERNAL_EVENT">Internal event</option>
                                        <option value="INTERNAL_GAME_ROOM">Internal game room</option>
                                        <option value="EXTERNAL_URL">External URL</option>
                                        <option value="NONE">No destination</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                    Destination URL
                                    <Input value={form.creative.destinationUrl} onChange={(event) => setCreativeValue('destinationUrl', event.target.value)} placeholder="https://example.com/landing-page" />
                                </label>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Placements</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {placements.map((placement) => {
                                            const active = form.placements.includes(placement)
                                            return (
                                                <button
                                                    key={placement}
                                                    type="button"
                                                    onClick={() => togglePlacement(placement)}
                                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-[#2d8c3e] bg-[#2d8c3e] text-white' : 'border-[#d7e6d6] bg-white text-slate-700 hover:border-[#2d8c3e]'}`}
                                                >
                                                    {ADZ_PLACEMENT_LABELS[placement]}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Countries
                                        <Input value={form.targeting.countries.join(', ')} onChange={(event) => setTargetingValue('countries', splitCommaValues(event.target.value))} placeholder="Nigeria, Ghana" />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        States
                                        <Input value={form.targeting.states.join(', ')} onChange={(event) => setTargetingValue('states', splitCommaValues(event.target.value))} placeholder="Lagos, Abuja" />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Minimum age
                                        <Input type="number" value={form.targeting.minAge ?? ''} onChange={(event) => setTargetingValue('minAge', event.target.value ? Number(event.target.value) : null)} min={0} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Maximum age
                                        <Input type="number" value={form.targeting.maxAge ?? ''} onChange={(event) => setTargetingValue('maxAge', event.target.value ? Number(event.target.value) : null)} min={0} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Total budget
                                        <Input type="number" min={0} value={form.budget.total} onChange={(event) => setBudgetValue('total', Number(event.target.value))} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Daily cap
                                        <Input type="number" min={0} value={form.budget.dailyCap} onChange={(event) => setBudgetValue('dailyCap', Number(event.target.value))} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        CPM
                                        <Input type="number" min={0} value={form.pricing.cpm} onChange={(event) => setPricingValue('cpm', Number(event.target.value))} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        CPC
                                        <Input type="number" min={0} value={form.pricing.cpc} onChange={(event) => setPricingValue('cpc', Number(event.target.value))} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        CPV
                                        <Input type="number" min={0} value={form.pricing.cpv} onChange={(event) => setPricingValue('cpv', Number(event.target.value))} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Currency
                                        <Input value={form.budget.currency} onChange={(event) => setBudgetValue('currency', event.target.value.toUpperCase())} maxLength={3} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        Start date
                                        <Input type="datetime-local" value={form.schedule.startsAt} onChange={(event) => setScheduleValue('startsAt', event.target.value)} />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                        End date
                                        <Input type="datetime-local" value={form.schedule.endsAt || ''} onChange={(event) => setScheduleValue('endsAt', event.target.value || null)} />
                                    </label>
                                </div>

                                {form.format === 'REWARDED' && cpvWarning && (
                                    <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                                        {cpvWarning}
                                    </Card>
                                )}

                                <Card className="p-4">
                                    <div className="flex items-center gap-3">
                                        <input id="reward-enabled" type="checkbox" checked={form.reward.enabled} onChange={(event) => setRewardValue('enabled', event.target.checked)} className="h-4 w-4 rounded border-[#d7e6d6]" />
                                        <label htmlFor="reward-enabled" className="text-sm font-medium text-slate-700">Enable reward claim flow</label>
                                    </div>

                                    {form.reward.enabled && (
                                        <div className="mt-4 grid gap-5 md:grid-cols-3">
                                            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                                Reward amount
                                                <Input type="number" min={0} value={form.reward.amount ?? 0} onChange={(event) => setRewardValue('amount', Number(event.target.value))} />
                                            </label>
                                            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                                                Reward currency
                                                <Input value={form.reward.currency || 'NGN'} onChange={(event) => setRewardValue('currency', event.target.value.toUpperCase())} maxLength={3} />
                                            </label>
                                            <label className="md:col-span-3 flex flex-col gap-2 text-sm font-medium text-slate-700">
                                                Reward instruction
                                                <textarea value={form.reward.instruction || ''} onChange={(event) => setRewardValue('instruction', event.target.value)} rows={3} className="min-h-24 rounded-2xl border border-[#d7e6d6] px-3 py-2 text-sm outline-none focus:border-[#2d8c3e]" placeholder="Watch the ad to the end to unlock your reward." />
                                            </label>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card className="p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Campaign summary</p>
                                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                                            <p><span className="font-medium text-slate-900">Name:</span> {form.campaignName}</p>
                                            <p><span className="font-medium text-slate-900">Format:</span> {form.format}</p>
                                            <p><span className="font-medium text-slate-900">Event:</span> {(eventsData?.events ?? []).find((event) => event._id === form.eventId)?.eventName || 'Not linked'}</p>
                                            <p><span className="font-medium text-slate-900">Room:</span> {form.linkedGameSessionId || 'Not linked'}</p>
                                        </div>
                                    </Card>

                                    <Card className="p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Schedule and pricing</p>
                                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                                            <p><span className="font-medium text-slate-900">Starts:</span> {formatAdzDate(form.schedule.startsAt)}</p>
                                            <p><span className="font-medium text-slate-900">Ends:</span> {formatAdzDate(form.schedule.endsAt)}</p>
                                            <p><span className="font-medium text-slate-900">Budget:</span> {form.budget.currency} {form.budget.total.toLocaleString()}</p>
                                            <p><span className="font-medium text-slate-900">Pricing:</span> CPM {form.pricing.cpm}, CPC {form.pricing.cpc}, CPV {form.pricing.cpv}</p>
                                        </div>
                                    </Card>
                                </div>

                                <Card className="p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Placements</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {form.placements.map((placement) => (
                                            <span key={placement} className="rounded-full bg-[#eef7ec] px-3 py-1 text-sm font-medium text-[#256b33]">
                                                {ADZ_PLACEMENT_LABELS[placement]}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </Card>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button variant="outline" className="rounded-full" onClick={previousStep} disabled={step === 0 || action !== 'idle'}>
                        Previous
                    </Button>

                    <div className="flex flex-wrap gap-3">
                        {step < 4 ? (
                            <Button className="rounded-full" onClick={nextStep} disabled={action !== 'idle'}>
                                Next step
                                <MdArrowForward className="text-base" />
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" className="rounded-full" onClick={() => persistCampaign('saving')} disabled={action !== 'idle'}>
                                    {action === 'saving' ? 'Saving...' : 'Save draft'}
                                </Button>
                                <Button className="rounded-full" onClick={() => persistCampaign('submitting')} disabled={action !== 'idle'}>
                                    {action === 'submitting' ? 'Submitting...' : 'Submit for review'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                <Card className="overflow-hidden">
                    <div className="border-b border-[#ecf2eb] bg-[#f3f8ef] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live preview</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{form.creative.title || 'Campaign preview'}</h3>
                    </div>
                    <div className="p-4">
                        <div className="overflow-hidden rounded-[1.5rem] border border-[#d7e6d6] bg-white">
                            <div className="aspect-[4/3] bg-[linear-gradient(135deg,#d7ead7_0%,#eff6ed_100%)]">
                                {form.creative.imageUrl ? (
                                    <img src={form.creative.imageUrl} alt={form.creative.title || 'Creative preview'} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
                                        Add an image URL to preview the ad creative.
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{form.creative.title || 'Ad title'}</p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{form.creative.body || 'Creative body copy will appear here.'}</p>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <span className="rounded-full bg-[#eef7ec] px-3 py-1 text-xs font-semibold text-[#256b33]">{form.format}</span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{form.creative.destinationType.replaceAll('_', ' ')}</span>
                                </div>
                                <Button className="w-full rounded-full">{form.creative.ctaText || 'Call to action'}</Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick summary</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                        <p><span className="font-medium text-slate-900">Placements:</span> {form.placements.length}</p>
                        <p><span className="font-medium text-slate-900">Budget:</span> {form.budget.currency} {form.budget.total.toLocaleString()}</p>
                        <p><span className="font-medium text-slate-900">Reward:</span> {form.reward.enabled ? `${form.reward.currency || 'NGN'} ${form.reward.amount || 0}` : 'Disabled'}</p>
                        <p><span className="font-medium text-slate-900">Targeting:</span> {form.targeting.countries.join(', ') || 'No country filter'}</p>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default AdzCampaignForm
