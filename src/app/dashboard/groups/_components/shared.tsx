import { cn } from '@/lib/utils'

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

export const formatGroupDate = (value?: string | null) => {
    if (!value) return 'Not set'
    return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}
