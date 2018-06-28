import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, RelationId } from "typeorm";
import { ChatLog as ChatLogType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class ChatLog extends DBEntity {
    @Column()
    channel: string;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.messages, {primary: true})
    player: Promise<Player>;

    @RelationId((log: ChatLog) => log.player)
    playerId: string;

    @Column()
    message: string;

    public async toInfo(full: boolean = false): Promise<ChatLogType> {
        return {
            id: this.id,
            channel: this.channel,
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId,
            message: this.message
        }
    }
}