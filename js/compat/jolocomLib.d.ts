/// <reference types="node" />
export declare const encryptWithLib3: (message: Buffer, password: string) => Buffer;
export declare const decryptWithLib3: (message: Buffer, password: string) => Buffer;
export declare const encryptWithLib4: (message: Buffer, password: string) => Promise<Buffer>;
export declare const decryptWithLib4: (message: Buffer, password: string) => Buffer;
