'use client'
import React from 'react'
import { QueryClient, QueryClientProvider, dehydrate, hydrate } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const QUERY_CACHE_STORAGE_KEY = 'isabi-query-cache-v1'
const QUERY_CACHE_MAX_AGE = 15 * 60 * 1000

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

const restorePersistedQueryCache = (queryClient: QueryClient) => {
    if (typeof window === 'undefined') return queryClient

    const raw = window.sessionStorage.getItem(QUERY_CACHE_STORAGE_KEY)
    if (!raw) return queryClient

    try {
        const parsed = JSON.parse(raw) as { timestamp?: number; state?: unknown }
        if (!parsed.timestamp || Date.now() - parsed.timestamp > QUERY_CACHE_MAX_AGE) {
            window.sessionStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
            return queryClient
        }

        if (parsed.state) {
            hydrate(queryClient, parsed.state)
        }
    } catch {
        window.sessionStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
    }

    return queryClient
}

const persistQueryCache = (queryClient: QueryClient) => {
    if (typeof window === 'undefined') return

    const state = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) => query.state.status === 'success',
    })

    window.sessionStorage.setItem(
        QUERY_CACHE_STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now(), state }),
    )
}

export const clearPersistedQueryCache = () => {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
    }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => restorePersistedQueryCache(getQueryClient()))

    React.useEffect(() => {
        let timeoutId: number | undefined

        const unsubscribe = queryClient.getQueryCache().subscribe(() => {
            window.clearTimeout(timeoutId)
            timeoutId = window.setTimeout(() => persistQueryCache(queryClient), 250)
        })

        return () => {
            unsubscribe()
            window.clearTimeout(timeoutId)
        }
    }, [queryClient])

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
