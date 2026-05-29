import React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    label: string
    value: string | number
    sub?: string
    className?: string
    icon?: React.ReactNode
    trend?: { value: string; up: boolean }
}

const StatCard = ({ label, value, sub, className, icon, trend }: StatCardProps) => {
    return (
        <div className={cn('bg-white border border-border rounded-xl p-4 flex flex-col gap-1', className)}>
            <div className='flex items-center justify-between'>
                <span className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>{label}</span>
                {icon && <span className='text-muted-foreground'>{icon}</span>}
            </div>
            <span className='text-2xl font-bold text-foreground'>{value}</span>
            {trend && (
                <span className={cn('text-xs font-medium', trend.up ? 'text-green-600' : 'text-red-500')}>
                    {trend.up ? '↑' : '↓'} {trend.value}
                </span>
            )}
            {sub && <span className='text-xs text-muted-foreground'>{sub}</span>}
        </div>
    )
}

export default StatCard
