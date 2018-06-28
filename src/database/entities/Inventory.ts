import { Entity, Column, OneToMany, ManyToOne, RelationId } from "typeorm";
import { Inventory as InventoryType, InventoryType as InventoryCategory } from "../../types";
import { DBEntity } from "../DBEntity";
import { InventoryItem } from "./InventoryItem";
import { Player } from "./Player";

@Entity()
export class Inventory extends DBEntity {
    @Column()
    type: InventoryCategory;

    @OneToMany(type => InventoryItem, item => item.inventory)
    items: Promise<InventoryItem[]>;

    @ManyToOne(type => Player, player => player.inventories)
    player: Promise<Player>;

    @RelationId((inventory: Inventory) => inventory.player)
    playerId: string;

    @Column()
    name: string;

    public async toInfo(full: boolean = false): Promise<InventoryType> {
        return {
            id: this.id,
            type: this.type,
            items: await Inventory.coerce(this.items, full),
            playerId: this.playerId,
            name: this.name
        }
    }
}