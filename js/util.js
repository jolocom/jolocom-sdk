"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeleteAgentOptions = exports.getExportAgentOptions = exports.jsonpath = exports.generateSecureRandomBytes = exports.generateIdentitySummary = void 0;
const crypto_1 = require("crypto");
const types_1 = require("./types");
/**
 * Given an identity, returns an object satisfying the {@link IdentitySummary} interface.
 * @dev Currently used with the {@link IssuerCard} component
 * @note In case the identity does not contain a Public Profile credential,
 * the function will return a minimal default which can be rendered.
 * @param identity - Instance of identity to generate the summary for
 */
exports.generateIdentitySummary = (identity) => {
    const { publicProfile, did } = identity;
    if (!publicProfile) {
        return {
            did,
        };
    }
    const { id, ...parsedProfile } = publicProfile.claim;
    return {
        did,
        publicProfile: parsedProfile,
    };
};
async function generateSecureRandomBytes(length) {
    return new Promise((resolve, reject) => {
        crypto_1.randomBytes(length, (err, bytes) => {
            if (err)
                reject(err);
            else
                resolve(bytes);
        });
    });
}
exports.generateSecureRandomBytes = generateSecureRandomBytes;
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
exports.jsonpath = function simpleJsonPath(p, obj) {
    let trimmedP = p.trim();
    if (trimmedP[0] != '$')
        return;
    let frags;
    if (trimmedP[1] === '.') {
        // remove the beginning '$.' and split on '.'
        frags = trimmedP.substring(2).split('.');
    }
    else if (trimmedP[1] === '[') {
        // remove the beginning '$' and replace separating '][' with ','
        trimmedP = trimmedP.substring(1).replace('][', ',');
        // result should look like a json list ['some',2]
        frags = JSON.parse(trimmedP);
    }
    else {
        return;
    }
    // go through the object key path and reduce to desired value
    return frags.reduce((obj, k) => {
        if (!obj)
            return;
        if (Array.isArray(obj)) {
            try {
                return obj[parseInt(k)];
            }
            catch (_a) {
                return;
            }
        }
        else if (typeof obj === 'object') {
            return obj[k];
        }
    }, obj);
};
exports.getExportAgentOptions = (options) => {
    return {
        ...types_1.DEFAULT_EXPORT_OPTIONS,
        ...options
    };
};
exports.getDeleteAgentOptions = (options) => ({ ...types_1.DEFAULT_DELETE_AGENT_OPTIONS, ...options });
//# sourceMappingURL=util.js.map