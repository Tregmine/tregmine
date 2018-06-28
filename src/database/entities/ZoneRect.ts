import { Entity, OneToOne, Column, RelationId } from "typeorm";
import { ZoneRect as ZoneRectType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Zone } from "./Zone";

@Entity()
export class ZoneRect extends DBEntity {
    @OneToOne(type => Zone, zone => zone.rect)
    zone: Promise<Zone>;

    @RelationId((rect: ZoneRect) => rect.zone)
    zoneId: string;

    @Column()
    x1: number;

    @Column()
    y1: number;

    @Column()
    x2: number;

    @Column()
    y2: number;

    public async toInfo(): Promise<ZoneRectType> {
        return {
            zoneId: this.zoneId,
            x1: this.x1,
            y1: this.y1,
            x2: this.x2,
            y2: this.y2
        }
    }
}