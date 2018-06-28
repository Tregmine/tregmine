import { Entity, OneToMany, Column, PrimaryColumn, ManyToOne, RelationId } from "typeorm";
import { ZoneLot as ZoneLotType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Bank } from "./Bank";
import { Player } from "./Player";
import { ZoneUser } from "./ZoneUser";
import { ZoneLotUser } from "./ZoneLotUser";
import { Zone } from "./Zone";

@Entity()
export class ZoneLot extends DBEntity {
    @OneToMany(type => Bank, bank => bank.lot)
    banks: Promise<Bank[]>;

    @Column({default: 0})
    special: number;

    @OneToMany(type => ZoneLotUser, user => user.lot)
    users: Promise<ZoneLotUser[]>;

    @Column()
    name: string;

    @Column({default: 0})
    flags: number;

    @ManyToOne(type => Zone, zone => zone.lots)
    zone: Zone;

    @RelationId((lot: ZoneLot) => lot.zone)
    zoneId: string;

    @Column()
    x1: number;

    @Column()
    y1: number;

    @Column()
    x2: number;
    
    @Column()
    y2: number;

    public async toInfo(full: boolean = false): Promise<ZoneLotType> {
        return {
            id: this.id,
            name: this.name,
            flags: this.flags,
            zoneId: this.zoneId,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2,
            special: this.special,
            banks: await ZoneLot.coerce(this.banks, full),
            users: full ? await ZoneLot.coerce(this.users) : undefined
        }
    }
}