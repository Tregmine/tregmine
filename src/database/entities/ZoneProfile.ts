import { Entity, Column, OneToOne, ManyToOne, CreateDateColumn, RelationId } from "typeorm";
import { ZoneProfile as ZoneProfileType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Zone } from "./Zone";
import { Player } from "./Player";

@Entity()
export class ZoneProfile extends DBEntity {
    @Column()
    text: string;

    @OneToOne(type => Zone, zone => zone.profile)
    zone: Promise<Zone>;

    @RelationId((profile: ZoneProfile) => profile.zone)
    zoneId: string;

    @ManyToOne(type => Player, player => player.zoneProfiles)
    player: Promise<Player>;

    @CreateDateColumn()
    timestamp: Date;

    public async toInfo(): Promise<ZoneProfileType> {
        return {
            id: this.id,
            text: this.text,
            zoneId: this.zoneId,
            timestamp: this.timestamp.getTime()
        }
    }
}