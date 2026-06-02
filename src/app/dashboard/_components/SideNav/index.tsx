'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { TbLogout2 } from 'react-icons/tb'
import Image from 'next/image'
import Logo from "@/assets/logo.png"
import LogoutModal from '@/components/LogoutModal'
import { ROUTES } from '@/constants/routes'
import useAuthStore from '@/hooks/useAuth'
import { primeAdzCache } from '@/lib/adz-cache'
import { dashboardNavs } from '@/constants/nav'


const SideNav = () => {
    const nav = dashboardNavs
    const [collapse,] = useState(false)
    const [logoutModalIsOpen, setLogoutModalOpen] = useState(false)
    const pathname = usePathname();
    const router = useRouter()
    const queryClient = useQueryClient()
    const token = useAuthStore((state) => state.token)

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
    <div className={`md:flex w-full justify-between hidden max-h-screen min-h-screen h-screen text-white bg-[#07360E] ${collapse ? "max-w-20 pl-3 pb-0" : "max-w-64 pl-6 pb-0"} transition-all`}>
        <LogoutModal
            logout={() => ''}
            isOpen={logoutModalIsOpen}
            setIsOpen={setLogoutModalOpen}
        />
        <div className='rounded-2xl border border-[#1a3620] py-6 pb-0 w-full'>

            <div className='h-full overflow-hidden'>
                <div className={`flex flex-col items-center gap-6 mb-10 pb-6 border-b`}>
                    <Link href={ROUTES.OWNER.INDEX}>
                        <Image src={Logo} alt={""} className='w-28' />
                    </Link>
                </div>
                <div className='flex flex-col justify-between h-full overflow-scroll text-sm pb-52 font-inter'>
                    <div className="">
                        {
                            nav?.map((navSection, index) => (
                                <div key={navSection.id} className={`${collapse ? "" : index===nav.length-1 ? "" : "border-b mb-6 pb-5"} px-4`}>
                                    {
                                        navSection.title &&
                                            <h4 className={`${collapse ? "invisible" : ""} mb-5 text-xs uppercase`}>{navSection.title}</h4>
                                    }
                                    <div className='flex flex-col gap-3'>
                                        {
                                            navSection.navItems?.map((navItem) => (
                                                <Link key={navItem.id} href={navItem.link} onMouseEnter={() => warmRoute(navItem.link)} onFocus={() => warmRoute(navItem.link)} className={`flex items-center gap-3 cursor-pointer rounded-md px-4 py-2.5 whitespace-nowrap ${collapse ? "justify-center" : ""} ${(!navItem.root && pathname.startsWith(navItem.link)) ? "bg-[#2d8c3e] text-white font-semibold" : ((pathname==="/dashboard") && !!navItem.root) ? "bg-[#2d8c3e] text-white font-semibold" : "text-[#6b8f70] hover:text-white hover:bg-[#1a3620]"}`}>
                                                    <div>
                                                        <navItem.Icon className={"text-lg"} />
                                                    </div>
                                                    <span className={`${collapse && "hidden"}`}>{navItem.title}</span>
                                                </Link>
                                            ))
                                        }
                                    </div>
                                </div>
                            ))

                        }
                    </div>
                    <button onClick={() => setLogoutModalOpen(true)} className={`flex items-center gap-3 cursor-pointer font-medium rounded-md px-4 py-2.5 whitespace-nowrap text-red-400 mt-3 ml-4 hover:text-red-300`}>
                        <TbLogout2 className={"text-lg"} />
                        <span className={`${collapse && "hidden"}`}>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SideNav
