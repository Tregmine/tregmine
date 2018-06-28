import { Entity, Column, ManyToOne, UpdateDateColumn } from "typeorm";
import { PlayerProperty as PlayerPropertyType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class PlayerProperty extends DBEntity {
    @Column()
    key: string;

    @Column()
    value: string;

    @ManyToOne(type => Player, player => player.properties)
    player: Promise<Player>;

    @UpdateDateColumn()
    timestamp: Date;

    public async toInfo(): Promise<PlayerPropertyType> {
        return {
            key: this.key,
            value: this.value,
            timestamp: this.timestamp.getTime()
        }
    }
}