"use client"
import React, { FormEvent, useEffect, useReducer, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md'
import { BiSolidBolt } from 'react-icons/bi'
import Logo from '@/assets/logo.png'
import useMutate from '@/hooks/useMutate'
import useAuthStore from '@/hooks/useAuth'
import { ILoginSuccessData, IReducerAction, IUserLogin } from '@/interfaces'
import { apiLogin } from '@/services/AuthService'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GREEN_DARK = '#1a3620'
const GOLD       = '#F5C518'
const SURFACE    = '#f4f8f4'
const BORDER     = '#d4e8d6'
const TEXT_MID   = '#3d5c42'
const TEXT_LIGHT = '#6b8f70'

const FEATURES = [
    'Real-time ticket sales & check-in tracking',
    'Live vote leaderboards & revenue',
    'Wallet with instant withdrawal',
    'Smart health scores & audience insights',
    'Hourly check-in heatmaps & trend charts',
    'Notifications for every sale & milestone',
]

const initialState: IUserLogin = { username: '', password: '' }

const LoginPage = () => {
    const router  = useRouter()
    const { token, update } = useAuthStore()
    const [showPass, setShowPass] = useState(false)
    const [fieldError, setFieldError] = useState<string | null>(null)

    const [form, dispatch] = useReducer(
        (state: IUserLogin, action: IReducerAction<keyof IUserLogin>) => {
            if (action.type === 'reset') return initialState
            return { ...state, [action.type]: action.payload as string }
        },
        initialState,
    )

    // Redirect already-authenticated users straight to dashboard
    useEffect(() => {
        if (token) router.replace('/dashboard')
    }, [token, router])

    const loginMutation = useMutate<IUserLogin, ILoginSuccessData>(apiLogin, {
        onSuccess: (data: ILoginSuccessData) => {
            update(data)
            toast.success(`Welcome back, ${data.doc?.username || 'owner'}!`)
            router.replace('/dashboard')
        },
        showErrorMessage: true,
    })

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFieldError(null)

        if (!form.username.trim()) {
            setFieldError('Username is required')
            return
        }
        if (!form.password) {
            setFieldError('Password is required')
            return
        }

        loginMutation.mutate(form)
    }

    const isPending = loginMutation.isPending

    return (
        <div className="min-h-screen flex">
            {/* ── Left brand panel ─────────────────────────────────── */}
            <div
                className="hidden lg:flex flex-col justify-between w-[46%] min-h-screen p-10 relative overflow-hidden"
                style={{ backgroundColor: GREEN_DEEP }}
            >
                {/* Background texture rings */}
                <div
                    className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-10"
                    style={{ border: `80px solid ${GOLD}` }}
                />
                <div
                    className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full opacity-5"
                    style={{ border: `60px solid ${GOLD}` }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <Image src={Logo} alt="i-sabi" className="w-28 brightness-0 invert" />
                </div>

                {/* Body copy */}
                <div className="relative z-10 flex flex-col gap-6">
                    <div>
                        <p
                            className="text-xs font-bold tracking-widest uppercase mb-3"
                            style={{ color: GOLD }}
                        >
                            Event Owner Dashboard
                        </p>
                        <h1 className="text-4xl font-black text-white leading-tight">
                            Manage your events.
                            <br />
                            <span style={{ color: GOLD }}>Own your revenue.</span>
                        </h1>
                        <p className="text-base mt-4" style={{ color: TEXT_LIGHT }}>
                            Everything you need to run ticketing, voting, and form events — live, in one place.
                        </p>
                    </div>

                    {/* Feature list */}
                    <ul className="flex flex-col gap-3">
                        {FEATURES.map((f) => (
                            <li key={f} className="flex items-start gap-3">
                                <MdCheckCircle
                                    className="text-xl shrink-0 mt-0.5"
                                    style={{ color: GREEN }}
                                />
                                <span className="text-sm text-white/80">{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-xs" style={{ color: TEXT_LIGHT }}>
                        © {new Date().getFullYear()} i-sabi. All rights reserved.
                    </p>
                </div>
            </div>

            {/* ── Right form panel ─────────────────────────────────── */}
            <div
                className="flex-1 flex flex-col items-center justify-center min-h-screen px-6 py-12"
                style={{ backgroundColor: SURFACE }}
            >
                {/* Mobile logo */}
                <div className="lg:hidden mb-8">
                    <Image src={Logo} alt="i-sabi" className="w-24 mx-auto" />
                </div>

                <div className="w-full max-w-md">
                    {/* Heading */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <BiSolidBolt className="text-xl" style={{ color: GOLD }} />
                            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: TEXT_MID }}>
                                Event Owner Portal
                            </span>
                        </div>
                        <h2 className="text-3xl font-black" style={{ color: GREEN_DEEP }}>Welcome back</h2>
                        <p className="text-sm mt-1" style={{ color: TEXT_LIGHT }}>
                            Sign in to manage your events and track revenue
                        </p>
                    </div>

                    {/* Form card */}
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl p-8 flex flex-col gap-5 shadow-sm"
                        style={{ border: `1px solid ${BORDER}` }}
                    >
                        {/* Username */}
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="username"
                                className="text-sm font-semibold"
                                style={{ color: GREEN_DEEP }}
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                autoFocus
                                value={form.username}
                                onChange={(e) => {
                                    setFieldError(null)
                                    dispatch({ type: 'username', payload: e.target.value })
                                }}
                                placeholder="your-username"
                                disabled={isPending}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition focus:ring-2 disabled:opacity-60"
                                style={{
                                    border: `1.5px solid ${fieldError && !form.username.trim() ? '#e74c3c' : BORDER}`,
                                    backgroundColor: SURFACE,
                                    color: GREEN_DEEP,
                                    // @ts-expect-error CSS custom property
                                    '--tw-ring-color': GREEN,
                                }}
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold"
                                style={{ color: GREEN_DEEP }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={(e) => {
                                        setFieldError(null)
                                        dispatch({ type: 'password', payload: e.target.value })
                                    }}
                                    placeholder="••••••••"
                                    disabled={isPending}
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition focus:ring-2 disabled:opacity-60"
                                    style={{
                                        border: `1.5px solid ${fieldError && !form.password ? '#e74c3c' : BORDER}`,
                                        backgroundColor: SURFACE,
                                        color: GREEN_DEEP,
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((p) => !p)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
                                    style={{ color: TEXT_LIGHT }}
                                    tabIndex={-1}
                                >
                                    {showPass ? (
                                        <MdVisibilityOff className="text-xl" />
                                    ) : (
                                        <MdVisibility className="text-xl" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Field-level error */}
                        {fieldError && (
                            <p className="text-sm font-medium text-red-600 -mt-2">{fieldError}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3.5 rounded-xl text-base font-bold text-white transition flex items-center justify-center gap-2 mt-1 disabled:opacity-70"
                            style={{ backgroundColor: isPending ? '#3d5c42' : GREEN }}
                        >
                            {isPending ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in…
                                </>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </form>

                    {/* Help text */}
                    <p className="text-xs text-center mt-6" style={{ color: TEXT_LIGHT }}>
                        Don&apos;t have an account? Contact your i-sabi account manager.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
