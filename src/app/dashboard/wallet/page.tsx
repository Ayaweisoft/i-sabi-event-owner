"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import useFetch from '@/hooks/useFetch'
import useAuthStore from '@/hooks/useAuth'
import NoResult from '@/components/NoResult'
import StatCard from '@/components/StatCard'
import { apiGetWalletSummary, apiInitiateWalletTopup, apiVerifyWalletTopup } from '@/services/AuthService'
import { IWalletSummary } from '@/interfaces'
import { formatNaira } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { MdArrowUpward, MdArrowDownward, MdAdd, MdClose } from 'react-icons/md'

const txTypeColor: Record<string, string> = {
    credit:  'text-green-600',
    debit:   'text-red-500',
    default: 'text-foreground',
}

const extractErrorMessage = (error: unknown, fallback: string) => {
    const data = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
    return fallback
}

const WalletPage = () => {
    const token = useAuthStore((s) => s.token)
    const { data, isLoading, error, refetch } = useFetch<IWalletSummary>({
        api: apiGetWalletSummary,
        key: ['WALLET_SUMMARY'],
    })

    const [fundOpen, setFundOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [verifying, setVerifying] = useState(false)

    // Paystack redirects back here with ?reference= after checkout — verify
    // once on load and clean the URL so a refresh doesn't re-trigger it
    // (verify is idempotent server-side regardless, this is just tidy).
    useEffect(() => {
        if (!token) return
        const params = new URLSearchParams(window.location.search)
        const reference = params.get('reference') || params.get('trxref')
        if (!reference) return

        setVerifying(true)
        apiVerifyWalletTopup(token, { reference })
            .then((res) => {
                const amt = res.data?.amount
                toast.success(amt ? `Wallet funded with ${formatNaira(amt)}` : 'Wallet funded successfully')
                refetch()
            })
            .catch((err) => toast.error(extractErrorMessage(err, 'Could not verify your top-up.')))
            .finally(() => {
                setVerifying(false)
                window.history.replaceState({}, '', window.location.pathname)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    const handleFund = async () => {
        if (!token) return
        const value = Number(amount)
        if (!Number.isFinite(value) || value < 100) {
            toast.error('Enter an amount of at least ₦100.')
            return
        }
        setSubmitting(true)
        try {
            const res = await apiInitiateWalletTopup(
                { amount: value, callbackUrl: window.location.href.split('?')[0] },
                { token },
            )
            const url = res.data?.authorization_url
            if (!url) throw new Error('Payment gateway did not return a checkout link.')
            window.location.href = url
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Could not start the top-up. Please try again.'))
            setSubmitting(false)
        }
    }

    if (isLoading || verifying) return <NoResult isLoading desc={verifying ? 'Confirming your top-up…' : 'Loading wallet…'} />
    if (error || !data) {
        return <NoResult isLoading={false} desc="Could not load your wallet. Please try again." buttonText="Retry" onClick={() => refetch()} />
    }

    const sourceTotal = data.revenueBySource.ticketing + data.revenueBySource.voting + data.revenueBySource.forms
    const sourceItems = [
        { label: '🎟 Ticketing', value: data.revenueBySource.ticketing },
        { label: '🗳 Voting',    value: data.revenueBySource.voting },
        { label: '📋 Forms',     value: data.revenueBySource.forms },
    ]

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-bold">Wallet</h1>

            {/* Balance card */}
            <div className="bg-primary text-white rounded-2xl p-6 flex flex-col gap-3">
                <span className="text-sm opacity-80 font-medium uppercase tracking-wide">Available Balance</span>
                <span className="text-4xl font-bold">{formatNaira(data.balance)}</span>
                <div className="flex gap-3 mt-1">
                    <button
                        onClick={() => setFundOpen(true)}
                        className="flex items-center gap-1.5 bg-white/15 border border-white/30 text-white text-sm font-semibold px-5 py-2 rounded-lg"
                    >
                        <MdAdd /> Fund Wallet
                    </button>
                    <Link
                        href={ROUTES.OWNER.WITHDRAW.INDEX}
                        className="bg-white text-primary text-sm font-semibold px-5 py-2 rounded-lg"
                    >
                        Withdraw Now
                    </Link>
                </div>
            </div>

            {/* Fund wallet modal */}
            {fundOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold">Fund Wallet</h3>
                            <button onClick={() => setFundOpen(false)} className="text-muted-foreground">
                                <MdClose />
                            </button>
                        </div>
                        <label className="text-xs font-medium mb-1 block text-muted-foreground">Amount (₦)</label>
                        <input
                            type="number"
                            min={100}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g. 5000"
                            className="w-full px-3 py-2 text-sm rounded-lg border outline-none mb-4"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground mb-4">
                            You&apos;ll be redirected to Paystack to complete payment. Funds land in your wallet immediately after.
                        </p>
                        <button
                            onClick={handleFund}
                            disabled={submitting}
                            className="w-full py-2.5 rounded-lg text-sm font-bold text-white bg-primary disabled:opacity-60"
                        >
                            {submitting ? 'Redirecting to payment…' : 'Continue to Payment'}
                        </button>
                    </div>
                </div>
            )}

            {/* Totals */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard
                    label="Total Earned"
                    value={formatNaira(data.totalEarned)}
                    icon={<MdArrowDownward className="text-green-500 text-xl" />}
                />
                <StatCard
                    label="Total Withdrawn"
                    value={formatNaira(data.totalWithdrawn)}
                    icon={<MdArrowUpward className="text-red-500 text-xl" />}
                />
            </div>

            {/* Monthly revenue chart */}
            {data.monthlyChart.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Monthly Revenue</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.monthlyChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatNaira(Number(v))} />
                            <Bar dataKey="amount" name="Revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Revenue by source */}
            <div className="bg-white border rounded-2xl p-4">
                <h2 className="text-sm font-semibold mb-3">Revenue by Source</h2>
                <div className="flex flex-col gap-3">
                    {sourceItems.map((s) => {
                        const pct = sourceTotal > 0 ? Math.round((s.value / sourceTotal) * 100) : 0
                        return (
                            <div key={s.label} className="flex items-center gap-3">
                                <span className="text-sm w-28">{s.label}</span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-sm font-semibold w-24 text-right">{formatNaira(s.value)}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Revenue by event */}
            {data.revenueByEvent.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Revenue by Event</h2>
                    <div className="flex flex-col divide-y">
                        {data.revenueByEvent.map((e) => (
                            <Link
                                key={e.eventId}
                                href={ROUTES.OWNER.EVENT(e.eventId)}
                                className="flex items-center justify-between py-3 hover:bg-muted/30 px-1 rounded transition"
                            >
                                <div>
                                    <p className="text-sm font-medium">{e.eventName}</p>
                                    <p className="text-xs text-muted-foreground">{e.sold?.toLocaleString() ?? 0} tickets</p>
                                </div>
                                <span className="text-sm font-bold text-primary">{formatNaira(e.revenue)}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* All transactions */}
            <div className="bg-white border rounded-2xl p-4">
                <h2 className="text-sm font-semibold mb-3">Recent Transactions</h2>
                {data.recentTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                    <div className="flex flex-col divide-y">
                        {data.recentTransactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-medium capitalize">{tx.description || tx.type}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold ${txTypeColor[tx.type] || txTypeColor.default}`}>
                                    {tx.type === 'credit' ? '+' : '-'}{formatNaira(Math.abs(Number(tx.amount)))}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payout history */}
            {data.payoutHistory.length > 0 && (
                <div className="bg-white border rounded-2xl p-4">
                    <h2 className="text-sm font-semibold mb-3">Payout History</h2>
                    <div className="flex flex-col divide-y">
                        {data.payoutHistory.map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-3">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(p.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                                <span className="text-sm font-bold text-red-500">-{formatNaira(p.amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default WalletPage
