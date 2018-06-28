import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, RelationId } from "typeorm";
import { BankAccount as BankAccountType } from "../../types";
import { DBEntity } from "../DBEntity";
import { BankTransaction } from "./BankTransaction";
import { Player } from "./Player";

@Entity()
export class BankAccount extends DBEntity {
    @Column()
    accountNumber: number;

    @OneToMany(type => BankTransaction, transaction => transaction.account)
    transactions: Promise<BankTransaction[]>;

    @Column("text")
    pin: string | null;

    @ManyToOne(type => Player, player => player.bankAccounts)
    player: Promise<Player>;

    @RelationId((account: BankAccount) => account.player)
    playerId: string;

    @Column({default: 0})
    amount: number;

    public async toInfo(full: boolean = false): Promise<BankAccountType> {
        return {
            id: this.id,
            accountNumber: this.accountNumber,
            transactions: full ? await BankAccount.coerce(this.transactions) : undefined,
            pin: this.pin,
            playerId: this.playerId,
            amount: this.amount
        }
    }
}