import TypedEmitter from 'typed-emitter';
export declare type Unsubscriber = () => void;
declare const Emitter_base: new <T_1>() => Pick<TypedEmitter<T_1>, "addListener" | "once" | "prependListener" | "prependOnceListener" | "off" | "removeAllListeners" | "removeListener" | "emit" | "eventNames" | "rawListeners" | "listeners" | "listenerCount" | "getMaxListeners" | "setMaxListeners">;
/**
 * This class wraps TypedEmitter, which is a typescript overlay on
 * the standard EventEmitter class; typings only, no code
 */
export declare class Emitter<T> extends Emitter_base<T> {
    on<E extends (string | symbol) & keyof T>(event: E, listener: T[E]): Unsubscriber;
}
export {};
