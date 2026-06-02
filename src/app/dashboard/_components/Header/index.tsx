'use client'
import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BiMenu } from 'react-icons/bi'
import { MdOutlineClose, MdNotifications } from 'react-icons/md'
import { TbLogout2 } from 'react-icons/tb'
import Link from 'next/link'
import Links from './Links'
import useAuthStore from '@/hooks/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { clearPersistedQueryCache } from '@/providers/QueryProvider'

const PAGE_TITLES: Record<string, string> = {
    '/dashboard':               'Overview',
    '/dashboard/adz':           'Adz Campaigns',
    '/dashboard/events':        'My Events',
    '/dashboard/wallet':        'Wallet',
    '/dashboard/submissions':   'Submissions',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/transactions':  'Transactions',
    '/dashboard/withdraw':      'Withdraw',
}

const DashboardHeader = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [showLogout, setShowLogout] = useState(false)
    const pathname  = usePathname()
    const router    = useRouter()
    const queryClient = useQueryClient()
    const { doc, reset } = useAuthStore()

    const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
        key === pathname || (key !== '/dashboard' && pathname.startsWith(key))
    )?.[1] ?? 'Dashboard'

    const initials = (doc?.username || 'EO').slice(0, 2).toUpperCase()

    const handleLogout = () => {
        queryClient.clear()
        clearPersistedQueryCache()
        reset()
        router.replace('/')
    }

    return (
        <div
            className="sticky top-0 left-0 z-30 flex flex-col w-full shadow-sm"
            style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #d4e8d6' }}
        >
            <div className="flex items-center justify-between w-full gap-4 px-6 py-3.5">
                {/* Page title */}
                <h1 className="text-base font-bold" style={{ color: '#07360E' }}>
                    {pageTitle}
                </h1>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications bell */}
                    <Link
                        href={ROUTES.OWNER.NOTIFICATIONS}
                        className="p-2 rounded-xl transition hover:bg-[#f4f8f4]"
                        style={{ color: '#6b8f70' }}
                    >
                        <MdNotifications className="text-xl" />
                    </Link>

                    {/* Avatar / user dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setShowLogout((v) => !v)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl transition hover:bg-[#f4f8f4]"
                        >
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                                style={{ backgroundColor: '#2d8c3e' }}
                            >
                                {initials}
                            </div>
                            <span className="text-sm font-semibold" style={{ color: '#07360E' }}>
                                {doc?.username || 'Owner'}
                            </span>
                        </button>

                        {showLogout && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowLogout(false)}
                                />
                                <div
                                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg z-20 p-1"
                                    style={{ border: '1px solid #d4e8d6' }}
                                >
                                    <div className="px-3 py-2">
                                        <p className="text-xs font-semibold" style={{ color: '#07360E' }}>{doc?.username}</p>
                                        <p className="text-xs" style={{ color: '#6b8f70' }}>{doc?.email}</p>
                                    </div>
                                    <div className="border-t my-1" style={{ borderColor: '#d4e8d6' }} />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition"
                                    >
                                        <TbLogout2 className="text-base" />
                                        Sign out
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setIsOpen((v) => !v)}
                        className="p-2 md:hidden rounded-xl"
                        style={{ color: '#3d5c42' }}
                    >
                        {isOpen
                            ? <MdOutlineClose className="text-2xl" />
                            : <BiMenu className="text-2xl" />
                        }
                    </button>
                </div>
            </div>

            {/* Mobile nav */}
            <Links setIsOpen={setIsOpen} isOpen={isOpen} />
        </div>
    )
}

export default DashboardHeader
