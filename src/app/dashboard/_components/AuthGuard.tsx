"use client"
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/hooks/useAuth'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const token  = useAuthStore((state) => state.token)

    useEffect(() => {
        if (!token) router.replace('/')
    }, [token, router])

    if (!token) {
        return (
            <div
                className="flex items-center justify-center w-screen h-screen"
                style={{ backgroundColor: '#f4f8f4' }}
            >
                <div className="w-6 h-6 border-2 border-[#2d8c3e]/30 border-t-[#2d8c3e] rounded-full animate-spin" />
            </div>
        )
    }

    return <>{children}</>
}
