import { Entity, Column, PrimaryColumn } from "typeorm";
import { SystemMessage as SystemMessageType } from "../../types";
import { DBEntity } from "../DBEntity";

@Entity()
export class SystemMessage extends DBEntity {
    @Column()
    type: "insult" | "quit";

    @Column()
    value: string;

    public async toInfo(): Promise<SystemMessageType> {
        return {
            type: this.type,
            value: this.value
        }
    }
}