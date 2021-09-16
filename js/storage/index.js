"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaivePasswordStore = void 0;
class NaivePasswordStore {
    constructor() {
        this._pass = 'default_pass';
    }
    async getPassword() {
        return this._pass;
    }
}
exports.NaivePasswordStore = NaivePasswordStore;
//# sourceMappingURL=index.js.map