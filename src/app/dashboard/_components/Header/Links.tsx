'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { TbLogout2 } from 'react-icons/tb'
import { MdOutlineClose } from 'react-icons/md'
import Logo from '@/assets/logo.png'
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { primeAdzCache } from '@/lib/adz-cache'
import { clearPersistedQueryCache } from '@/providers/QueryProvider'
import { dashboardNavs } from '@/constants/nav'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const GOLD       = '#F5C518'
const BORDER     = '#1a3620'
const TEXT_LIGHT = '#6b8f70'

interface IProps {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const Links = ({ isOpen, setIsOpen }: IProps) => {
    const nav      = dashboardNavs
    const pathname = usePathname()
    const router   = useRouter()
    const reset    = useAuthStore((s) => s.reset)
    const token    = useAuthStore((s) => s.token)
    const queryClient = useQueryClient()

    // Close drawer on route change
    useEffect(() => {
        setIsOpen(false)
    }, [pathname, setIsOpen])

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
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer — slides from left, matching SideNav/login-page aesthetic */}
            <div
                className={`md:hidden fixed top-0 left-0 w-5/6 max-w-xs min-h-screen h-screen z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
                style={{ backgroundColor: GREEN_DEEP }}
            >
                {/* Decorative rings — matching login page + desktop SideNav */}
                <div
                    className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none opacity-10"
                    style={{ border: `80px solid ${GOLD}` }}
                />
                <div
                    className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full pointer-events-none opacity-5"
                    style={{ border: `60px solid ${GOLD}` }}
                />

                {/* Content above decoration */}
                <div className="relative z-10 flex flex-col h-full overflow-y-auto">

                    {/* Header: logo + close */}
                    <div
                        className="flex items-center justify-between px-5 py-5 shrink-0"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                        <div>
                            <Link href={ROUTES.OWNER.INDEX} onClick={() => setIsOpen(false)}>
                                <Image
                                    src={Logo}
                                    alt="i-sabi"
                                    style={{ width: '6rem', height: 'auto' }}
                                    className="brightness-0 invert"
                                    priority
                                />
                            </Link>
                            <p
                                className="text-xs font-bold tracking-widest uppercase mt-1.5"
                                style={{ color: GOLD }}
                            >
                                Event Owner Dashboard
                            </p>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-xl transition hover:bg-white/10 shrink-0"
                            style={{ color: TEXT_LIGHT }}
                            aria-label="Close menu"
                        >
                            <MdOutlineClose className="text-2xl text-white" />
                        </button>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 px-3 py-4 text-sm">
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
                                                className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-colors"
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
                        className="px-3 pb-8 shrink-0"
                        style={{ borderTop: `1px solid ${BORDER}` }}
                    >
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 w-full font-medium transition-colors text-red-400 hover:text-red-300 hover:bg-white/5 mt-3"
                        >
                            <TbLogout2 className="text-lg shrink-0" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Links
