import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
import { GiveLog as GiveLogType } from "../../types";
import { DBEntity } from "../DBEntity";

@Entity()
export class GiveLog extends DBEntity {
    @CreateDateColumn()
    timestamp: Date;

    @Column()
    senderID: string;

    @Column()
    recipientID: string;

    @Column()
    material: string;

    @Column()
    data: number;

    @Column()
    meta: string;

    @Column()
    count: number;

    @Column("int")
    durability: number | null;

    public async toInfo(): Promise<GiveLogType> {
        return {
            id: this.id,
            timestamp: this.timestamp.getTime(),
            senderID: this.senderID,
            recipientID: this.recipientID,
            material: this.material,
            data: this.data,
            meta: this.meta,
            count: this.count,
            durability: this.durability
        }
    }
}