import { Entity, ManyToOne, Column, CreateDateColumn, RelationId } from "typeorm";
import { BankTransaction as BankTransactionType } from "../../types";
import { DBEntity } from "../DBEntity";
import { BankAccount } from "./BankAccount";
import { Player } from "./Player";

@Entity()
export class BankTransaction extends DBEntity {
    @ManyToOne(type => BankAccount, account => account.transactions)
    account: Promise<BankAccount>;

    @RelationId((transaction: BankTransaction) => transaction.account)
    accountId: string;

    @Column()
    type: string;

    @CreateDateColumn()
    timestamp: Date;

    @ManyToOne(type => Player, player => player.transactions)
    player: Promise<Player>;

    @RelationId((transaction: BankTransaction) => transaction.player)
    playerId: string;

    @Column()
    amount: number;

    public async toInfo(full: boolean = false): Promise<BankTransactionType> {
        return {
            id: this.id,
            accountId: this.accountId,
            type: this.type,
            timestamp: this.timestamp.getTime(),
            playerId: this.playerId,
            amount: this.amount
        }
    }
}