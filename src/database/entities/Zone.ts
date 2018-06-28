import { Entity, Column, OneToMany, ManyToMany, OneToOne, ManyToOne, PrimaryColumn, CreateDateColumn, RelationId } from "typeorm";
import { Zone as ZoneType } from "../../types";
import { DBEntity } from "../DBEntity";
import { ZoneLot } from "./ZoneLot";
import { userInfo } from "os";
import { Player } from "./Player";
import { ZoneUser } from "./ZoneUser";
import { ZoneProfile } from "./ZoneProfile";
import { ZoneRect } from "./ZoneRect";

@Entity()
export class Zone extends DBEntity {
    @Column({default: true})
    enterDefault: boolean;

    @Column({default: true})
    placeDefault: boolean;

    @Column({default: true})
    destroyDefault: boolean;

    @Column({default: false})
    pvp: boolean;

    @Column({default: false})
    hostiles: boolean;

    @Column({default: false})
    communist: boolean;

    @Column({default: false})
    publicProfile: boolean;

    @Column("text", {default: null, nullable: true})
    enterMessage: string | null;

    @Column("text", {default: null, nullable: true})
    exitMessage: string | null;

    @Column("text", {default: null, nullable: true})
    texture: string | null;

    @OneToMany(type => ZoneLot, lot => lot.zone)
    lots: Promise<ZoneLot[]>;

    @OneToMany(type => ZoneUser, user => user.zone)
    users: Promise<ZoneUser[]>;

    @OneToOne(type => ZoneProfile, profile => profile.zone)
    profile: Promise<ZoneProfile>;

    @OneToOne(type => ZoneRect, rect => rect.zone)
    rect: Promise<ZoneRect>;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.zones)
    owner: Promise<Player>;

    @RelationId((zone: Zone) => zone.owner)
    ownerId: string;

    @Column()
    world: string;

    @Column()
    name: string;

    @Column({default: 0})
    flags: number;

    public async toInfo(full: boolean = false): Promise<ZoneType> {
        return {
            id: this.id,
            enterDefault: this.enterDefault,
            placeDefault: this.placeDefault,
            destroyDefault: this.destroyDefault,
            pvp: this.pvp,
            hostiles: this.hostiles,
            communist: this.communist,
            publicProfile: this.publicProfile,
            enterMessage: this.enterMessage,
            exitMessage: this.exitMessage,
            texture: this.texture,
            lots: full ? await Zone.coerce(this.lots, full) : undefined,
            users: full ? await Zone.coerce(this.users, full) : undefined,
            profile: full ? await Zone.coerce(this.profile, full) : undefined,
            rect: full ? await Zone.coerce(this.rect, full) : undefined,
            ownerId: this.ownerId,
            timestamp: this.timestamp.getTime(),
            world: this.world,
            name: this.name,
            flags: this.flags
        }
    }
}