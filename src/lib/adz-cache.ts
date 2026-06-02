import { QueryClient } from '@tanstack/react-query'
import { apiGetAdzCatalog, apiGetAdzEvents, apiListAdzCampaigns } from '@/services/AdzService'

export const ADZ_QUERY_KEYS = {
    catalog: ['ADZ_CATALOG'] as const,
    events: ['ADZ_EVENTS'] as const,
    campaigns: (status: string = 'ALL', eventId: string = 'ALL') => ['ADZ_CAMPAIGNS', status, eventId] as const,
    campaign: (id: string) => ['ADZ_CAMPAIGN', id] as const,
    campaignDetail: (id: string) => ['ADZ_CAMPAIGN_DETAIL', id] as const,
}

export const ADZ_CACHE_POLICY = {
    catalog: {
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    },
    events: {
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    },
    campaigns: {
        staleTime: 2 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    },
    campaign: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
    },
} as const

export const primeAdzCache = async (queryClient: QueryClient, token: string) => {
    await Promise.allSettled([
        queryClient.prefetchQuery({
            queryKey: [...ADZ_QUERY_KEYS.catalog],
            queryFn: async () => (await apiGetAdzCatalog(token)).data,
            ...ADZ_CACHE_POLICY.catalog,
        }),
        queryClient.prefetchQuery({
            queryKey: [...ADZ_QUERY_KEYS.events],
            queryFn: async () => (await apiGetAdzEvents(token)).data,
            ...ADZ_CACHE_POLICY.events,
        }),
        queryClient.prefetchQuery({
            queryKey: [...ADZ_QUERY_KEYS.campaigns()],
            queryFn: async () => (await apiListAdzCampaigns(token, { status: 'ALL' })).data,
            ...ADZ_CACHE_POLICY.campaigns,
        }),
    ])
}

export const invalidateAdzCache = async (queryClient: QueryClient, campaignId?: string) => {
    await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ['ADZ_CAMPAIGNS'] }),
        queryClient.invalidateQueries({ queryKey: ['ADZ_EVENTS'] }),
        queryClient.invalidateQueries({ queryKey: ['ADZ_CATALOG'] }),
        ...(campaignId
            ? [
                queryClient.invalidateQueries({ queryKey: ['ADZ_CAMPAIGN', campaignId] }),
                queryClient.invalidateQueries({ queryKey: ['ADZ_CAMPAIGN_DETAIL', campaignId] }),
            ]
            : []),
    ])
}
