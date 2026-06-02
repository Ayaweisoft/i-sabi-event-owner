'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { TbLogout2 } from 'react-icons/tb'
import { MdOutlineClose } from 'react-icons/md'
import Image from 'next/image'
import Logo from "@/assets/logo.png"
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { primeAdzCache } from '@/lib/adz-cache'
import { clearPersistedQueryCache } from '@/providers/QueryProvider'
import { dashboardNavs } from '@/constants/nav'

interface IProps {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const Links = ({ isOpen, setIsOpen }: IProps) => {
    const nav = dashboardNavs
    const pathname = usePathname()
    const router   = useRouter()
    const reset    = useAuthStore((s) => s.reset)
    const token    = useAuthStore((s) => s.token)
    const queryClient = useQueryClient()

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
            if (token) {
                void primeAdzCache(queryClient, token)
            }
        }
    }

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer — z-50 so it sits above the sticky header (z-30) */}
            <div
                className={`md:hidden fixed top-0 right-0 w-5/6 max-w-xs min-h-screen h-screen z-50 transition-transform duration-300 ease-in-out flex flex-col overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ backgroundColor: '#07360E' }}
            >
                {/* Header row: logo + close button */}
                <div
                    className="flex items-center justify-between px-5 py-5"
                    style={{ borderBottom: '1px solid #1a3620' }}
                >
                    <Link href={ROUTES.OWNER.INDEX} onClick={() => setIsOpen(false)}>
                        <Image
                            src={Logo}
                            alt="i-sabi"
                            width={96}
                            height={Math.round(96 * (612 / 644))}
                            style={{ height: 'auto', width: '6rem' }}
                            className="brightness-0 invert"
                            priority
                        />
                    </Link>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl transition hover:bg-white/10"
                        style={{ color: '#6b8f70' }}
                        aria-label="Close menu"
                    >
                        <MdOutlineClose className="text-2xl text-white" />
                    </button>
                </div>

                {/* Nav items */}
                <div className="flex flex-col flex-1 gap-1 px-3 py-4 text-sm">
                    {nav.map((section) => (
                        <div key={section.id}>
                            {section.title && (
                                <p
                                    className="text-xs uppercase tracking-widest mb-2 px-3 mt-2"
                                    style={{ color: '#6b8f70' }}
                                >
                                    {section.title}
                                </p>
                            )}
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
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition"
                                        style={{
                                            backgroundColor: active ? '#2d8c3e' : 'transparent',
                                            color: active ? '#ffffff' : '#a3c4a8',
                                        }}
                                    >
                                        <item.Icon className="text-lg shrink-0" />
                                        <span>{item.title}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div className="px-3 pb-8" style={{ borderTop: '1px solid #1a3620' }}>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-400 hover:text-red-300 transition w-full mt-4"
                    >
                        <TbLogout2 className="text-lg" />
                        <span>Sign out</span>
                    </button>
                </div>
            </div>
        </>
    )
}

export default Links
