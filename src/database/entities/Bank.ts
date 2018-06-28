import { Entity, ManyToOne, RelationId } from "typeorm";
import { Bank as BankType } from "../../types";
import { DBEntity } from "../DBEntity";
import { ZoneLot } from "./ZoneLot";

@Entity()
export class Bank extends DBEntity {
    @ManyToOne(type => ZoneLot, zoneLot => zoneLot.banks)
    lot: Promise<ZoneLot>;

    @RelationId((bank: Bank) => bank.lot)
    lotId: string;

    public async toInfo(full: boolean = false): Promise<BankType> {
        return {
            id: this.id,
            lotId: this.lotId
        }
    }
}