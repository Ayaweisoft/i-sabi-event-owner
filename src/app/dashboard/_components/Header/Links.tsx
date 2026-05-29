'use client'
import { INav } from '@/interfaces'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { TbLogout2 } from 'react-icons/tb'
import Image from 'next/image'
import Logo from "@/assets/logo.png"
import useAuthStore from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

interface IProps {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    nav: INav[]
}

const Links = ({ isOpen, setIsOpen, nav }: IProps) => {
    const pathname = usePathname()
    const router   = useRouter()
    const reset    = useAuthStore((s) => s.reset)

    useEffect(() => {
        setIsOpen(false)
    }, [pathname, setIsOpen])

    const handleLogout = () => {
        reset()
        router.replace('/')
    }

    return (
        <div
            className={`md:hidden shadow fixed top-0 right-0 w-5/6 min-h-screen h-screen px-4 py-2 z-30 transition-all duration-300 rounded-tl-2xl overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ backgroundColor: '#07360E' }}
        >
            <div className="pt-16 mb-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-4 mb-8 pb-6" style={{ borderBottom: '1px solid #1a3620' }}>
                    <Link href={ROUTES.OWNER.INDEX}>
                        <Image src={Logo} alt="i-sabi" className="w-24 brightness-0 invert" />
                    </Link>
                </div>

                {/* Nav items */}
                <div className="flex flex-col gap-1 px-2 text-sm pb-24">
                    {nav.map((section) => (
                        <div key={section.id}>
                            {section.title && (
                                <p className="text-xs uppercase tracking-widest mb-3 px-3" style={{ color: '#6b8f70' }}>
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
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition"
                                        style={{
                                            backgroundColor: active ? '#2d8c3e' : 'transparent',
                                            color: active ? '#ffffff' : '#6b8f70',
                                        }}
                                    >
                                        <item.Icon className="text-lg" />
                                        <span>{item.title}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-400 hover:text-red-300 transition mt-4"
                    >
                        <TbLogout2 className="text-lg" />
                        <span>Sign out</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Links
