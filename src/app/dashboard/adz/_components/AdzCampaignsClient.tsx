"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { MdArrowForward, MdEdit, MdSend } from 'react-icons/md'
import NoResult from '@/components/NoResult'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { apiGetAdzEvents, apiListAdzCampaigns, apiSubmitAdzCampaign } from '@/services/AdzService'
import { ADZ_CACHE_POLICY, ADZ_QUERY_KEYS, invalidateAdzCache } from '@/lib/adz-cache'
import {
    AdzCampaign,
    AdzCampaignListResponse,
    AdzEventsResponse,
    AdzStatus,
    ADZ_STATUS_LABELS,
} from '@/interfaces/adz'
import {
    Card,
    MetricTile,
    SectionTitle,
    StatusBadge,
    formatAdzDate,
    formatAdzPercent,
    getBudgetLabel,
    getCtr,
} from './shared'

const STATUS_FILTERS: Array<'ALL' | AdzStatus> = ['ALL', 'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED', 'REJECTED', 'EXPIRED']

const canSubmit = (campaign: AdzCampaign) => ['DRAFT', 'REJECTED', 'PAUSED'].includes(campaign.status)

const AdzCampaignsClient = () => {
    const token = useAuthStore((state) => state.token)
    const queryClient = useQueryClient()
    const router = useRouter()
    const [status, setStatus] = useState<'ALL' | AdzStatus>('ALL')
    const [eventId, setEventId] = useState('ALL')
    const [submittingId, setSubmittingId] = useState('')

    const { data, isLoading, refetch, isFetching } = useFetch<AdzCampaignListResponse>({
        api: apiListAdzCampaigns,
        key: ADZ_QUERY_KEYS.campaigns(status, eventId),
        param: {
            status,
            eventId: eventId === 'ALL' ? undefined : eventId,
        },
        requireAuth: true,
        ...ADZ_CACHE_POLICY.campaigns,
    })

    const { data: eventsData } = useFetch<AdzEventsResponse>({
        api: apiGetAdzEvents,
        key: ADZ_QUERY_KEYS.events,
        requireAuth: true,
        ...ADZ_CACHE_POLICY.events,
    })

    const campaigns = data?.campaigns ?? []
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'ACTIVE').length
    const pendingCampaigns = campaigns.filter((campaign) => campaign.status === 'PENDING_REVIEW').length
    const rewardedCampaigns = campaigns.filter((campaign) => campaign.format === 'REWARDED').length

    const handleSubmit = async (campaignId: string) => {
        if (!token) return

        try {
            setSubmittingId(campaignId)
            await apiSubmitAdzCampaign({}, { id: campaignId, token })
            await invalidateAdzCache(queryClient, campaignId)
            toast.success('Campaign submitted for review.')
            refetch()
        } catch (error: unknown) {
            const message = typeof error === 'object' && error && 'response' in error
                ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
                : undefined

            toast.error(Array.isArray(message) ? message[0] : message || 'Unable to submit campaign.')
        } finally {
            setSubmittingId('')
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d7e6d6] bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ef_55%,#edf7ee_100%)] p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl space-y-2">
                    <span className="inline-flex w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2d8c3e]">
                        Event-owner Adz
                    </span>
                    <SectionTitle
                        title="Campaigns"
                        subtitle="Create, review, and track ad campaigns for your events and game rooms from one owner dashboard."
                    />
                </div>
                <Button asChild className="rounded-full px-6">
                    <Link href={ROUTES.OWNER.ADZ.CREATE}>New campaign</Link>
                </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Total campaigns" value={String(totalCampaigns)} helper="Across the current filter set" />
                <MetricTile label="Active" value={String(activeCampaigns)} helper="Serving campaigns" />
                <MetricTile label="Pending review" value={String(pendingCampaigns)} helper="Waiting for moderation" />
                <MetricTile label="Rewarded" value={String(rewardedCampaigns)} helper="Campaigns with reward flows" />
            </div>

            <Card className="p-4 md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                            Status
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value as 'ALL' | AdzStatus)}
                                className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]"
                            >
                                {STATUS_FILTERS.map((item) => (
                                    <option key={item} value={item}>
                                        {item === 'ALL' ? 'All statuses' : ADZ_STATUS_LABELS[item]}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                            Linked event
                            <select
                                value={eventId}
                                onChange={(event) => setEventId(event.target.value)}
                                className="h-10 rounded-xl border border-[#d7e6d6] bg-white px-3 text-sm outline-none focus:border-[#2d8c3e]"
                            >
                                <option value="ALL">All events</option>
                                {(eventsData?.events ?? []).map((event) => (
                                    <option key={event._id} value={event._id}>{event.eventName}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <p className="text-sm text-slate-500">
                        {isFetching ? 'Refreshing campaigns...' : `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'} loaded`}
                    </p>
                </div>
            </Card>

            {campaigns.length === 0 ? (
                <NoResult
                    isLoading={isLoading}
                    desc="No Adz campaigns match the selected filters yet."
                    buttonText="Create campaign"
                    onClick={() => router.push(ROUTES.OWNER.ADZ.CREATE)}
                />
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {campaigns.map((campaign) => (
                        <Card key={campaign._id} className="overflow-hidden">
                            <div className="border-b border-[#ecf2eb] p-5">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge status={campaign.status} />
                                            <span className="rounded-full bg-[#eef7ec] px-3 py-1 text-xs font-semibold text-[#256b33]">
                                                {campaign.format}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-900">{campaign.campaignName}</h3>
                                            <p className="text-sm text-slate-500">
                                                {campaign.linkedEventName || 'No linked event'}
                                                {campaign.linkedGameSessionId ? ` · Room ${campaign.linkedGameSessionId}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-left text-sm text-slate-500 md:text-right">
                                        <p>Created {formatAdzDate(campaign.createdAt)}</p>
                                        <p>Budget {getBudgetLabel(campaign)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Impressions</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">{(campaign.metrics?.impressions ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Clicks</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">{(campaign.metrics?.clicks ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rewards claimed</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">{(campaign.metrics?.rewardsClaimed ?? 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CTR</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatAdzPercent(getCtr(campaign))}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 border-t border-[#ecf2eb] p-5">
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href={ROUTES.OWNER.ADZ.DETAIL(campaign._id)}>
                                        View
                                        <MdArrowForward className="text-base" />
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="rounded-full">
                                    <Link href={ROUTES.OWNER.ADZ.EDIT(campaign._id)}>
                                        Edit
                                        <MdEdit className="text-base" />
                                    </Link>
                                </Button>
                                {canSubmit(campaign) && (
                                    <Button
                                        className="rounded-full"
                                        onClick={() => handleSubmit(campaign._id)}
                                        disabled={submittingId === campaign._id}
                                    >
                                        <MdSend className="text-base" />
                                        {submittingId === campaign._id ? 'Submitting...' : 'Submit'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AdzCampaignsClient
