import { IconType } from "react-icons";

export interface IAuthContext {
    isLoggedIn: boolean;
    accessToken: string | null
    refreshToken: string | null
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    email: string | null; 
    role: RolesEnum | null;
    warehouse: string | null;
}

export interface IPagination {
    page: number;
    limit: number;
}

export interface IQuery {
    pagination?: IPagination;
    search?: string;
    vendor?: string;
    warehouse?: string;
    id?: string;
}

export interface IProductQuery {
    pagination?: IPagination;
    search?: string;
    vendor?: string;
    warehouse?: string;
}

export interface INavItems {
    id: number;
    title: string;
    link: string;
    Icon: IconType;
    root?: boolean;
}

export interface INav { 
    id: number;
    title: string;
    navItems: INavItems[];
}

export interface IUserLogin {
    username: string
    password: string
}
export interface IWithdraw {
    account: number | string
    amount: number
    settlementBank: string
    remark?: string
}
export interface IVerifyBank {
    account: string
    settlementBank: string
}
export interface IVerifyBankResponse {
    message: string
    bank: {
        confirmationMessage: string
        confirmationCode: null
        details: {
            message: {
                settlement_bank: string
                account_name: string
                account_number: string
            }
        }
    }
}

export interface IBank {
    bankName: string
    bankCode: string
}
export interface IBanksResponse {
    message: string,
    banks: {
        confirmationMessage: string,
        confirmationCode: number,
        details: {
            message: IBank[]
        }
    }
}



export interface ILoginSuccessData {
    token: string
    doc: {
        _id: string
        balance: number
        email: string
        username: string
        phone: string
    }
}

export interface IReducerAction<T> {
    type: T | 'reset' | 'setAll';
    payload: string | number | boolean | Partial<T> | null;
}

export interface IItemReducerAction<T> extends IReducerAction<T> {
    index?: number;
    field?: keyof IProductVariant;
}

export interface IOrderReducerAction<T> extends IReducerAction<T> {
    index?: number;
    field?: keyof IOrderItem | keyof IOrderCustomer;
}

export enum PaymentChannelEnum {
    pos = 'pos',
    transfer = 'transfer',
    cash = 'cash',
}


export const TierEnum = {
    one: 1,
    two: 2,
    custom: 3,
}

export enum StatusEnum {
    created = 'created',
    paid = 'payment settled',
    shipped = 'shipped',
    delivered = 'delivered',
    cancelled = 'cancelled',
}

export enum RolesEnum {
    administrator = 'Administrator',
    vendor = 'Vendor',
    partner = 'Partner',
    driver = 'Driver',
    customer = 'Customer',
}

export enum AdminRolesEnum {
    admin = 'Admin',
    superadmin = 'Superadmin',
}
  
export enum VehicleTypeEnum {
    bike = 'Bike',
    tricycle = 'Tricycle',
    car = 'Car',
    truck = 'Truck',
}

export enum VehicleOwnershipEnum {
    internal = 'internal',
    external = 'external',
}

export enum StockMovementEnum {
    sale = 'SALE',
    stock = 'STOCK',
}
  
export interface IPaginatedResponse<T> {    
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    data: T;
}

export type IProduct = {
    _id?: string;
    name: string;
    category: string | ICategory;
    vendor: string | IVendor;
    warehouse: string;
    featuredImage?: string;
    slug?: string;
    description?: string;
    images?: string[];
    items?: IProductVariant[];
}

export type IVendorDashboard = {
    totalProducts?: string;
    totalOrders?: string;
}

export type IUpdateProduct = Omit<IProduct, "warehouse" | "vendor"> & {
    autoUpdateVariantName?: boolean;
}

export type IProductVariant = {
    _id?: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    itemDeliveryCost: number;
    featuredImage?: string;
    images?: string[];
    product?: string;
} 

export type IAddToStock = Pick<IProductVariant, "stock">

export type IProductVariantMap = {
    [key: number]: IProductVariant
} 

export type ICategory = {
    _id?: string;
    code: string;
    name: string;
    parentId?: string;
    description?: string;
    featuredImage?: string;
}

export type IAddress = {
    _id?: string;
    customerId?: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    country: string;
}

export type IOrderAddress = {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    state: string;
    country: string;
}

export type IAdministrator = {
    _id?: string;
    user?: IUser;
    role?: AdminRolesEnum;
}

export type ICustomer = {
    _id?: string;
    user?: IUser;
    defaultAddress?: string;
    addresses?: string[];
}

export type IDiscount = {
    _id?: string;
    amount: number;
    description?: string;
    couponCode?: string;
}

export type IDriver = {
    _id?: string;
    driverLicense: string;
    user?: IUser;
    vehicle?: string;
}

export type IOrderItem = {
    amount: number;
    productVariant: string;
    productVariantName: string;
    qty: number;
    unitPrice: number;
    featuredImage?: string;
    sku?: string;
    stock?: number;
}

export type IOrderCustomer = {
    streetLine1: string;
    city: string;
    state: string;
    country: string;
    name?: string | undefined;
    phone?: string | undefined;
    email?: string | undefined;
    streetLine2?: string | undefined;
}

export type IOrder = {
    _id?: string;
    status?: StatusEnum;
    channel: PaymentChannelEnum | '';
    orderCode?: string;
    tier: number | null;
    deliveryCost?: number | null;
    items: IOrderItem[];
    discounts: string[];
    vendor?: string;
    customerId?: string;
    customer?: IOrderCustomer,
    warehouse?: string;
    // address: IOrderAddress,
    driver?: string;
    subTotal?: string;
    total?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type ICreateOrderAdmin = {
    _id?: string;
    status?: StatusEnum;
    channel: PaymentChannelEnum | '';
    orderCode?: string;
    tier: number | null;
    deliveryCost?: number | null;
    items: IOrderItem[];
    discounts: string[];
    vendor?: string;
    isNewCustomer?: boolean;
    newCustomer?: ICustomer & IUser;
    customerId?: string;
    customer?: IOrderCustomer,
    warehouse?: string;
    driver?: string;
    subTotal?: string;
    total?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type IUpdateOrder = Partial<Omit<IOrder, "warehouse" | "vendor"> & {
}>

export type IUpdateOrderStatus = Pick<IOrder, 'status'>


export type IPartner = {
    _id?: string;
    city: string;
    state: string;
    user: string;
    address: string;
    businessName: string;
    phone: string;
    email: string;
}

export type IStockMovement = {
    _id?: string;
    value: number;
    type: StockMovementEnum;
    productVariant: string;
    warehouse: string;
}

export type IUser = {
    _id?: string;
    phone: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
    role?: RolesEnum;
    middleName?: string;
    accountRef?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type IVehicle = {
    _id?: string;
    type: VehicleTypeEnum;
    registrationNumber: string;
    chassisNumber: string;
    ownership: VehicleOwnershipEnum;
}

export type IVendor = {
    _id?: string;
    city: string;
    state: string;
    address: string;
    businessName: string;
    phone: string;
    user?: IUser;
    tier1DeliveryCost?: number;
    tier2DeliveryCost?: number;
}

export type IWarehouse = {
    _id?: string;
    name: string;
    city: string;
    description?: string;
}

export interface IEvent {
    event_is_live: boolean
    totalCount: number
    active: boolean
    status: string
    _id: string
    eventName: string
    type: string
    image_url: string
    companyName: string
    venue: string
    startDate: Date
    startTime: string
    aboutEvent: string
    eventOwner: string
    contactNumber: string
    eventOwnerEmail: string
    eventOwnerUsername: string
}

export  interface IEventResponse {
    myEvent: IEvent[] 
}

export interface ITransaction {
    _eventOwnerID: string
    amount: string
    type: string
    description: string
    createdAt: string
}

export interface ITransactionResponse {
    transactionCount: number
    transList: ITransaction[]
}

export interface IAddBank {
    account_number: string,
    bank_code: string
    bank_name: string,
    is_default: boolean
}

export interface IAddBankAction extends IReducerAction<"account_number" | "bank_code" | "bank_name" | "is_default" | "reset"> {
    payload: string | number | boolean
}

// ── Dashboard API types ────────────────────────────────────────────────────────

export interface IAlert {
    type: string
    level: 'alert' | 'warning' | 'info' | 'success' | 'danger'
    message: string
    eventId?: string
    eventName?: string
}

export interface IActivityItem {
    type: 'ticket_sale' | 'check_in' | 'vote' | 'form_submission'
    message: string
    amount?: number
    eventName: string
    at: string
}

export interface IOwnerSummary {
    owner: { name: string; username: string; balance: number }
    stats: {
        totalEvents: number
        liveEvents: number
        ticketsSold: number
        checkedIn: number
        totalVotes: number
        formSubmissions: number
        totalEarned: number
    }
    alerts: IAlert[]
    recentActivity: IActivityItem[]
    liveEvents: { _id: string; eventName: string; type: string; startDate: string }[]
}

export interface IContestantLeader {
    _id: string
    fullname: string
    nickname: string
    image_url: string
    vote_count: number
    pct: number
}

export interface ITicketPurchase {
    _id: string
    name: string
    ticketType: string
    amountPaid: number
    numberOfTicket: number
    date_purchased: string
    status: string
}

export interface IEventSummary {
    _id: string
    eventName: string
    type: 'TICKETING' | 'VOTING' | 'FORM-SALES'
    status: string
    venue: string
    startDate: string
    startTime: string
    image_url: string
    event_is_live: boolean
    activePins: number
    tickets?: {
        sold: number
        revenue: number
        checkedIn: number
        checkInRate: number
        types: { ticketType: string; amount: number; purchased: number; totalSlots: number; soldSlots: number; isSoldOut: boolean }[]
        recent: ITicketPurchase[]
    }
    voting?: {
        totalVotes: number
        costPerVote: number
        contestantCount: number
        estimatedRevenue: number
        leaderboard: IContestantLeader[]
    }
    forms?: {
        title: string
        price: number
        active: boolean
        submissions: number
        revenue: number
    }
}

export interface ISalesTrend {
    period: string
    data: { date: string; tickets: number; revenue: number; orders: number }[]
}

export interface ICheckinTrend {
    period: string
    data: { label: string; count: number }[]
}

export interface IAudienceInsights {
    totalBuyers: number
    totalSold: number
    avgTicketsPerBuyer: number
    repeatBuyerCount: number
    repeatBuyerRate: number
    earlyBuyers: number
    urgencyBuyers: number
    ticketTypePref: { type: string; count: number; pct: number }[]
    timingHeatmap: number[][]
    topBuyers: { name: string; email: string; tickets: number; spend: number }[]
}

export interface IHealthScore {
    overall: number
    grade: string
    breakdown: {
        salesVelocity: number
        checkInRate: number
        pinSafety: number
        approvalStatus: number
        profileComplete: number
    }
    recommendations: { level: string; msg: string }[]
}

export interface IVoteTrendDataset {
    contestantId: string
    fullname: string
    nickname: string
    image_url: string
    data: number[]
}

export interface IVoteTrend {
    period: string
    labels: string[]
    datasets: IVoteTrendDataset[]
}

export interface IEventOwnerTx {
    _id: string
    _eventOwnerID: string
    amount: string
    type: string
    description: string
    createdAt: string
}

export interface IPayout {
    _id: string
    amount: number
    username: string
    date: string
}

export interface IWalletSummary {
    balance: number
    totalEarned: number
    totalWithdrawn: number
    revenueBySource: { ticketing: number; voting: number; forms: number }
    revenueByEvent: { eventId: string; eventName: string; revenue: number; sold: number }[]
    monthlyChart: { label: string; amount: number; count: number }[]
    recentTransactions: IEventOwnerTx[]
    payoutHistory: IPayout[]
}

export interface INotification {
    type: 'alert' | 'sale' | 'checkin' | 'vote' | 'milestone'
    level: 'danger' | 'warning' | 'success' | 'info'
    title: string
    body: string
    eventId?: string
    eventName?: string
    at: string
}

export interface INotificationsResponse {
    total: number
    page: number
    limit: number
    pages: number
    notifications: INotification[]
}

export interface ICheckinEntry {
    name: string
    ticketType: string
    numberOfTicket: number
    numberOfTicketUsed: number
    checkedInAt: string | null
}

export interface ICheckinStats {
    eventName: string
    totalSeats: number
    checkedIn: number
    remaining: number
    percentFull: number
    recentCheckIns: ICheckinEntry[]
}

export interface IAttendee {
    ticketId: string
    name: string
    email: string
    phone: string
    ticketType: string
    numberOfTicket: number
    numberOfTicketUsed: number
    status: string
    checkedInAt: string | null
    checkedInBy: string | null
}

export interface IAttendeesResponse {
    total: number
    tickets: IAttendee[]
}

export interface IPinsResponse {
    eventId: string
    pins: string[]
    count: number
}

/** Shape returned by the updated GET /who-voted-for-me/:eventId controller */
export interface IWhoVotedEntry {
    // New shape (VoteTransaction-based, with optional profile enrichment)
    fullname:  string
    username?: string | null
    email:     string
    phone?:    string
    image_url?: string | null
    votes:     number        // total votes cast by this voter
    date:      string

    // Legacy fields — kept for backwards compatibility with old responses
    _id?:            string
    contestant_id?:  string
    purchased_vote?: number
    total_amount?:   number
    message?:        string
    contestant?: { fullname: string; nickname: string; image_url: string }
}

export interface IWhoVotedResponse {
    voters?: IWhoVotedEntry[]   // new field name (post-fix)
    votes?:  IWhoVotedEntry[]   // legacy field name
    data?:   IWhoVotedEntry[]   // legacy fallback
}

// ── Event management types ─────────────────────────────────────────────────────

export interface ITicketType {
    _id:        string
    ticketType: string
    amount:     string
    purchased:  number
    eventId:    string
    imageUrl?:  string
    // ── Slot / capacity fields (added for ticket slot feature) ──
    totalSlots:      number          // 0 = unlimited
    soldSlots:       number          // atomically incremented on each purchase
    availableSlots:  number | null   // null = unlimited; server-computed
    isSoldOut:       boolean
}

export interface ITicketTypesResponse {
    tickets: ITicketType[]
}

export interface IFullPurchaseHistoryResponse {
    tickets: ITicketPurchase[]
}

export interface IContestantFull {
    _id: string
    event_id: string
    fullname: string
    nickname: string
    image_url: string
    my_code: number
    vote_count: number
    date: string
}

export interface IContestantsResponse {
    contestant: IContestantFull[]
    cost_per_vote: number
    eventData: Partial<IEvent>
}

export interface IFormField {
    label: string
    name: string
    type: string
    required: boolean
    options?: string[]
}

export interface IForm {
    _id: string
    eventId: string
    ownerId: string
    title: string
    description: string
    price: number
    colorTheme: string
    fields: IFormField[]
    active: boolean
    createdAt: string
}

export interface IFormSubmission {
    _id: string
    formId: string
    eventId: string
    submittedBy?: string
    data: Record<string, unknown>
    createdAt: string
}

export interface IFormSubmissionsResponse {
    count?: number
    total?: number
    submissions?: IFormSubmission[]
}

export interface IVoteRecord {
    _id?: string
    event_id: string
    total_amount: number
    contestant_id: string
    purchased_vote: number
    ref?: string
    message?: string
    date: string
    // New fields from VOTING-API.md §VoteTransaction
    packageId?: string
    referrer?:  string
    channel?:   'app' | 'web' | 'share'
}

export interface IVoteRecordsResponse {
    transList: IVoteRecord[]
    transanctionCount: number
}

// ── Vote Packages (VOTING-API.md §2, §5, §6, §7) ──────────────────────────────

export interface IVotePackage {
    _id:            string
    eventId:        string
    contestantId:   string
    name:           string
    description?:   string
    votes:          number        // votes granted per purchase
    price:          number        // total price in Naira
    active:         boolean
    totalSlots:     number        // 0 = unlimited
    soldSlots:      number
    availableSlots: number | null // null = unlimited
    isSoldOut:      boolean
}

export interface IVotePackagesResponse {
    packages: IVotePackage[]
}

export interface ICreateVotePackage {
    eventId:       string
    contestantId:  string
    name:          string
    votes:         number
    price:         number
    description?:  string
    totalSlots?:   number
}

export interface IUpdateVotePackage {
    name?:        string
    description?: string
    price?:       number
    votes?:       number
    totalSlots?:  number
    active?:      boolean
}

export interface ISubmitTicketType {
    eventId:    string
    ticketType: string
    amount:     string
    imageUrl?:  string
    totalSlots: number   // 0 = unlimited
}

export interface ICreateContestant {
    event_id: string
    fullname: string
    nickname: string
    image_url: string
}

// ── Submissions ────────────────────────────────────────────────────────────────

export interface ISubmissionField {
    label: string
    name: string
    type: string
    value: string | number | boolean | null
}

export interface ISubmissionRow {
    index: number
    _id: string
    submittedAt: string
    submittedBy: string | null
    fields: ISubmissionField[]
    raw: Record<string, unknown>
    // global view extras
    eventId?: string
    eventName?: string
    formId?: string
    formTitle?: string
    pricePerEntry?: number
}

export interface ISubmissionMeta {
    page: number
    limit: number
    total: number
    pages: number
}

export interface IEventSubmissionsResponse {
    form: {
        _id: string
        title: string
        price: number
        active: boolean
        fieldCount: number
    } | null
    meta: ISubmissionMeta
    summary: {
        totalSubmissions: number
        revenue: number
        pricePerEntry: number
    }
    data: ISubmissionRow[]
}

export interface ISubmissionDetail {
    _id: string
    submittedAt: string
    submittedBy: string | null
    form: { _id: string; title: string; price: number } | null
    event: { _id: string; eventName: string }
    fields: ISubmissionField[]
    raw: Record<string, unknown>
}

export interface IAllSubmissionsResponse {
    meta: ISubmissionMeta
    summary: {
        totalSubmissions: number
        totalRevenue: number
        eventsWithForms: number
    }
    events: { _id: string; eventName: string; count: number }[]
    data: ISubmissionRow[]
}