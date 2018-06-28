import {Entity, Column, OneToMany, ManyToOne, PrimaryColumn, ManyToMany, CreateDateColumn, BaseEntity} from "typeorm";
import {IsEmail, IsUUID} from "class-validator";
import { Player as PlayerType, Rank } from "../../types";
import bcrypt from "bcrypt";
import { DBEntity, Serializable } from "../DBEntity";
import { Badge } from "./Badge";
import { ChatLog } from "./ChatLog";
import { Home } from "./Home";
import { PlayerLogin } from "./PlayerLogin";
import { OreLog } from "./OreLog";
import { Warp } from "./Warp";
import { Zone } from "./Zone";
import { BankTransaction } from "./BankTransaction";
import { Inventory } from "./Inventory";
import { PlayerProperty } from "./PlayerProperty";
import { ZoneLot } from "./ZoneLot";
import { ZoneProfile } from "./ZoneProfile";
import { ZoneUser } from "./ZoneUser";
import { BankAccount } from "./BankAccount";
import { WarpLog } from "./WarpLog";
import { ZoneLotUser } from "./ZoneLotUser";

@Entity()
export class Player extends BaseEntity implements Serializable {
    @OneToMany(type => Badge, badge => badge.player)
    badges: Promise<Badge[]>;

    @OneToMany(type => ChatLog, chat => chat.player)
    messages: Promise<ChatLog[]>;

    @OneToMany(type => Home, home => home.player)
    homes: Promise<Home[]>;

    @OneToMany(type => PlayerLogin, login => login.player)
    logins: Promise<PlayerLogin[]>;

    @OneToMany(type => OreLog, oreLog => oreLog.player)
    ores: Promise<OreLog[]>;

    @OneToMany(type => Zone, zone => zone.owner)
    zones: Promise<Zone[]>;

    @OneToMany(type => BankTransaction, transaction => transaction.player)
    transactions: Promise<BankTransaction[]>;

    @IsUUID()
    @PrimaryColumn({unique: true})
    uuid: string;

    @IsEmail()
    @Column("text", {nullable: true})
    email: string | null;

    @Column({default: false})
    confirmed: boolean;

    @CreateDateColumn()
    created: Date;

    @Column({default: 50000})
    wallet: number;

    @Column({default: Rank.UNVERIFIED})
    rank: Rank;

    @Column("simple-array")
    keywords: string[];

    @Column("simple-array")
    ignore: string[];

    @Column({default: "survival"})
    inventory: string;

    @OneToMany(type => Inventory, inventory => inventory.player)
    inventories: Promise<Inventory[]>;

    @OneToMany(type => PlayerProperty, property => property.player)
    properties: Promise<PlayerProperty[]>;

    @OneToMany(type => ZoneProfile, profile => profile.player)
    zoneProfiles: Promise<ZoneProfile[]>;

    @OneToMany(type => ZoneUser, user => user.player)
    zonePermissions: Promise<ZoneUser[]>;

    @OneToMany(type => BankAccount, account => account.player)
    bankAccounts: Promise<BankAccount[]>;

    @OneToMany(type => WarpLog, log => log.player)
    warpLog: Promise<WarpLog[]>;

    @OneToMany(type => ZoneLotUser, user => user.player)
    lotUsers: Promise<WarpLog[]>;

    @OneToMany(type => ZoneUser, user => user.player)
    zoneUsers: Promise<ZoneUser[]>;

    /**
     * @todo remove? we could get this from mojang API
     */
    @Column({unique: true, default: null, nullable: false})
    name: string;

    @Column()
    flags: number;

    @Column({nullable: true, default: null, type: String})
    password: string | null;

    public async toInfo(full: boolean = false): Promise<PlayerType> {
        return {
            uuid: this.uuid,
            name: this.name,
            flags: this.flags,
            email: this.email,
            confirmed: this.confirmed,
            created: this.created.getTime(),
            wallet: this.wallet,
            rank: this.rank,
            keywords: this.keywords,
            ignore: this.ignore,
            inventory: this.inventory,
            inventories: full ? await DBEntity.coerce(this.inventories, full) : undefined,
            properties: full ? await DBEntity.coerce(this.properties, full) : undefined,
            badges: full ? await DBEntity.coerce(this.badges, full) : undefined,
            homes: full ? await DBEntity.coerce(this.homes, full) : undefined
        }
    }

    public passwordMatches(password: string) {
        return bcrypt.compare(password, this.password!);
    }

    static async deleteApplicableUsers() {
        return;
    }
}
