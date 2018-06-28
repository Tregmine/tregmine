import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
import { DBEntity } from "../DBEntity";
import { InGameTransaction as InGameTransactionType } from "../../types";

@Entity()
export class InGameTransaction extends DBEntity {
    @CreateDateColumn()
    timestamp: Date;

    @Column()
    senderID: string;

    @Column()
    recipientID: string;

    @Column()
    amount: number;

    public async toInfo(): Promise<InGameTransactionType> {
        return {
            id: this.id,
            timestamp: this.timestamp.getTime(),
            senderID: this.senderID,
            recipientID: this.recipientID,
            amount: this.amount
        }
    }
}