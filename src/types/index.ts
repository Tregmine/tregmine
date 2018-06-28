interface Timestamped {
    timestamp: number;
}

interface PlayerLinked {
    playerId: string;
}

interface PlayerOwned {
    ownerId: string;
}

interface Unique {
    id: string;
}

interface Exchange {
    senderID: string;
    recipientID: string;
}

interface Item {
    material: string;
    data: number;
    meta: string;
    count: number;
    durability: number | null;
}

interface Named {
    name: string;
}

interface Location {
    x: number;
    y: number;
    z: number;
}

interface ViewLocation {
    pitch: number;
    yaw: number;
}

interface Quantity {
    amount: number;
}

interface OfWorld {
    world: string;
}

interface Flags {
    flags: number;
}

interface ZoneLinked {
    zoneId: string;
}

interface Rect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface LotLinked {
    lotId: string;
}

interface Message {
    message: string;
}

interface Action<T> {
    action: T;
}

interface Expires {
    expires: number;
}

type BaseType = Timestamped & PlayerLinked & Unique;

export enum Rank {
    UNVERIFIED, TOURIST, SETTLER, RESIDENT, DONATOR, BUILDER, CODER, GUARDIAN, JUNIOR_ADMIN, SENIOR_ADMIN
}

export enum InventoryType {
    main, armor, ender
}

export interface Player extends Named, Flags {
    uuid: string;
    email: string | null;
    confirmed: boolean;
    created: number;
    wallet: number;
    rank: Rank;
    keywords: string[];
    ignore: string[];
    inventory: string;
    inventories?: Inventory[];
    properties?: PlayerProperty[];
    badges?: Badge[];
    homes?: Home[];
}

export interface Inventory extends Unique, PlayerLinked, Named {
    type: InventoryType;
    items: InventoryItem[];
}

export interface InventoryItem extends Item {
    slot: number;
    durability: number;
}

export interface Badge extends BaseType, Named {
    level: number;
}

export interface ChatLog extends BaseType, Message {
    channel: string;
}

export type GiveLog = Unique & Timestamped & Exchange & Item;

export type Home = BaseType & Named & Location & ViewLocation & OfWorld;

export interface PlayerLogin extends Action<"login" | "logout">, BaseType {
    country: string;
    city: string;
    ip: string;
    hostname: string;
    onlinePlayers: number;
}

export interface OreLog extends Timestamped, Location, OfWorld {
    material: string;
}

export interface PlayerProperty extends Timestamped {
    key: string;
    value: string;
}

export type ReportAction = "kick" | "softwarn" | "hardwarn" | "ban" | "comment"

export type Report = Action<ReportAction> & Unique & Timestamped & Exchange & Message & Expires;

export type InGameTransaction = Unique & Timestamped & Exchange & Quantity;

export interface ShortURL extends Unique {
    shortened: string;
    link: string;
}

/**
 * TODO: Trade items
 */
export interface Trade extends Unique, Timestamped, Exchange, Quantity {
    items: TradeItem[];
}

export type TradeItem = Item;

export interface Version {
    number: string;
    log: string;
}

export interface Warp extends Unique, Named, Location, ViewLocation, OfWorld {
    logs?: WarpLog[];
}

export type WarpLog = Timestamped & PlayerLinked;

export interface Zone extends Unique, Timestamped, PlayerOwned, OfWorld, Named, Flags {
    enterDefault: boolean;
    placeDefault: boolean;
    destroyDefault: boolean;
    pvp: boolean;
    hostiles: boolean;
    communist: boolean;
    publicProfile: boolean;
    enterMessage: string | null;
    exitMessage: string | null;
    texture: string | null;
    lots?: ZoneLot[];
    users?: ZoneUser[];
    profile?: ZoneProfile;
    rect?: ZoneRect;
}

export interface ZoneLot extends Unique, Named, Flags, ZoneLinked, Rect {
    special: number;
    users?: ZoneLotUser[];
    banks: Bank[];
}

export type ZoneLotUser = PlayerLinked & LotLinked;

export interface ZoneProfile extends Unique, ZoneLinked, Timestamped {
    text: string;
}

export type ZoneRect = ZoneLinked & Rect;

export enum ZoneUserAccess {
    owner,maker,allowed,banned
}

export interface ZoneUser extends Unique, ZoneLinked, PlayerLinked {
    perm: ZoneUserAccess;
}

export interface SystemMessage {
    type: "insult" | "quit";
    value: string;
}

export type Bank = Unique & LotLinked;

export interface BankAccount extends Unique, PlayerLinked, Quantity {
    accountNumber: number;
    transactions?: BankTransaction[];
    pin: string | null;
}

export interface BankTransaction extends BaseType, Quantity {
    account?: BankAccount;
    accountId: string;
    type: string;
}