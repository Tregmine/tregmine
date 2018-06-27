
import Vue from "vue";
import Debugger from "./Logger";
import { EVENTS, DEBUG, DEBUG_TREE } from "../../Constants";

export type EventType = keyof typeof EVENTS;

export interface Event {
    event: EventType;
    data: any;
}

export interface DialogEvent {
    event: "DIALOG";
    data: Vue;
}

export type EventHandler = (event: Event) => any;

/**
 * Simple event system
 */
class DispatcherSystem {

    private handlers: {
        id?: string,
        handler: EventHandler
    }[] = [];

    private queue: Array<[Event, () => void]> = [];
    private dispatching: boolean = false;

    /**
     * Register an event handler.
     * If you specify an identifier, and it is already registered, it will not be re-registered.
     * @param handler the handler
     * @param id to prevent duplicate registrations, you can specify a unique identifier for this handler
     */
    public register(handler: EventHandler, id?: string) {
        if (id) this.deregister(id);
        this.handlers.push({ id, handler });
    }

    /**
     * Deregister an event handler by it's identifier.
     * @param id the unique identifier of the handler to deregister
     */
    public deregister(id: string) {
        this.handlers = this.handlers.filter((h) => h.id != id);
    }

    /**
     * Dispatch an event throughout the system
     * @param event the event to dispatch
     * @param resolveOverride an override for the resolve function
     * @param queueOverride whether we should bypass the queue
     */
    public dispatch(event: Event, resolveOverride?: () => void, queueOverride?: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            resolve = resolveOverride || resolve;
            if (this.dispatching && !queueOverride) {
                Debugger.debug([`Sending event to the queue:`, event]);
                this.queue.push([event, resolve]);
                return;
            }
            Debugger.debug([`Dispatching event ${event.event}`, event]);
            this.dispatching = true;
            for (let handler of this.handlers) {
                handler.handler(event);
            }
            // If there is a queue to execute, leave dispatching on true
            this.dispatching = this.busy;
            this.nextInLine();
        });
    }

    /**
     * Dispatches throughout the system, sidestepping the queue.
     * @param event the event to dispatch
     */
    public async dirtyDispatch(event: Event): Promise<void> {
        for (let handler of this.handlers) {
            handler.handler(event);
        }
    }

    /**
     * Dispatch the next event in the queue
     */
    private nextInLine() {
        const next = this.queue.shift();
        if (!next) {
            return;
        }
        this.dispatch(next[0], next[1], true);
    }

    /**
     * Returns whether there is still a queue to flush
     */
    private get busy() {
        return this.queue.length > 0;
    }

}

export const Dispatcher = new DispatcherSystem();

if (DEBUG) {
    DEBUG_TREE.Dispatcher = Dispatcher;
}