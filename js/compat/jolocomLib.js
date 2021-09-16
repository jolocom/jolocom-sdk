"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptWithLib4 = exports.encryptWithLib4 = exports.decryptWithLib3 = exports.encryptWithLib3 = void 0;
const crypto_1 = require("crypto");
// https://github.com/jolocom/jolocom-lib/blob/v3.0.1/ts/vaultedKeyProvider/softwareProvider.ts#L168
exports.encryptWithLib3 = (message, password) => {
    const cipher = crypto_1.createCipher('aes-256-cbc', password);
    return Buffer.concat([cipher.update(message), cipher.final()]);
};
// https://github.com/jolocom/jolocom-lib/blob/v3.0.1/ts/vaultedKeyProvider/softwareProvider.ts#L180
exports.decryptWithLib3 = (message, password) => {
    const decipher = crypto_1.createDecipher('aes-256-cbc', password);
    return Buffer.concat([decipher.update(message), decipher.final()]);
};
// @dev https://github.com/jolocom/jolocom-lib/blob/release/4.0.2/ts/vaultedKeyProvider/softwareProvider.ts#L250
exports.encryptWithLib4 = async (message, password) => {
    const iv = await crypto_1.randomBytes(16);
    const cipher = crypto_1.createCipheriv('aes-256-cbc', normalizePassword(password), iv);
    return Buffer.concat([iv, cipher.update(message), cipher.final()]);
};
// @dev https://github.com/jolocom/jolocom-lib/blob/release/4.0.2/ts/vaultedKeyProvider/softwareProvider.ts#L262
exports.decryptWithLib4 = (message, password) => {
    const IV_LENGTH = 16;
    const iv = message.slice(0, IV_LENGTH);
    const cipherText = message.slice(IV_LENGTH);
    const decipher = crypto_1.createDecipheriv('aes-256-cbc', normalizePassword(password), iv);
    return Buffer.concat([decipher.update(cipherText), decipher.final()]);
};
// @dev https://github.com/jolocom/jolocom-lib/blob/release/4.0.2/ts/vaultedKeyProvider/softwareProvider.ts#L369
const normalizePassword = (password) => password.length === 32
    ? password
    : crypto_1.createHash('sha256')
        .update(password)
        .digest();
//# sourceMappingURL=jolocomLib.js.map