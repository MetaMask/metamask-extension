"use strict";
/* eslint-disable jsdoc/require-jsdoc */
Object.defineProperty(exports, "__esModule", { value: true });
exports.signHash = void 0;
const bytes_1 = require("@ethersproject/bytes");
const wallet_1 = require("@ethersproject/wallet");
function signHash(hash, privateKey) {
    const data = (0, bytes_1.arrayify)(hash);
    const signer = new wallet_1.Wallet(privateKey);
    return signer.signMessage(data);
}
exports.signHash = signHash;
//# sourceMappingURL=ecdsa.js.map