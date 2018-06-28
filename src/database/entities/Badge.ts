import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, RelationId, JoinColumn } from "typeorm";
import { Badge as BadgeType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class Badge extends DBEntity {
    @Column()
    level: number;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.badges)
    player: Promise<Player>;

    @RelationId((badge: Badge) => badge.player)
    playerId: string;

    @Column()
    name: string;

    public async toInfo(full: boolean = false): Promise<BadgeType> {
        return {
            id: this.id,
            level: this.level,
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId,
            name: this.name
        }
    }
}
