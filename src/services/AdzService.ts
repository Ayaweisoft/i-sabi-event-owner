import BaseService from './BaseService'
import {
    AdzCampaignListQuery,
    CreateAdzCampaignDto,
} from '@/interfaces/adz'

const Auth = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
})

const ADZ_BASE = 'v2/event-owner/adz'

export const apiGetAdzCatalog = (token: string) =>
    BaseService.get(`${ADZ_BASE}/catalog`, Auth(token))

export const apiGetAdzEvents = (token: string) =>
    BaseService.get(`${ADZ_BASE}/events`, Auth(token))

export const apiListAdzCampaigns = (
    token: string,
    query: AdzCampaignListQuery = {},
) =>
    BaseService.get(`${ADZ_BASE}/campaigns`, {
        ...Auth(token),
        params: {
            page: query.page ?? 1,
            limit: query.limit ?? 20,
            status: query.status && query.status !== 'ALL' ? query.status : undefined,
            eventId: query.eventId || undefined,
        },
    })

export const apiGetAdzCampaign = (
    token: string,
    { id }: { id: string },
) => BaseService.get(`${ADZ_BASE}/campaigns/${id}`, Auth(token))

export const apiCreateAdzCampaign = (
    data: CreateAdzCampaignDto,
    { token }: { id: string; token: string },
) => BaseService.post(`${ADZ_BASE}/campaigns`, data, Auth(token))

export const apiUpdateAdzCampaign = (
    data: Partial<CreateAdzCampaignDto>,
    { id, token }: { id: string; token: string },
) => BaseService.patch(`${ADZ_BASE}/campaigns/${id}`, data, Auth(token))

export const apiSubmitAdzCampaign = (
    _: Record<string, never>,
    { id, token }: { id: string; token: string },
) => BaseService.post(`${ADZ_BASE}/campaigns/${id}/submit`, {}, Auth(token))