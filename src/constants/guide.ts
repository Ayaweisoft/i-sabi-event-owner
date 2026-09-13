import type { IconType } from 'react-icons'
import {
    MdRocketLaunch, MdDashboard, MdEvent, MdCampaign, MdDynamicForm, MdGroupWork,
    MdArticle, MdAccountBalanceWallet, MdOutlineAccountBalance, MdReceiptLong,
    MdNotifications, MdVerifiedUser, MdPersonOutline,
} from 'react-icons/md'
import { ROUTES } from './routes'

export interface GuideSection {
    id: string
    title: string
    icon: IconType
    summary: string
    // Short paragraphs of body copy.
    body?: string[]
    // Numbered "how to" steps.
    steps?: string[]
    // Callout tips shown at the end of the section.
    tips?: string[]
    link?: { href: string; label: string }
}

export const GUIDE_SECTIONS: GuideSection[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: MdRocketLaunch,
        summary: 'The fastest path from a new event to your first payout.',
        steps: [
            'Open Overview to see your wallet balance, live events and anything that needs your attention.',
            'Go to Events and pick the event you want to manage — tickets, check-in, contestants, votes and form submissions all live inside it under tabs.',
            'Running a voting event? Set up your contestants and vote categories, then tune vote visibility and free votes under that event\'s Voting Settings.',
            'Need registrations or applications? Create a Form — free or paid — and share it.',
            'Get more eyes on your event with an Adz campaign across the i-sabi app.',
            'Watch your balance grow in Wallet, then send it to your bank from Withdraw whenever you\'re ready.',
        ],
        tips: [
            'Events themselves are created on the i-sabi app — this dashboard is where you manage and grow one once it exists.',
            'Click the help icon (headset-and-book icon) in the top bar any time to replay the guided tour or jump back to this page.',
        ],
    },
    {
        id: 'overview',
        title: 'Dashboard Overview',
        icon: MdDashboard,
        summary: 'Your home base — everything important, at a glance.',
        body: [
            'The Overview page is the first thing you see. Your wallet balance sits front and center with quick shortcuts to withdraw or view the full wallet.',
            'Below it, the quick-stats grid rolls up totals across every event you own: events, tickets sold, votes cast, form submissions and total earnings.',
        ],
        steps: [
            '"Live Right Now" lists any events currently running — click one to jump straight to it.',
            '"Actions Needed" surfaces alerts (like a stalled payout or a review needed) so nothing slips through.',
            '"Recent Activity" is a live feed of ticket sales, check-ins, votes and form submissions as they happen, newest first.',
        ],
    },
    {
        id: 'events',
        title: 'Events',
        icon: MdEvent,
        summary: 'Manage tickets, check-in, contestants, votes and submissions for one event.',
        body: [
            'The Events list shows every event you own with its type (Ticketing, Voting or Form-Sales) and status (Approved, Pending, Rejected). Filter by either to find one quickly.',
            'Opening an event gives you its full control panel: sales trend, audience insights, a health score, and CSV export of your audience — plus a set of tabs depending on the event type.',
        ],
        steps: [
            'Tickets tab — see every ticket sold and its buyer.',
            'Check-in tab — check guests in at the door and track attendance in real time.',
            'Contestants tab — add, edit or remove contestants, and grab shareable voting links for each one.',
            'Votes tab — watch the leaderboard update, see who voted for whom, and manage vote categories.',
            'Submissions tab — review entries from any form attached to this specific event.',
        ],
        tips: [
            'For voting events, Voting Settings (inside the event) controls whether vote counts are public and how many free votes each voter gets — useful for keeping the race competitive.',
        ],
        link: { href: ROUTES.OWNER.EVENTS, label: 'Go to Events' },
    },
    {
        id: 'adz',
        title: 'Adz Campaigns',
        icon: MdCampaign,
        summary: 'Promote an event across the i-sabi app in five short steps.',
        body: [
            'Adz puts your event in front of more people — on the home feed, in chat, between games, on voting/ticketing confirmation screens, and more.',
        ],
        steps: [
            'Goal and format — choose what the campaign is for and how it should look.',
            'Creative — upload the image or copy people will actually see.',
            'Placement and targeting — pick where in the app it shows up.',
            'Budget and schedule — set how much to spend and for how long.',
            'Review and submit — double-check everything, then send it for review.',
        ],
        tips: [
            'A submitted campaign is reviewed before it goes live. Track its status and performance from the Adz list once it\'s in.',
            'Drafts are saved as you go, so you can start a campaign and finish the wizard later.',
        ],
        link: { href: ROUTES.OWNER.ADZ.INDEX, label: 'Go to Adz' },
    },
    {
        id: 'forms',
        title: 'Forms',
        icon: MdDynamicForm,
        summary: 'Collect registrations or applications with a custom, shareable form.',
        body: [
            'Forms let you gather structured information — anything from a simple registration to a paid application — with fields you define yourself, attached to one of your events.',
        ],
        steps: [
            'Create a form and add the fields you need.',
            'Set it as free or attach a price if it should charge on submission.',
            'Share the form; it stays Active while accepting responses.',
            'Switch between card and table view to browse your forms, and open one to see field counts and status.',
        ],
        tips: [
            'Every response, from every form, also rolls up into Submissions for one searchable, exportable view.',
        ],
        link: { href: ROUTES.OWNER.FORMS.INDEX, label: 'Go to Forms' },
    },
    {
        id: 'groups',
        title: 'Event Groups',
        icon: MdGroupWork,
        summary: 'Bundle several of your own events under one shared identity.',
        body: [
            'An Event Group ("classic") is a lightweight bundle of your own events — any mix of ticketing, voting or form-sales — behind one name and image. Handy for a season, a franchise, or a set of related events you want people to think of as one thing.',
        ],
        steps: [
            'Create a group, give it a name, description and image.',
            'Add any of your existing events to it.',
            'Edit the group or its event list any time from Event Groups.',
        ],
        link: { href: ROUTES.OWNER.GROUPS.INDEX, label: 'Go to Event Groups' },
    },
    {
        id: 'submissions',
        title: 'Submissions',
        icon: MdArticle,
        summary: 'Every form response, across every event, in one searchable place.',
        body: [
            'Instead of checking each form separately, Submissions gives you one combined, searchable table of everyone who has filled anything in — with the event and form each entry belongs to.',
        ],
        steps: [
            'Search by name or any field value to find a specific respondent fast.',
            'Click a row to see every field they submitted.',
            'Export the current results to CSV for record-keeping or sharing with your team.',
        ],
        link: { href: ROUTES.OWNER.SUBMISSIONS, label: 'Go to Submissions' },
    },
    {
        id: 'wallet',
        title: 'Wallet & Earnings',
        icon: MdAccountBalanceWallet,
        summary: 'Track what you\'ve earned and where it came from.',
        body: [
            'Wallet shows your current balance and a breakdown of revenue by source — ticketing, voting and forms — so you can see at a glance what\'s driving your income.',
        ],
        steps: [
            'Check the revenue chart to compare income across sources over time.',
            'Review individual transactions, marked as credits or debits.',
            'Tap Withdraw from here whenever you want to move money to your bank.',
        ],
        link: { href: ROUTES.OWNER.WALLET, label: 'Go to Wallet' },
    },
    {
        id: 'withdraw',
        title: 'Withdraw',
        icon: MdOutlineAccountBalance,
        summary: 'Send your wallet balance to your bank account.',
        steps: [
            'Add your bank account — pick your bank and enter the account number.',
            'Verify it; the account name comes back automatically so you can confirm it\'s correct.',
            'Enter an amount up to your available balance and confirm the withdrawal.',
        ],
        tips: [
            'You can save a bank account as your default so future withdrawals are one step faster.',
        ],
        link: { href: ROUTES.OWNER.WITHDRAW.INDEX, label: 'Go to Withdraw' },
    },
    {
        id: 'transactions',
        title: 'Transactions',
        icon: MdReceiptLong,
        summary: 'The full ledger of money moving through your events.',
        body: [
            'Every sale and every withdrawal shows up here as a line item — useful for reconciling your own books or answering "where did this payment come from?".',
        ],
        link: { href: ROUTES.OWNER.TRANSACTIONS, label: 'Go to Transactions' },
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: MdNotifications,
        summary: 'Stay on top of sales, votes, check-ins and account alerts.',
        body: [
            'The bell icon in the header follows you everywhere — a red badge means there\'s something new. Open Notifications for the full history.',
        ],
        link: { href: ROUTES.OWNER.NOTIFICATIONS, label: 'Go to Notifications' },
    },
    {
        id: 'reconciliation',
        title: 'Reconciliation',
        icon: MdVerifiedUser,
        summary: 'Confirms every paid ticket, vote and form entry was actually delivered.',
        body: [
            'Behind the scenes, a successful payment has to be "delivered" as a ticket, a vote or a form confirmation. Reconciliation tracks that delivery and flags anything pending or failed so you can follow up before it becomes a customer complaint.',
        ],
        steps: [
            'Check the delivered rate to see overall health across your events.',
            'Review Recent Issues for any payment stuck as pending or failed delivery.',
        ],
        link: { href: ROUTES.OWNER.RECONCILIATION, label: 'Go to Reconciliation' },
    },
    {
        id: 'account',
        title: 'Your Account',
        icon: MdPersonOutline,
        summary: 'Where your profile lives and how to sign out.',
        body: [
            'Click your name in the top-right corner to see your username and email, and to sign out. On mobile, the same menu is behind the hamburger icon in the top-left.',
        ],
    },
]

export interface GuideFaq {
    q: string
    a: string
}

export const GUIDE_FAQS: GuideFaq[] = [
    {
        q: 'How do I create a new event?',
        a: 'Events are created on the i-sabi app itself. Once one exists under your account, it appears in Events here, where you manage tickets, contestants, votes, forms and everything else about it.',
    },
    {
        q: 'How do vote counts and free votes work?',
        a: 'Open a voting event and go to its Voting Settings. From there you can choose whether vote counts are visible to the public and set how many free votes each voter gets before they need to pay for more.',
    },
    {
        q: 'Where does my money go after a sale?',
        a: 'It lands in your Wallet balance. From there you can withdraw it to a verified bank account at any time from the Withdraw page.',
    },
    {
        q: 'Why hasn\'t a buyer received their ticket or vote confirmation?',
        a: 'Check Reconciliation — it tracks whether a successful payment was fully delivered as a ticket, vote or form entry, and flags anything stuck as pending or failed so you know exactly what to follow up on.',
    },
    {
        q: 'What\'s the difference between Forms and Submissions?',
        a: 'Forms is where you build and manage the forms themselves. Submissions is the combined, searchable inbox of every response across all of them — the easiest place to search for one person\'s entry.',
    },
    {
        q: 'What is an Event Group?',
        a: 'A named, shareable bundle of your own events — any mix of ticketing, voting or forms — grouped under one identity and image. Useful when you run a series of related events.',
    },
    {
        q: 'Can I see this tour again?',
        a: 'Yes — open the help menu (the icon next to the notification bell) and choose "Take the tour" any time.',
    },
]
