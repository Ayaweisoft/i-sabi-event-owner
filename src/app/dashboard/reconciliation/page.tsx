"use client"
import React from 'react'
import useFetch from '@/hooks/useFetch'
import NoResult from '@/components/NoResult'
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import { apiGetReconciliationProgress } from '@/services/AuthService'
import { IReconciliationProgress } from '@/interfaces'
import { formatNaira, timeAgo } from '@/lib/utils'
import { MdCheckCircle, MdPending, MdError } from 'react-icons/md'

const SERVICE_LABEL: Record<string, string> = {
    ticket: '🎟️ Ticket',
    vote:   '🗳️ Vote',
    form:   '📋 Form',
}

const STATUS_LABEL: Record<string, string> = {
    pending_delivery: 'Pending',
    failed_delivery:  'Failed',
}

const STATUS_STYLE: Record<string, string> = {
    pending_delivery: 'bg-yellow-100 text-yellow-800',
    failed_delivery:  'bg-red-100 text-red-800',
}

export default function ReconciliationPage() {
    const { data, isLoading } = useFetch<IReconciliationProgress>({
        api: apiGetReconciliationProgress,
        key: ['RECONCILIATION_PROGRESS'],
    })

    if (isLoading || !data) return <NoResult isLoading={isLoading} desc="Loading reconciliation progress…" />

    const { totals, totalPayments, deliveredRate, recentIssues } = data

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div>
                <h1 className="text-xl font-black text-gray-900">Reconciliation Progress</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Whether payments for your ticket, vote, and form sales were successfully delivered.
                </p>
            </div>

            {/* Delivered rate */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-700">Delivered / Settled</span>
                    <span className="font-black">{deliveredRate}%</span>
                </div>
                <ProgressBar
                    value={deliveredRate}
                    barClassName={
                        deliveredRate >= 95 ? 'bg-green-500' :
                        deliveredRate >= 80 ? 'bg-yellow-400' : 'bg-red-500'
                    }
                />
                <p className="text-xs text-gray-400 mt-2">
                    {totalPayments} total payment{totalPayments !== 1 ? 's' : ''} tracked across your events.
                </p>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Delivered" value={totals.ok} />
                <StatCard label="Pending"   value={totals.pending} />
                <StatCard label="Failed"    value={totals.failed} />
                <StatCard label="Refunded"  value={totals.refunded} />
                <StatCard label="Resolved"  value={totals.resolved} />
            </div>

            {/* Recent issues */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Needs Attention
                </h3>
                {recentIssues.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                        <MdCheckCircle /> Every payment has been delivered. Nothing pending.
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-gray-50">
                        {recentIssues.map((issue) => (
                            <div key={issue.ref} className="flex items-center justify-between py-3 gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-mono text-gray-600 truncate">{issue.ref}</span>
                                        <span className="text-xs text-gray-400">{SERVICE_LABEL[issue.service] || issue.service}</span>
                                    </div>
                                    {issue.lastError && (
                                        <p className="text-xs text-red-500 truncate mt-0.5">{issue.lastError}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(issue.createdAt)}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold">{formatNaira(issue.amount)}</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[issue.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {issue.status === 'failed_delivery' ? <MdError /> : <MdPending />}
                                        {STATUS_LABEL[issue.status] || issue.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-400 mt-4">
                    Payments stuck here are automatically retried. If one stays pending or failed for a while, contact support with the reference.
                </p>
            </div>
        </div>
    )
}
