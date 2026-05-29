'use client'
import { INav } from '@/interfaces';
import { BiSolidCollection } from 'react-icons/bi';
import { TbTransactionEuro } from 'react-icons/tb';
import { MdDashboard, MdEvent, MdNotifications, MdAccountBalanceWallet, MdArticle } from 'react-icons/md';

const dashboardNavs: INav[] = [
    {
        id: 10,
        title: "",
        navItems: [
            {
                id: 1,
                title: "Overview",
                link: "/dashboard",
                Icon: MdDashboard,
                root: true,
            },
            {
                id: 2,
                title: "Events",
                link: "/dashboard/events",
                Icon: MdEvent,
            },
            {
                id: 3,
                title: "Wallet",
                link: "/dashboard/wallet",
                Icon: MdAccountBalanceWallet,
            },
            {
                id: 4,
                title: "Submissions",
                link: "/dashboard/submissions",
                Icon: MdArticle,
            },
            {
                id: 5,
                title: "Notifications",
                link: "/dashboard/notifications",
                Icon: MdNotifications,
            },
            {
                id: 6,
                title: "Transactions",
                link: "/dashboard/transactions",
                Icon: TbTransactionEuro,
            },
            {
                id: 7,
                title: "Withdraw",
                link: "/dashboard/withdraw",
                Icon: BiSolidCollection,
            },
        ],
    },
]

export {
    dashboardNavs
}
