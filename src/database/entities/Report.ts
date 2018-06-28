import { Entity, Column, CreateDateColumn } from "typeorm";
import { Report as ReportType, ReportAction } from "../../types";
import { DBEntity } from "../DBEntity";

@Entity()
export class Report extends DBEntity {
    @Column()
    action: ReportAction;
    
    @CreateDateColumn()
    timestamp: Date;

    @Column()
    senderID: string;

    @Column()
    recipientID: string;

    @Column()
    message: string;

    @Column()
    expires: number;

    public async toInfo(): Promise<ReportType> {
        return {
            id: this.id,
            action: this.action,
            timestamp: this.timestamp.getTime(),
            senderID: this.senderID,
            recipientID: this.recipientID,
            message: this.message,
            expires: this.expires
        }
    }
}