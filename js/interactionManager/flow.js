"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flow = void 0;
class Flow {
    constructor(ctx) {
        this.ctx = ctx;
    }
    get type() {
        // @ts-ignore
        return this.constructor.type;
    }
    getState() {
        return this.state;
    }
}
exports.Flow = Flow;
//# sourceMappingURL=flow.js.map