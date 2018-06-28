import { Entity, ManyToOne, RelationId } from "typeorm";
import { ZoneLotUser as ZoneLotUserType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";
import { ZoneLot } from "./ZoneLot";

@Entity()
export class ZoneLotUser extends DBEntity {
    @ManyToOne(type => Player, player => player.lotUsers)
    player: Promise<Player>;

    @RelationId((user: ZoneLotUser) => user.player)
    playerId: string;

    @ManyToOne(type => ZoneLot, lot => lot.users)
    lot: Promise<ZoneLot>;

    @RelationId((user: ZoneLotUser) => user.lot)
    lotId: string;

    public async toInfo(): Promise<ZoneLotUserType> {
        return {
            playerId: this.playerId,
            lotId: this.lotId
        }
    }
}