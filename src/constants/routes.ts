export const ROUTES = {
    AUTH: {
        LOGIN: "/",
        RECOVER_PASSWORD: "/recover-password/",
    },

    HOME: "/",
    DASHBOARD: "/dashboard",
    PROFILE: "/profile",

    OWNER: {
        INDEX: "/dashboard",
        EVENTS: "/dashboard/events",
        EVENT: (id: string) => `/dashboard/events/${id}`,
        ADZ: {
            INDEX: "/dashboard/adz",
            CREATE: "/dashboard/adz/new",
            DETAIL: (id: string) => `/dashboard/adz/${id}`,
            EDIT: (id: string) => `/dashboard/adz/${id}/edit`,
        },
        FORMS: {
            INDEX: "/dashboard/forms",
            DETAIL: (id: string) => `/dashboard/forms/${id}`,
        },
        WALLET: "/dashboard/wallet",
        NOTIFICATIONS: "/dashboard/notifications",
        TRANSACTIONS: "/dashboard/transactions",
        SUBMISSIONS: "/dashboard/submissions",
        WITHDRAW: {
            INDEX: "/dashboard/withdraw",
            CREATE: "/dashboard/withdraw",
        },
        RECONCILIATION: "/dashboard/reconciliation",
    },
}