import { Entity, PrimaryColumn, Column } from "typeorm";
import { ShortURL as ShortURLType } from "../../types";
import { DBEntity } from "../DBEntity";

@Entity()
export class ShortURL extends DBEntity {
    @Column()
    shortened: string;

    @Column()
    link: string;

    public async toInfo(): Promise<ShortURLType> {
        return {
            id: this.id,
            shortened: this.shortened,
            link: this.link
        }
    }
}