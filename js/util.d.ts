/// <reference types="node" />
import { IdentitySummary, ExportAgentOptions, DeleteAgentOptions } from './types';
import { Identity } from 'jolocom-lib/js/identity/identity';
/**
 * Given an identity, returns an object satisfying the {@link IdentitySummary} interface.
 * @dev Currently used with the {@link IssuerCard} component
 * @note In case the identity does not contain a Public Profile credential,
 * the function will return a minimal default which can be rendered.
 * @param identity - Instance of identity to generate the summary for
 */
export declare const generateIdentitySummary: (identity: Identity) => IdentitySummary;
export declare function generateSecureRandomBytes(length: number): Promise<Buffer>;
/**
 * Simple implementation of jsonpath that only supports very direct addressing
 * This takes a path p and and obj and returns the nested value denoted by the
 * path
 *
 * Example:
 * let obj = { some: { properties: ['a', 'b'] } }
 * jsonpath('$.some.properties.0', obj) === 'a'
 * jsonpath("$['some']['properties'][1]", obj) === 'b'
 * jsonpath("$.some", obj) === obj.some
 *
 * @param p - a path into the object, as in the example
 * @param obj - an object or array
 */
export declare const jsonpath: (p: string, obj: object | any[]) => any;
export declare const getExportAgentOptions: (options?: ExportAgentOptions | undefined) => {
    password?: string | undefined;
    credentials?: boolean | undefined;
    interactions?: boolean | undefined;
} | {
    password?: string | undefined;
    credentials?: boolean | undefined;
    interactions?: boolean | undefined;
};
export declare const getDeleteAgentOptions: (options?: DeleteAgentOptions | undefined) => DeleteAgentOptions;
