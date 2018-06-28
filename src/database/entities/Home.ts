import { Entity, Column, ManyToOne, CreateDateColumn, RelationId } from "typeorm";
import { Home as HomeType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class Home extends DBEntity {
    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.homes)
    player: Promise<Player>;

    @RelationId((home: Home) => home.player)
    playerId: string;

    @Column()
    name: string;

    @Column()
    x: number;

    @Column()
    y: number;

    @Column()
    z: number;

    @Column()
    pitch: number;

    @Column()
    yaw: number;

    @Column()
    world: string;

    public async toInfo(): Promise<HomeType> {
        return {
            id: this.id,
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId,
            name: this.name,
            x: this.x,
            y: this.y,
            z: this.z,
            pitch: this.pitch,
            yaw: this.yaw,
            world: this.world
        }
    }
}