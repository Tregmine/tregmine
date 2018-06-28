import { Entity, ManyToOne, Column } from "typeorm";
import { DBEntity } from "../DBEntity";
import { InventoryItem as InventoryItemType } from "../../types";
import { Inventory } from "./Inventory";

@Entity()
export class InventoryItem extends DBEntity {
    @Column()
    slot: number;

    @Column()
    durability: number;

    @Column({default: "AIR"})
    material: string;

    @Column({default: 0})
    data: number;

    @Column()
    meta: string;

    @Column()
    count: number;
    
    @ManyToOne(type => Inventory, inventory => inventory.items)
    inventory: Promise<Inventory>;

    public async toInfo(): Promise<InventoryItemType> {
        return {
            slot: this.slot,
            durability: this.durability,
            material: this.material,
            data: this.data,
            meta: this.meta,
            count: this.count
        }
    }
}