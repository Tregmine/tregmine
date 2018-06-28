import { Entity, OneToMany, Column, PrimaryColumn } from "typeorm";
import { Warp as WarpType } from "../../types";
import { DBEntity } from "../DBEntity";
import { WarpLog } from "./WarpLog";

@Entity()
export class Warp extends DBEntity {
    @OneToMany(type => WarpLog, warpLog => warpLog.warp)
    logs: Promise<WarpLog[]>;

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

    public async toInfo(full: boolean = false): Promise<WarpType> {
        return {
            id: this.id,
            logs: full ? await Warp.coerce(this.logs, full) : undefined,
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