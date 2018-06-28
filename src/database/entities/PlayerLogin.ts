import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, RelationId } from "typeorm";
import { PlayerLogin as PlayerLoginType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class PlayerLogin extends DBEntity {
    @Column()
    country: string;

    @Column()
    city: string;

    @Column()
    ip: string;

    @Column()
    hostname: string;

    @Column()
    onlinePlayers: number;

    @Column()
    action: "login" | "logout";

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.logins)
    player: Promise<Player>;

    @RelationId((login: PlayerLogin) => login.player)
    playerId: string;

    public async toInfo(): Promise<PlayerLoginType> {
        return {
            id: this.id,
            country: this.country,
            city: this.city,
            ip: this.ip,
            hostname: this.hostname,
            onlinePlayers: this.onlinePlayers,
            action: this.action,
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId
        }
    }
}