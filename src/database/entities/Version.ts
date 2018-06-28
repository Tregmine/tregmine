import { DBEntity } from "../DBEntity";
import { Version as VersionType } from "../../types";
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Version extends DBEntity {
    @Column()
    number: string;

    @Column()
    log: string;

    public async toInfo(): Promise<VersionType> {
        return {
            number: this.number,
            log: this.log
        }
    }
}