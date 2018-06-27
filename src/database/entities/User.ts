import {Entity, Column} from "typeorm";
import { UserType } from "../../types/UserType";
import bcrypt from "bcrypt";
import { DBEntity } from "../DBEntity";

@Entity()
export class User extends DBEntity implements UserType {
    @Column()
    name: string;

    @Column({nullable: true, default: null, type: String})
    password: string | null;

    public passwordMatches(password: string) {
        return bcrypt.compare(password, this.password!);
    }

    static async deleteApplicableUsers() {
        return;
    }
}
