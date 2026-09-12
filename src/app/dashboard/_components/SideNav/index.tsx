'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { TbLogout2 } from 'react-icons/tb'
import Logo from '@/assets/logo.png'
import LogoutModal from '@/components/LogoutModal'
import { ROUTES } from '@/constants/routes'
import useAuthStore from '@/hooks/useAuth'
import { primeAdzCache } from '@/lib/adz-cache'
import { clearPersistedQueryCache } from '@/providers/QueryProvider'
import { dashboardNavs } from '@/constants/nav'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GOLD       = '#F5C518'
const BORDER     = '#1a3620'
const TEXT_LIGHT = '#6b8f70'

const SideNav = () => {
    const nav = dashboardNavs
    const [logoutModalIsOpen, setLogoutModalOpen] = useState(false)
    const pathname    = usePathname()
    const router      = useRouter()
    const queryClient = useQueryClient()
    const token       = useAuthStore((s) => s.token)
    const reset       = useAuthStore((s) => s.reset)

    const handleLogout = () => {
        queryClient.clear()
        clearPersistedQueryCache()
        reset()
        router.replace('/')
    }

    const warmRoute = (href: string) => {
        router.prefetch(href)
        if (href === ROUTES.OWNER.ADZ.INDEX) {
            router.prefetch(ROUTES.OWNER.ADZ.CREATE)
            if (token) void primeAdzCache(queryClient, token)
        }
    }

    return (
        <div
            className="hidden md:flex flex-col min-h-screen h-screen w-64 shrink-0 relative overflow-hidden"
            style={{ backgroundColor: GREEN_DEEP }}
        >
            <LogoutModal
                logout={handleLogout}
                isOpen={logoutModalIsOpen}
                setIsOpen={setLogoutModalOpen}
            />

            {/* Decorative rings — same as login page left panel */}
            <div
                className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none opacity-10"
                style={{ border: `80px solid ${GOLD}` }}
            />
            <div
                className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full pointer-events-none opacity-5"
                style={{ border: `60px solid ${GOLD}` }}
            />

            {/* Content above decoration */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo + brand label */}
                <div
                    className="px-6 pt-7 pb-5"
                    style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                    <Link href={ROUTES.OWNER.INDEX}>
                        <Image
                            src={Logo}
                            alt="i-sabi"
                            style={{ width: '7rem', height: 'auto' }}
                            className="brightness-0 invert"
                            priority
                        />
                    </Link>
                    <p
                        className="text-xs font-bold tracking-widest uppercase mt-2"
                        style={{ color: GOLD }}
                    >
                        Event Owner Dashboard
                    </p>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
                    {nav.map((section, index) => (
                        <div
                            key={section.id}
                            className={index < nav.length - 1 ? 'mb-5 pb-5' : ''}
                            style={index < nav.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : {}}
                        >
                            {section.title && (
                                <p
                                    className="text-xs font-bold uppercase tracking-widest px-3 mb-2"
                                    style={{ color: TEXT_LIGHT }}
                                >
                                    {section.title}
                                </p>
                            )}
                            <div className="flex flex-col gap-1">
                                {section.navItems.map((item) => {
                                    const active =
                                        (item.root && pathname === '/dashboard') ||
                                        (!item.root && pathname.startsWith(item.link))
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.link}
                                            onMouseEnter={() => warmRoute(item.link)}
                                            onFocus={() => warmRoute(item.link)}
                                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors"
                                            style={{
                                                backgroundColor: active ? GREEN : 'transparent',
                                                color: active ? '#ffffff' : TEXT_LIGHT,
                                            }}
                                        >
                                            <item.Icon className="text-lg shrink-0" />
                                            <span>{item.title}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div
                    className="px-3 pb-6"
                    style={{ borderTop: `1px solid ${BORDER}` }}
                >
                    <button
                        onClick={() => setLogoutModalOpen(true)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-white/5 mt-3"
                    >
                        <TbLogout2 className="text-lg shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SideNav
