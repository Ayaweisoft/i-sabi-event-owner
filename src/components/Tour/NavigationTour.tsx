'use client'
import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MdClose } from 'react-icons/md'
import { TOUR_STEPS } from '@/constants/tour'
import { ROUTES } from '@/constants/routes'
import { hasSeenTour, markTourSeen, useTourStore } from '@/hooks/useTour'

const GREEN      = '#2d8c3e'
const GREEN_DEEP = '#07360E'

const AUTO_START_DELAY = 900
const MARGIN = 16
const SPOT_PAD = 8

// Picks the first on-screen match for a `data-tour` id — the same id can
// exist twice (desktop SideNav vs. the mobile drawer in Links.tsx), and
// only one of those is ever actually visible at a time.
function resolveTarget(name: string): HTMLElement | null {
    const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)
    for (const el of Array.from(candidates)) {
        const rect = el.getBoundingClientRect()
        const onScreen = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
            rect.top < window.innerHeight && rect.left < window.innerWidth
        if (onScreen) return el
    }
    return null
}

const NavigationTour = () => {
    const isRunning = useTourStore((s) => s.isRunning)
    const stepIndex = useTourStore((s) => s.stepIndex)
    const start      = useTourStore((s) => s.start)
    const stop       = useTourStore((s) => s.stop)
    const goTo       = useTourStore((s) => s.goTo)

    const [mounted, setMounted] = useState(false)
    const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const directionRef = useRef<1 | -1>(1)
    const tooltipRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    // Auto-launch once per browser, giving the layout a moment to settle.
    useEffect(() => {
        if (hasSeenTour()) return
        const t = setTimeout(() => start(), AUTO_START_DELAY)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const step = TOUR_STEPS[stepIndex]

    const finish = useCallback(() => {
        markTourSeen()
        stop()
    }, [stop])

    const advance = useCallback((dir: 1 | -1) => {
        directionRef.current = dir
        const nextIndex = stepIndex + dir
        if (nextIndex < 0) return
        if (nextIndex >= TOUR_STEPS.length) { finish(); return }
        goTo(nextIndex)
    }, [stepIndex, goTo, finish])

    // Locate (or skip) the current step's target every time the step changes.
    useLayoutEffect(() => {
        if (!isRunning || !step) return
        if (!step.target) { setSpot(null); return }

        const el = resolveTarget(step.target)
        if (!el) {
            const dir = directionRef.current
            const nextIndex = stepIndex + dir
            if (nextIndex < 0 || nextIndex >= TOUR_STEPS.length) { finish(); return }
            goTo(nextIndex)
            return
        }

        const update = () => {
            const rect = el.getBoundingClientRect()
            setSpot({
                top: rect.top - SPOT_PAD,
                left: rect.left - SPOT_PAD,
                width: rect.width + SPOT_PAD * 2,
                height: rect.height + SPOT_PAD * 2,
            })
        }
        update()
        window.addEventListener('resize', update)
        window.addEventListener('scroll', update, true)
        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('scroll', update, true)
        }
    }, [isRunning, step, stepIndex, goTo, finish])

    // Position the tooltip relative to the spotlight, clamped to the viewport.
    useLayoutEffect(() => {
        const tt = tooltipRef.current
        if (!isRunning || !tt || !step) return
        const ttRect = tt.getBoundingClientRect()
        let top: number
        let left: number

        if (!spot) {
            top = window.innerHeight / 2 - ttRect.height / 2
            left = window.innerWidth / 2 - ttRect.width / 2
        } else {
            switch (step.placement) {
                case 'left':
                    top = spot.top + spot.height / 2 - ttRect.height / 2
                    left = spot.left - ttRect.width - MARGIN
                    break
                case 'bottom':
                    top = spot.top + spot.height + MARGIN
                    left = spot.left + spot.width / 2 - ttRect.width / 2
                    break
                case 'top':
                    top = spot.top - ttRect.height - MARGIN
                    left = spot.left + spot.width / 2 - ttRect.width / 2
                    break
                case 'right':
                default:
                    top = spot.top + spot.height / 2 - ttRect.height / 2
                    left = spot.left + spot.width + MARGIN
                    break
            }
        }

        top = Math.min(Math.max(top, MARGIN), window.innerHeight - ttRect.height - MARGIN)
        left = Math.min(Math.max(left, MARGIN), window.innerWidth - ttRect.width - MARGIN)
        setPos({ top, left })
    }, [isRunning, spot, step])

    useEffect(() => {
        document.body.style.overflow = isRunning ? 'hidden' : 'unset'
        return () => { document.body.style.overflow = 'unset' }
    }, [isRunning])

    useEffect(() => {
        if (!isRunning) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') finish()
            else if (e.key === 'ArrowRight') advance(1)
            else if (e.key === 'ArrowLeft') advance(-1)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isRunning, advance, finish])

    if (!mounted || !isRunning || !step) return null

    const isFirst = stepIndex === 0
    const isLast = step.id === 'finish'

    return createPortal(
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Dashboard tour">
            {/* Blocks interaction with the page while the tour is active */}
            <div className="absolute inset-0" />

            {spot ? (
                <div
                    className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
                    style={{
                        top: spot.top,
                        left: spot.left,
                        width: spot.width,
                        height: spot.height,
                        boxShadow: '0 0 0 9999px rgba(7,54,14,0.65)',
                        outline: `2px solid ${GREEN}`,
                        outlineOffset: 2,
                    }}
                />
            ) : (
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(7,54,14,0.65)' }} />
            )}

            <div
                ref={tooltipRef}
                className="fixed z-[101] w-[90vw] max-w-sm flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-2xl"
                style={{ top: pos.top, left: pos.left }}
            >
                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold" style={{ color: GREEN_DEEP }}>{step.title}</h3>
                    <button
                        onClick={finish}
                        aria-label="Close tour"
                        className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-[#f4f8f4] hover:text-foreground"
                    >
                        <MdClose className="text-lg" />
                    </button>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                {isLast && (
                    <Link
                        href={ROUTES.OWNER.GUIDE}
                        onClick={finish}
                        className="text-sm font-semibold"
                        style={{ color: GREEN }}
                    >
                        Open the User Guide →
                    </Link>
                )}

                <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{stepIndex + 1} / {TOUR_STEPS.length}</span>
                    <div className="flex items-center gap-2">
                        {!isFirst && (
                            <button
                                onClick={() => advance(-1)}
                                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-[#f4f8f4]"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => (isLast ? finish() : advance(1))}
                            className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white transition"
                            style={{ backgroundColor: GREEN }}
                        >
                            {isLast ? 'Done' : isFirst ? 'Start' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default NavigationTour
