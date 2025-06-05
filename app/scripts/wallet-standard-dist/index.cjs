"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletStandard = getWalletStandard;
exports.registerSolanaWalletStandard = registerSolanaWalletStandard;
const wallet_1 = require("@wallet-standard/wallet");
const wallet_2 = require("./wallet.cjs");
function getWalletStandard(options) {
    return new wallet_2.MetamaskWallet(options);
}
async function registerSolanaWalletStandard(options) {
    const wallet = getWalletStandard(options);
    (0, wallet_1.registerWallet)(wallet);
}
//# sourceMappingURL=index.cjs.map