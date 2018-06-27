import { BaseEntity, Entity, PrimaryColumn, ObjectType } from "typeorm";
import { Security } from "../util";

@Entity()
export class DBEntity extends BaseEntity {
    @PrimaryColumn({unique: true})
    public id: string;
    
    public async generateSnowflake() {
        this.id = await Security.snowflake();
    }

    static async create<T extends DBEntity>(this: ObjectType<T>, args?: any): Promise<T> {
        var obj = super.create(args) as T;
        await obj.generateSnowflake();
        return obj as T;
    }
}