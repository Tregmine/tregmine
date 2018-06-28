import { BaseEntity, Entity, PrimaryColumn, ObjectType } from "typeorm";
import { Security } from "../util";

export interface Serializable {
    toInfo(full?: boolean): Promise<any>;
}

@Entity()
export abstract class DBEntity extends BaseEntity implements Serializable {
    @PrimaryColumn({unique: true})
    public id: string;
    
    public async generateSnowflake() {
        this.id = await Security.snowflake();
    }

    public abstract toInfo(full?: boolean): Promise<any>;

    static async create<T extends DBEntity>(this: ObjectType<T>, args?: any): Promise<T> {
        var obj = super.create(args) as any as T;
        await obj.generateSnowflake();
        return obj as T;
    }

    /**
     * Convert a promised relation to its info object
     */
    public static async coerce<T extends DBEntity>(obj: Promise<Serializable> | Promise<Serializable[]>, full?: boolean): Promise<any> {
        const res = await obj;
        if (Array.isArray(res)) {
            const transpilations: Array<Promise<any>> = [];
            for (let t of res) {
                transpilations.push(t.toInfo(full));
            }
            return await Promise.all(transpilations);
        } else {
            return await res.toInfo(full);
        }
    }
}