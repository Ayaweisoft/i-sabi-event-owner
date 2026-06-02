import { INav } from '@/interfaces';
import { ROUTES } from './routes';
import { BiSolidCollection } from 'react-icons/bi';
import { TbTransactionEuro } from 'react-icons/tb';
import { MdDashboard, MdEvent, MdNotifications, MdAccountBalanceWallet, MdArticle, MdCampaign } from 'react-icons/md';

const dashboardNavs: INav[] = [
    {
        id: 10,
        title: "",
        navItems: [
            {
                id: 1,
                title: "Overview",
                link: ROUTES.OWNER.INDEX,
                Icon: MdDashboard,
                root: true,
            },
            {
                id: 2,
                title: "Events",
                link: ROUTES.OWNER.EVENTS,
                Icon: MdEvent,
            },
            {
                id: 3,
                title: "Adz",
                link: ROUTES.OWNER.ADZ.INDEX,
                Icon: MdCampaign,
            },
            {
                id: 4,
                title: "Wallet",
                link: ROUTES.OWNER.WALLET,
                Icon: MdAccountBalanceWallet,
            },
            {
                id: 5,
                title: "Submissions",
                link: ROUTES.OWNER.SUBMISSIONS,
                Icon: MdArticle,
            },
            {
                id: 6,
                title: "Notifications",
                link: ROUTES.OWNER.NOTIFICATIONS,
                Icon: MdNotifications,
            },
            {
                id: 7,
                title: "Transactions",
                link: ROUTES.OWNER.TRANSACTIONS,
                Icon: TbTransactionEuro,
            },
            {
                id: 8,
                title: "Withdraw",
                link: ROUTES.OWNER.WITHDRAW.INDEX,
                Icon: BiSolidCollection,
            },
        ],
    },
]

export {
    dashboardNavs
}
