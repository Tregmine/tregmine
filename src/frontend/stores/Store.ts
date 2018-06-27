import Debugger from "../util/Logger";
import { DEBUG_TREE, DEBUG } from "../../Constants";

export class Store {

    public static stores: Store[] = [];
    public static proxiedStores: Store[] = [];

    /**
     * 
     * @param id the ID for this store. Changing the ID will effectively reset the localStorage container.
     * @param persistent keys that should persist (be saved to localStorage). They must be primitives or JSON-friendly.
     */
    protected constructor(private id: string, public readonly persistent: string[] = []) {
        Store.stores.push(this);
    }

    /**
     * Load all currently registered stores.
     */
    public static async load(): Promise<void> {
        const promises: Array<Promise<void>> = [];
        for (let store of Store.stores) {
            promises.push(store.load());
        }
        await Promise.all(promises);
    }

    /**
     * Saves the store to localStorage
     */
    public saveSync(): void {
        const save: {[key: string]: any} = {};
        for (let key of this.persistent) {
            if (!(this as any)[key]) continue;
            const value = (this as any)[key];
            if (value.prototype) {
                Debugger.warn(`Store "${this.id}" is attempting to save an instance to localStorage. YMMV.`);
            }
            save[key] = value;
        }
        try {
            localStorage.setItem(this.localStorageID, JSON.stringify(save));
        } catch (e) {
            Debugger.error([`Couldn't flush store "${this.id}" to localStorage`, e]);
            return;
        }
        Debugger.debug(`Successfully flushed store "${this.id}" to localStorage`);
    }

    /**
     * Saves the store to localStorage
     */
    public async save(): Promise<void> {
        this.saveSync();
    }

    /**
     * Loads the store from localStorage
     */
    public async load(): Promise<void> {
        const saved = localStorage.getItem(this.localStorageID);
        if (!saved) {
            return;
        }
        let archive;
        try {
            archive = JSON.parse(saved);
        } catch (e) {
            Debugger.error([`Couldn't extract archive for store "${this.id}"`, e]);
            return;
        }
        for (let key of this.persistent) {
            if (!archive[key]) continue;
            (this as any)[key] = archive[key];
        }
        Debugger.debug(`Loaded store "${this.id}" from localStorage`);
    }

    /**
     * Creates a proxy wrapper around a store, triggering a save whenever the store is mutated.
     * @param store the store to wrap
     */
    public static proxy<T extends Store>(store: T): T {
        const proxy = new Proxy(store, {
            set(target: Store, p: PropertyKey, value: any, receiver: any) {
                (target as any)[p.toString()] = value;
                if (target.persistent.indexOf(p.toString()) !== -1) {
                    Debugger.debug(`${target.id} mutated`);
                    target.save();
                }
                return true;
            }
        }) as any;
        this.proxiedStores.push(proxy);
        return proxy;
    }

    private get localStorageID() {
        return `store-archive-${this.id}`;
    }
}

if (DEBUG) {
    DEBUG_TREE.Store = Store;
}

DEBUG_TREE.Stores = Store.proxiedStores;