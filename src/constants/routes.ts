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
        WALLET: "/dashboard/wallet",
        NOTIFICATIONS: "/dashboard/notifications",
        TRANSACTIONS: "/dashboard/transactions",
        SUBMISSIONS: "/dashboard/submissions",
        WITHDRAW: {
            INDEX: "/dashboard/withdraw",
            CREATE: "/dashboard/withdraw",
        },
    },
}