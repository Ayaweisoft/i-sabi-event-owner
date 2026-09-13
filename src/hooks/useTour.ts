import { create } from 'zustand'

// Bump this suffix whenever the tour steps change meaningfully, so
// returning owners see the updated walkthrough instead of it being
// silently skipped because an old flag is still in localStorage.
export const TOUR_SEEN_KEY = 'isabi_owner_tour_seen_v1'

interface TourState {
    isRunning: boolean
    stepIndex: number
    start: () => void
    stop: () => void
    next: () => void
    prev: () => void
    goTo: (index: number) => void
}

export const useTourStore = create<TourState>((set) => ({
    isRunning: false,
    stepIndex: 0,
    start: () => set({ isRunning: true, stepIndex: 0 }),
    stop: () => set({ isRunning: false }),
    next: () => set((s) => ({ stepIndex: s.stepIndex + 1 })),
    prev: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
    goTo: (index) => set({ stepIndex: index }),
}))

export const markTourSeen = () => {
    try {
        localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
        // localStorage unavailable (private mode, etc.) — non-critical
    }
}

export const hasSeenTour = () => {
    try {
        return localStorage.getItem(TOUR_SEEN_KEY) === '1'
    } catch {
        return true
    }
}
