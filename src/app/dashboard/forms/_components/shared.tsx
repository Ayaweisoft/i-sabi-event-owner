import { cn, formatNaira } from '@/lib/utils'
import { IForm } from '@/interfaces/forms'

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

export const FormStatusBadge = ({ active }: { active: boolean }) => (
    <span className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200',
    )}>
        {active ? 'Active' : 'Pending / Inactive'}
    </span>
)

export const formatFormDate = (value?: string | null) => {
    if (!value) return 'Not set'
    return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export const getPriceLabel = (form: IForm) => (form.price > 0 ? formatNaira(form.price) : 'Free')

export const fieldCount = (form: IForm) => form.fields?.length ?? 0
