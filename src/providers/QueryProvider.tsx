'use client'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const makeQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                staleTime:            5 * 60 * 1000,  // data fresh for 5 min — no redundant refetch
                gcTime:               10 * 60 * 1000, // keep cache for 10 min after unmount
                refetchOnWindowFocus: false,           // don't refetch when user tabs back
                refetchOnReconnect:   true,            // do refetch when network reconnects
            },
            mutations: {
                retry: 0,
            },
        },
    })

// Singleton outside component so SSR and client share the same instance
let browserQueryClient: QueryClient | undefined

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always create new client
        return makeQueryClient()
    }
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="light"
            />
        </QueryClientProvider>
    )
}
