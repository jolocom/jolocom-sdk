"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Emitter = void 0;
const events_1 = require("events");
/**
 * This class wraps TypedEmitter, which is a typescript overlay on
 * the standard EventEmitter class; typings only, no code
 */
class Emitter extends events_1.EventEmitter {
    on(event, listener) {
        // @ts-ignore
        events_1.EventEmitter.prototype.on.call(this, event, listener);
        return () => {
            super.off(event, listener);
        };
    }
}
exports.Emitter = Emitter;
//# sourceMappingURL=events.js.map