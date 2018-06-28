import { Entity, OneToMany, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
import { Trade as TradeType } from "../../types";
import { DBEntity } from "../DBEntity";
import { TradeItem } from "./TradeItem";

@Entity()
export class Trade extends DBEntity {
    @OneToMany(type => TradeItem, item => item.trade)
    items: Promise<TradeItem[]>;

    @CreateDateColumn()
    timestamp: Date;

    @Column()
    senderID: string;

    @Column()
    recipientID: string;

    @Column()
    amount: number;

    public async toInfo(): Promise<TradeType> {
        return {
            id: this.id,
            items: await Trade.coerce(this.items),
            timestamp: this.timestamp.getTime(),
            senderID: this.senderID,
            recipientID: this.recipientID,
            amount: this.amount
        }
    }
}