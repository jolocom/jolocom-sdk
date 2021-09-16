import { IDidMethod } from 'jolocom-lib/js/didMethods/types';
export declare class DidMethodKeeper {
    methods: {
        [k: string]: IDidMethod;
    };
    private _defaultMethod;
    constructor(defaultMethod?: import("jolocom-lib/js/didMethods/jolo").JoloDidMethod);
    register(methodName: string, implementation: IDidMethod): void;
    get(methodName: string): IDidMethod;
    getForDid(did: string): IDidMethod;
    setDefault(method: IDidMethod): void;
    getDefault(): IDidMethod;
}
