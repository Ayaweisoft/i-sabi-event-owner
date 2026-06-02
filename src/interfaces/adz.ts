export type AdzFormat = 'NATIVE' | 'REWARDED' | 'INTERSTITIAL'

export type AdzPlacement =
    | 'HOME_FEED'
    | 'CHAT_PINNED'
    | 'NOTIFICATIONS_FEED'
    | 'GAME_SECTION_HERO'
    | 'PAN_LOBBY'
    | 'PAN_GAME_OVER'
    | 'GAME_ROOM'
    | 'GAME_RESULTS'
    | 'ONE_VS_ONE_WAITING'
    | 'ONE_VS_ONE_RESULT'
    | 'QUIZ_BETWEEN_QUESTIONS'
    | 'EVENT_DISCOVERY'
    | 'EVENT_DETAILS'
    | 'EVENT_DETAIL_SPONSOR'
    | 'RSVP_CONFIRMATION'
    | 'VOTING_CONFIRMATION'
    | 'TICKETING_CONFIRMATION'
    | 'ONBOARDING_WELCOME'
    | 'PROFILE_BANNER'
    | 'SOCIAL_DISCOVERY'
    | 'WALLET_HOME'
    | 'TRANSACTION_SUCCESS'
    | 'SAVINGS_GOAL_COMPLETE'
    | 'UTILITY_SUCCESS'
    | 'LEADERBOARD_TITLE'
    | 'ACHIEVEMENT_BADGE'
    | 'SPONSORED_ROOM'

export type AdzStatus =
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'ACTIVE'
    | 'PAUSED'
    | 'REJECTED'
    | 'EXPIRED'

export type AdzDestinationType =
    | 'INTERNAL_EVENT'
    | 'INTERNAL_GAME_ROOM'
    | 'EXTERNAL_URL'
    | 'NONE'

export interface AdzCreative {
    title: string
    body: string
    imageUrl: string
    ctaText: string
    destinationUrl: string
    destinationType: AdzDestinationType
}

export interface AdzReward {
    enabled: boolean
    amount?: number
    currency?: string
    instruction?: string
}

export interface AdzTargeting {
    countries: string[]
    states: string[]
    minAge?: number | null
    maxAge?: number | null
}

export interface AdzBudget {
    total: number
    dailyCap: number
    spent?: number
    currency: string
}

export interface AdzPricing {
    cpm: number
    cpc: number
    cpv: number
}

export interface AdzSchedule {
    startsAt: string
    endsAt?: string | null
}

export interface AdzMetrics {
    impressions: number
    clicks: number
    rewardedViews: number
    rewardsClaimed: number
    lastServedAt?: string | null
    lastClickedAt?: string | null
}

export interface AdzCampaign {
    _id: string
    campaignName: string
    advertiserType: 'EVENT_OWNER' | 'USER' | 'ADMIN'
    format: AdzFormat
    placements: AdzPlacement[]
    status: AdzStatus
    eventId?: string | null
    linkedEventName?: string | null
    linkedGameSessionId?: string
    moderationNote?: string | null
    creative: AdzCreative
    reward: AdzReward
    targeting?: AdzTargeting
    budget?: AdzBudget
    pricing?: AdzPricing
    metrics?: AdzMetrics
    schedule?: AdzSchedule
    createdAt?: string
    updatedAt?: string
}

export interface CreateAdzCampaignDto {
    campaignName: string
    format: AdzFormat
    placements: AdzPlacement[]
    eventId?: string | null
    linkedGameSessionId?: string
    creative: AdzCreative
    reward: AdzReward
    targeting: AdzTargeting
    budget: Omit<AdzBudget, 'spent'>
    pricing: AdzPricing
    schedule: AdzSchedule
    submitForReview?: boolean
}

export interface AdzCatalogResponse {
    formats: AdzFormat[]
    placements: AdzPlacement[]
    statuses: AdzStatus[]
}

export interface AdzOwnerEventOption {
    _id: string
    eventName: string
    type?: string
    status?: string
    startDate?: string
}

export interface AdzEventsResponse {
    events: AdzOwnerEventOption[]
}

export interface AdzCampaignListQuery {
    page?: number
    limit?: number
    status?: AdzStatus | 'ALL'
    eventId?: string
}

export interface AdzPagination {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
}

export interface AdzCampaignListResponse {
    campaigns: AdzCampaign[]
    pagination?: AdzPagination
}

export interface AdzCampaignResponse {
    campaign: AdzCampaign
}

export interface AdzMutationResponse {
    success: boolean
    message?: string
    campaign: AdzCampaign
}

export const ADZ_PLACEMENT_LABELS: Record<AdzPlacement, string> = {
    HOME_FEED:              'Home feed',
    CHAT_PINNED:            'Chat room (pinned banner)',
    NOTIFICATIONS_FEED:     'Notifications feed',
    GAME_SECTION_HERO:      'Game section hero',
    PAN_LOBBY:              'Pick A Number lobby',
    PAN_GAME_OVER:          'Pick A Number game over',
    GAME_ROOM:              'Game room',
    GAME_RESULTS:           'Game results',
    ONE_VS_ONE_WAITING:     '1v1 opponent search (waiting)',
    ONE_VS_ONE_RESULT:      '1v1 result screen',
    QUIZ_BETWEEN_QUESTIONS: 'Quiz — between questions',
    EVENT_DISCOVERY:        'Events listing',
    EVENT_DETAILS:          'Event detail page',
    EVENT_DETAIL_SPONSOR:   'Event detail — sponsor strip',
    RSVP_CONFIRMATION:      'RSVP confirmation',
    VOTING_CONFIRMATION:    'Voting confirmation',
    TICKETING_CONFIRMATION: 'Ticket purchase confirmation',
    ONBOARDING_WELCOME:     'Onboarding welcome screen',
    PROFILE_BANNER:         'User profile banner',
    SOCIAL_DISCOVERY:       'Social discovery (Find My Padi)',
    WALLET_HOME:            'Wallet home',
    TRANSACTION_SUCCESS:    'Transaction success screen',
    SAVINGS_GOAL_COMPLETE:  'Savings goal completed',
    UTILITY_SUCCESS:        'Utility bill success screen',
    LEADERBOARD_TITLE:      'Leaderboard title sponsor',
    ACHIEVEMENT_BADGE:      'Achievement badge sponsor',
    SPONSORED_ROOM:         'Sponsored game room',
}

export const ADZ_STATUS_LABELS: Record<AdzStatus, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending review',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    REJECTED: 'Rejected',
    EXPIRED: 'Expired',
}
