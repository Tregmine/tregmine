import { Entity, ManyToOne, Column, CreateDateColumn, RelationId } from "typeorm";
import { WarpLog as WarpLogType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Warp } from "./Warp";
import { Player } from "./Player";

@Entity()
export class WarpLog extends DBEntity {
    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.warpLog)
    player: Promise<Player>;

    @RelationId((log: WarpLog) => log.player)
    playerId: string;

    @ManyToOne(type => Warp, warp => warp.logs)
    warp: Promise<Warp>;

    public async toInfo(): Promise<WarpLogType> {
        return {
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId
        }
    }
}