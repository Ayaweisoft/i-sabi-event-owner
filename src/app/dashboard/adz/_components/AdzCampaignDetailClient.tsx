"use client"
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { MdArrowBack, MdEdit, MdSend } from 'react-icons/md'
import NoResult from '@/components/NoResult'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { ADZ_CACHE_POLICY, ADZ_QUERY_KEYS, invalidateAdzCache } from '@/lib/adz-cache'
import { apiGetAdzCampaign, apiSubmitAdzCampaign } from '@/services/AdzService'
import { AdzCampaignResponse, ADZ_PLACEMENT_LABELS } from '@/interfaces/adz'
import { Card, MetricTile, SectionTitle, StatusBadge, formatAdzDate, formatAdzDateTime, formatAdzPercent, getBudgetLabel, getCtr } from './shared'

const editableStatuses = new Set(['DRAFT', 'REJECTED', 'PAUSED'])

const AdzCampaignDetailClient = () => {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const token = useAuthStore((state) => state.token)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data, isLoading, refetch } = useFetch<AdzCampaignResponse>({
        api: apiGetAdzCampaign,
        key: ADZ_QUERY_KEYS.campaignDetail(params.id),
        param: { id: params.id },
        requireAuth: true,
        ...ADZ_CACHE_POLICY.campaign,
    })

    const campaign = data?.campaign

    const handleSubmit = async () => {
        if (!token || !campaign) return

        try {
            setIsSubmitting(true)
            await apiSubmitAdzCampaign({}, { id: campaign._id, token })
            await invalidateAdzCache(queryClient, campaign._id)
            toast.success('Campaign submitted for review.')
            refetch()
        } catch (error: unknown) {
            const message = typeof error === 'object' && error && 'response' in error
                ? (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
                : undefined

            toast.error(Array.isArray(message) ? message[0] : message || 'Unable to submit campaign.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!campaign && !isLoading) {
        return <NoResult isLoading={false} desc="Campaign not found." />
    }

    if (!campaign) {
        return <NoResult isLoading desc="Loading campaign" />
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-[#d7e6d6] bg-[linear-gradient(135deg,#ffffff_0%,#f3f8ef_55%,#edf7ee_100%)] p-6 shadow-sm">
                <Button asChild variant="ghost" className="h-auto w-fit rounded-full px-0 text-slate-500 hover:bg-transparent hover:text-slate-900">
                    <Link href={ROUTES.OWNER.ADZ.INDEX}>
                        <MdArrowBack className="text-base" />
                        Back to campaigns
                    </Link>
                </Button>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={campaign.status} />
                            <span className="rounded-full bg-[#eef7ec] px-3 py-1 text-xs font-semibold text-[#256b33]">{campaign.format}</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">{campaign.campaignName}</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {campaign.linkedEventName || 'No linked event'}
                                {campaign.linkedGameSessionId ? ` · Room ${campaign.linkedGameSessionId}` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {editableStatuses.has(campaign.status) && (
                            <>
                                <Button variant="outline" className="rounded-full" onClick={() => router.push(ROUTES.OWNER.ADZ.EDIT(campaign._id))}>
                                    <MdEdit className="text-base" />
                                    Edit
                                </Button>
                                <Button className="rounded-full" onClick={handleSubmit} disabled={isSubmitting}>
                                    <MdSend className="text-base" />
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Budget used" value={getBudgetLabel(campaign)} helper="Spent versus total" />
                <MetricTile label="Impressions" value={(campaign.metrics?.impressions ?? 0).toLocaleString()} helper={`Last served ${formatAdzDateTime(campaign.metrics?.lastServedAt)}`} />
                <MetricTile label="Clicks" value={(campaign.metrics?.clicks ?? 0).toLocaleString()} helper={`CTR ${formatAdzPercent(getCtr(campaign))}`} />
                <MetricTile label="Rewards claimed" value={(campaign.metrics?.rewardsClaimed ?? 0).toLocaleString()} helper={`Rewarded views ${(campaign.metrics?.rewardedViews ?? 0).toLocaleString()}`} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                <div className="space-y-6">
                    <Card className="p-5 md:p-6">
                        <SectionTitle title="Moderation" subtitle="Status, note, and schedule" />
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Moderation note</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.moderationNote || 'No moderation note yet.'}</p>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <p><span className="font-medium text-slate-900">Start:</span> {formatAdzDate(campaign.schedule?.startsAt)}</p>
                                <p><span className="font-medium text-slate-900">End:</span> {formatAdzDate(campaign.schedule?.endsAt)}</p>
                                <p><span className="font-medium text-slate-900">Created:</span> {formatAdzDate(campaign.createdAt)}</p>
                                <p><span className="font-medium text-slate-900">Updated:</span> {formatAdzDate(campaign.updatedAt)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6">
                        <SectionTitle title="Performance" subtitle="Core delivery and engagement metrics" />
                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-[#f6faf5] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pricing</p>
                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p>CPM: {campaign.pricing?.cpm ?? 0}</p>
                                    <p>CPC: {campaign.pricing?.cpc ?? 0}</p>
                                    <p>CPV: {campaign.pricing?.cpv ?? 0}</p>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-[#f6faf5] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reward</p>
                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <p>Enabled: {campaign.reward.enabled ? 'Yes' : 'No'}</p>
                                    <p>Amount: {(campaign.reward.currency || 'NGN')} {campaign.reward.amount ?? 0}</p>
                                    <p>{campaign.reward.instruction || 'No instruction configured.'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 md:p-6">
                        <SectionTitle title="Placements and targeting" subtitle="Where this campaign can run" />
                        <div className="mt-5 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {campaign.placements.map((placement) => (
                                    <span key={placement} className="rounded-full bg-[#eef7ec] px-3 py-1 text-sm font-medium text-[#256b33]">
                                        {ADZ_PLACEMENT_LABELS[placement]}
                                    </span>
                                ))}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600">
                                <p><span className="font-medium text-slate-900">Countries:</span> {campaign.targeting?.countries?.join(', ') || 'No filter'}</p>
                                <p><span className="font-medium text-slate-900">States:</span> {campaign.targeting?.states?.join(', ') || 'No filter'}</p>
                                <p><span className="font-medium text-slate-900">Age range:</span> {campaign.targeting?.minAge ?? 'Any'} - {campaign.targeting?.maxAge ?? 'Any'}</p>
                                <p><span className="font-medium text-slate-900">Destination:</span> {campaign.creative.destinationType.replaceAll('_', ' ')}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                    <Card className="overflow-hidden">
                        <div className="aspect-[4/3] bg-[linear-gradient(135deg,#d7ead7_0%,#eff6ed_100%)]">
                            {campaign.creative.imageUrl ? (
                                <img src={campaign.creative.imageUrl} alt={campaign.creative.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500">
                                    No creative image has been added yet.
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 p-5">
                            <p className="text-lg font-semibold text-slate-900">{campaign.creative.title}</p>
                            <p className="text-sm leading-6 text-slate-600">{campaign.creative.body}</p>
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{campaign.creative.destinationType.replaceAll('_', ' ')}</span>
                                <Button className="rounded-full">{campaign.creative.ctaText}</Button>
                            </div>
                            <p className="text-xs text-slate-500">{campaign.creative.destinationUrl || 'No destination URL configured.'}</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default AdzCampaignDetailClient
