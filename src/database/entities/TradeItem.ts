import { Entity, ManyToOne, Column } from "typeorm";
import { TradeItem as TradeItemType } from "../../types";
import { DBEntity } from "../DBEntity";
import { Trade } from "./Trade";

@Entity()
export class TradeItem extends DBEntity {
    @Column()
    material: string;

    @Column({default: 0})
    data: number;

    @Column()
    meta: string;

    @Column()
    count: number;

    @Column("int")
    durability: number | null;

    @ManyToOne(type => Trade, trade => trade.items)
    trade: Promise<Trade>;

    public async toInfo(): Promise<TradeItemType> {
        return {
            material: this.material,
            data: this.data,
            meta: this.meta,
            count: this.count,
            durability: this.durability
        }
    }
}