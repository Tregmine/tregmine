import { Store } from "./Store";
import { UserType } from "../../types/UserType";

class UserStoreClass extends Store {
    public constructor() {
        super("user");
    }

    public async getUser(): Promise<UserType | null> {
        return null;
    }
}

export const UserStore = Store.proxy(new UserStoreClass());