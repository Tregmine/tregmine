import { Entity, Column, ManyToOne, PrimaryColumn, CreateDateColumn, RelationId } from "typeorm";
import { OreLog as OreLogType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Player } from "./Player";

@Entity()
export class OreLog extends DBEntity {
    @Column()
    material: string;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.ores)
    player: Promise<Player>;

    @Column()
    x: number;

    @Column()
    y: number;
    
    @Column()
    z: number;
    
    @Column()
    world: string;

    public async toInfo(): Promise<OreLogType> {
        return {
            material: this.material,
            timestamp: this.timestamp.getTime(),
            x: this.x,
            y: this.y,
            z: this.z,
            world: this.world
        }
    }
}