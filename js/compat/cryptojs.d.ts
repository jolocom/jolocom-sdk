/**
 * This is a compatibility layer for decrypting AES encrypted base64 encoded
 * strings from CryptoJS.AES.encrypt
 *
 * based on crypto-js 3.1.9-1
 *
 * The wallet used to depend on crypto-js for en/decryption of the seed, but
 * then migrated to using the jolocom-lib (which uses crypto-browserify). The
 * details of the encryption (IV, key derivation) are slightly different, so
 * previously stored encrypted seeds needed to be re-encrypted.
 *
 */
/// <reference types="node" />
export declare const CryptoJS: {
    AES: {
        decrypt: typeof AESDecrypt;
    };
    algo: {
        AES: {
            keySize: number;
            ivSize: number;
        };
    };
    kdf: {
        OpenSSL: {
            execute: typeof OpenSSLKdfExecute;
        };
    };
    format: {
        OpenSSL: {
            parse: typeof OpenSSLFormatterParse;
        };
    };
};
export default CryptoJS;
/**
 * This function emulates CryptoJS.format.OpenSSL.parse (cipher-core.js)
 * It parses a base64 cipher text and separates the salt bytes if any
 */
declare function OpenSSLFormatterParse(cipherTextBase64: string): {
    salt: Buffer | undefined;
    ciphertext: Buffer;
};
/**
 * This function emulates CryptoJS.kdf.OpenSSL.execute (cipher-core.js)
 * It extracts a key and IV for the AES algorithm
 */
declare function OpenSSLKdfExecute(password: string, keySize: number, ivSize: number, salt: Buffer | undefined): {
    key: Buffer;
    iv: Buffer;
};
/**
 * This function emulates CryptoJS.AES.decrypt (aes.js), which
 * delegates to PasswordBasedCipher (cipher-core.js)
 *
 * PasswordBasedCipher.cfg = { kdf: OpenSSLKdf }
 * BlockCipher.cfg = { format: OpenSSLFormatter }
 *
 * AES extends BlockCipher
 * OpenSSLFormatter is CryptoJS.format.OpenSSL (cipher-core.js)
 * OpenSSLKdf is CryptoJS.kdf.OpenSSL (cipher-core.js)
 */
export declare function AESDecrypt(cipherText: string, pass: string): Buffer;
export declare function reencryptWithJolocomLib(cipherTextBase64: string, password: string): string;
