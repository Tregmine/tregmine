import { Entity, Column, BaseEntity, CreateDateColumn, ObjectType, PrimaryColumn } from "typeorm";
import { ErrorReport as ErrorReportType } from "../../types";
import { Git } from "../../util";

@Entity()
export class ErrorReport extends BaseEntity {
    @Column()
    errorMessage: string;

    @Column()
    version: string;

    @CreateDateColumn()
    timestamp: Date;

    @PrimaryColumn()
    ref: string;

    public async toInfo(): Promise<ErrorReportType> {
        return {
            errorMessage: this.errorMessage,
            version: this.version,
            timestamp: this.timestamp.getTime(),
            ref: this.ref
        }
    }

    public static async create<T extends ErrorReport>(this: ObjectType<T>, args?: any): Promise<T> {
        const obj = super.create(args) as any as T;
        obj.version = await Git.short();
        return obj;
    }
}