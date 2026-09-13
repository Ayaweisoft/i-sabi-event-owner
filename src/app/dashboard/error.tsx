'use client'
import { useEffect } from 'react'
import { MdErrorOutline } from 'react-icons/md'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'
const TEXT_LIGHT = '#6b8f70'

// Without this, an uncaught render error anywhere under /dashboard left the
// page content blank with nothing on screen to explain why or retry — the
// nav around it kept working (this boundary only wraps the page content,
// not the shared layout), but the broken area itself gave no signal at all.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[dashboard]', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-24 px-6">
            <div className="rounded-2xl p-3" style={{ backgroundColor: '#fdecea', color: '#e74c3c' }}>
                <MdErrorOutline className="text-3xl" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: GREEN_DEEP }}>Something went wrong</h2>
            <p className="text-sm max-w-sm" style={{ color: TEXT_LIGHT }}>
                {error.message || 'This page hit an unexpected error.'}
            </p>
            <button
                onClick={reset}
                className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: GREEN }}
            >
                Try again
            </button>
        </div>
    )
}
