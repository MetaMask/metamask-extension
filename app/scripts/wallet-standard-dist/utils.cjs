"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAIP_ACCOUNT_ID_REGEX = void 0;
exports.getAddressFromCaipAccountId = getAddressFromCaipAccountId;
exports.getScopeFromWalletStandardChain = getScopeFromWalletStandardChain;
exports.isAccountChangedEvent = isAccountChangedEvent;
const wallet_standard_chains_1 = require("@solana/wallet-standard-chains");
const types_1 = require("./types.cjs");
exports.CAIP_ACCOUNT_ID_REGEX = /^(?<chainId>(?<namespace>[-a-z0-9]{3,8}):(?<reference>[-_a-zA-Z0-9]{1,32})):(?<accountAddress>[-.%a-zA-Z0-9]{1,128})$/u;
/**
 * Validates and parses a CAIP-10 account ID.
 *
 * @param caipAccountId - The CAIP-10 account ID to validate and parse.
 * @returns The CAIP-10 address.
 */
function getAddressFromCaipAccountId(caipAccountId) {
    const match = exports.CAIP_ACCOUNT_ID_REGEX.exec(caipAccountId);
    if (!match?.groups?.accountAddress) {
        throw new Error('Invalid CAIP account ID.');
    }
    return match.groups.accountAddress;
}
function getScopeFromWalletStandardChain(chainId) {
    switch (chainId) {
        case wallet_standard_chains_1.SOLANA_MAINNET_CHAIN:
        case undefined:
            return types_1.Scope.MAINNET;
        case wallet_standard_chains_1.SOLANA_TESTNET_CHAIN:
            return types_1.Scope.TESTNET;
        case wallet_standard_chains_1.SOLANA_DEVNET_CHAIN:
            return types_1.Scope.DEVNET;
        default: {
            if (types_1.scopes.includes(chainId)) {
                return chainId;
            }
            throw new Error(`Unsupported chainId: ${chainId}`);
        }
    }
}
function isAccountChangedEvent(event) {
    return event.params?.notification?.method === 'metamask_accountsChanged';
}
//# sourceMappingURL=utils.cjs.map