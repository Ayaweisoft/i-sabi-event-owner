import { ROUTES } from './routes'

export type TourPlacement = 'right' | 'bottom' | 'left' | 'top' | 'center'

export interface TourStep {
    id: string
    // data-tour attribute value to spotlight. Omit for a centered, un-targeted step.
    target?: string
    title: string
    description: string
    placement: TourPlacement
}

// Drives the guided walkthrough of the owner dashboard's navigation.
// Steps target elements carrying a matching `data-tour="<target>"` attribute
// in SideNav / Links (mobile drawer) / Header. A step whose target isn't
// present or visible on screen (e.g. sidebar items on a small viewport) is
// skipped automatically — see NavigationTour's resolveTarget.
export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Welcome to your event dashboard 👋',
        description:
            "Let's take a quick 60-second tour of where everything lives. You can restart this anytime from the help menu or the User Guide page.",
        placement: 'center',
    },
    {
        id: 'nav-overview',
        target: 'nav-overview',
        title: 'Overview',
        description: 'Your home base — wallet balance, quick stats, live events, alerts that need your attention, and recent activity across every event.',
        placement: 'right',
    },
    {
        id: 'nav-events',
        target: 'nav-events',
        title: 'Events',
        description: 'Every event you own, in one list. Open one to manage tickets, check-ins, contestants and votes, form submissions, and voting settings.',
        placement: 'right',
    },
    {
        id: 'nav-adz',
        target: 'nav-adz',
        title: 'Adz Campaigns',
        description: 'Promote an event across the i-sabi app. Build a campaign in a short wizard, submit it for review, then track its performance here.',
        placement: 'right',
    },
    {
        id: 'nav-wallet',
        target: 'nav-wallet',
        title: 'Wallet',
        description: 'See how much you\'ve earned and where it came from — ticket sales, votes, and form sales — broken down and ready to withdraw.',
        placement: 'right',
    },
    {
        id: 'nav-forms',
        target: 'nav-forms',
        title: 'Forms',
        description: 'Create custom paid or free forms (e.g. registrations, applications) and review who has filled them in.',
        placement: 'right',
    },
    {
        id: 'nav-event-groups',
        target: 'nav-event-groups',
        title: 'Event Groups',
        description: 'Bundle several of your own events — of any mix (ticketing, voting, forms) — under one shareable identity.',
        placement: 'right',
    },
    {
        id: 'nav-submissions',
        target: 'nav-submissions',
        title: 'Submissions',
        description: 'Every form submission across all your events, searchable in one place, with CSV export.',
        placement: 'right',
    },
    {
        id: 'nav-notifications',
        target: 'nav-notifications',
        title: 'Notifications',
        description: 'Sales, votes, check-ins and account alerts land here as they happen.',
        placement: 'right',
    },
    {
        id: 'nav-transactions',
        target: 'nav-transactions',
        title: 'Transactions',
        description: 'A full ledger of the money moving through your events — sales in, withdrawals out.',
        placement: 'right',
    },
    {
        id: 'nav-withdraw',
        target: 'nav-withdraw',
        title: 'Withdraw',
        description: 'Move your wallet balance to a bank account whenever you\'re ready.',
        placement: 'right',
    },
    {
        id: 'nav-reconciliation',
        target: 'nav-reconciliation',
        title: 'Reconciliation',
        description: 'Confirms that every paid ticket, vote and form entry was actually delivered — flags anything stuck or failed so you can follow up.',
        placement: 'right',
    },
    {
        id: 'header-notifications',
        target: 'header-notifications',
        title: 'Notification bell',
        description: 'A shortcut to your notifications from anywhere in the dashboard — the red badge shows how many need a look.',
        placement: 'bottom',
    },
    {
        id: 'header-help',
        target: 'header-help',
        title: 'Help, whenever you need it',
        description: 'Come back to this tour, or open the full User Guide, from this menu at any time.',
        placement: 'bottom',
    },
    {
        id: 'finish',
        title: "You're all set 🎉",
        description: `That's the full tour. For step-by-step instructions on any feature, open the User Guide from the help menu — it goes deeper than a quick tour can.`,
        placement: 'center',
    },
]

export const GUIDE_ROUTE = ROUTES.OWNER.GUIDE

// Deterministic data-tour id for a sidebar nav item, derived from its title
// so SideNav/Links.tsx don't need extra fields threaded through INavItems.
export const navTourId = (title: string) => `nav-${title.toLowerCase().replace(/\s+/g, '-')}`
