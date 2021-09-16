"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidMethodKeeper = void 0;
const didMethods_1 = require("jolocom-lib/js/didMethods");
class DidMethodKeeper {
    constructor(defaultMethod = didMethods_1.didMethods.jolo) {
        this.methods = {};
        this._defaultMethod = defaultMethod;
        this.methods[defaultMethod.prefix] = defaultMethod;
    }
    register(methodName, implementation) {
        if (this.methods[methodName]) {
            throw new Error('DID method "' + methodName + '" already registered');
        }
        this.methods[methodName] = implementation;
    }
    get(methodName) {
        const method = this.methods[methodName];
        if (!method) {
            throw new Error('no did method "' + methodName + '" registered!');
        }
        return method;
    }
    getForDid(did) {
        const withoutPrefix = did.substr(4);
        if (!withoutPrefix || !did.startsWith('did:')) {
            throw new Error('DID method resolving. Could not parse DID: "' + did + '"!');
        }
        for (const [key, value] of Object.entries(this.methods)) {
            if (withoutPrefix.startsWith(key)) {
                return value;
            }
        }
        throw new Error('DID method resolving. DID method for DID "' + did + '" is not registered!');
    }
    setDefault(method) {
        this._defaultMethod = method;
    }
    getDefault() {
        return this._defaultMethod;
    }
}
exports.DidMethodKeeper = DidMethodKeeper;
//# sourceMappingURL=didMethodKeeper.js.map