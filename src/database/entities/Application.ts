import { Entity, Column, ObjectType, BaseEntity, PrimaryColumn } from "typeorm";
import { DBEntity } from "../DBEntity";
import { Security } from "../../util";
import { AccessLevel, Application as ApplicationType } from "../../types";

@Entity()
export class Application extends BaseEntity {
    @PrimaryColumn({unique: true})
    id: string;

    @Column()
    name: string;

    @Column()
    access: AccessLevel;

    @Column()
    disabled: boolean;

    @Column()
    secretSalt: string;

    public async rollSalt(): Promise<void> {
        this.secretSalt = await Security.random(16);
    }

    public generateToken(): Promise<string> {
        return Security.Token.createToken(this);
    }

    public async toInfo(): Promise<ApplicationType> {
        return {
            id: "",
            name: this.name,
            access: this.access,
            disabled: this.disabled
        };
    }

    static async create<T extends DBEntity>(this: ObjectType<T>, args?: any): Promise<T> {
        const obj = await super.create<Application>(args);
        await obj.rollSalt();
        obj.id = await Security.snowflake();
        return obj as any as T;
    }
}
