import { cn } from '@/lib/utils'

interface ProgressBarProps {
    value: number
    max?: number
    className?: string
    barClassName?: string
    showLabel?: boolean
}

const ProgressBar = ({ value, max = 100, className, barClassName, showLabel }: ProgressBarProps) => {
    const pct = Math.min(Math.round((value / max) * 100), 100)
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className='flex-1 h-2 bg-muted rounded-full overflow-hidden'>
                <div
                    className={cn('h-full rounded-full bg-primary transition-all', barClassName)}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && <span className='text-xs text-muted-foreground w-8 text-right'>{pct}%</span>}
        </div>
    )
}

export default ProgressBar
