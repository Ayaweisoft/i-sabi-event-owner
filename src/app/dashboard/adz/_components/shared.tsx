import { AdzCampaign, AdzStatus, ADZ_PLACEMENT_LABELS, ADZ_STATUS_LABELS } from '@/interfaces/adz'
import { cn, formatNaira } from '@/lib/utils'

const STATUS_STYLES: Record<AdzStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    PAUSED: 'bg-blue-100 text-blue-700 border-blue-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    EXPIRED: 'bg-stone-100 text-stone-700 border-stone-200',
}

export const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={cn('rounded-3xl border border-[#d7e6d6] bg-white shadow-sm', className)}>
        {children}
    </div>
)

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
)

export const StatusBadge = ({ status }: { status: AdzStatus }) => (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold', STATUS_STYLES[status])}>
        {ADZ_STATUS_LABELS[status]}
    </span>
)

export const MetricTile = ({ label, value, helper }: { label: string; value: string; helper?: string }) => (
    <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </Card>
)

export const formatAdzDate = (value?: string | null) => {
    if (!value) return 'Not set'
    return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value))
}

export const formatAdzDateTime = (value?: string | null) => {
    if (!value) return 'Not available'
    return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value))
}

export const formatAdzPercent = (value: number) => `${value.toFixed(1)}%`

export const getCtr = (campaign: AdzCampaign) => {
    const impressions = campaign.metrics?.impressions ?? 0
    const clicks = campaign.metrics?.clicks ?? 0

    if (!impressions) return 0
    return (clicks / impressions) * 100
}

export const getBudgetSpent = (campaign: AdzCampaign) => campaign.budget?.spent ?? 0

export const getBudgetTotal = (campaign: AdzCampaign) => campaign.budget?.total ?? 0

export const getBudgetLabel = (campaign: AdzCampaign) => {
    const total = getBudgetTotal(campaign)
    const spent = getBudgetSpent(campaign)

    return `${formatNaira(spent)} / ${formatNaira(total)}`
}

export const getPlacementLabel = (placement: keyof typeof ADZ_PLACEMENT_LABELS) => ADZ_PLACEMENT_LABELS[placement]
