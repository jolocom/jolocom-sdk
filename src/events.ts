import { EventEmitter } from 'events'
import TypedEmitter from 'typed-emitter'

export type Unsubscriber = () => void

/**
 * This class wraps TypedEmitter, which is a typescript overlay on
 * the standard EventEmitter class; typings only, no code
 */
export class Emitter<T> extends (EventEmitter as {
  new <T>(): Omit<TypedEmitter<T>, 'on'>
})<T> {
  on<E extends (string | symbol) & keyof T>(
    event: E,
    listener: T[E],
  ): Unsubscriber {
    // @ts-ignore
    EventEmitter.prototype.on.call(this, event, listener)
    return () => {
      super.off(event, listener)
    }
  }
}
