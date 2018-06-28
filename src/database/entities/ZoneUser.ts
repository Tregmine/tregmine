import { Entity, Column, ManyToOne, RelationId } from "typeorm";
import { ZoneUser as ZoneUserType, ZoneUserAccess } from "../../types";
import { DBEntity } from "../DBEntity";
import { Zone } from "./Zone";
import { Player } from "./Player";

@Entity()
export class ZoneUser extends DBEntity {
    @Column()
    perm: ZoneUserAccess;

    @ManyToOne(type => Zone, zone => zone.users)
    zone: Promise<Zone>;

    @RelationId((user: ZoneUser) => user.zone)
    zoneId: string;

    @ManyToOne(type => Player, player => player.zoneUsers)
    player: Promise<Player>;

    @RelationId((user: ZoneUser) => user.player)
    playerId: string;

    public async toInfo(): Promise<ZoneUserType> {
        return {
            id: this.id,
            perm: this.perm,
            zoneId: this.zoneId,
            playerId: this.playerId
        }
    }
}