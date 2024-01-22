"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndFormatTransactionsForNonceTracker = exports.getNextNonce = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const logger_1 = require("../logger");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'nonce');
/**
 * Determine the next nonce to be used for a transaction.
 *
 * @param txMeta - The transaction metadata.
 * @param nonceTracker - An instance of a nonce tracker.
 * @returns The next hexadecimal nonce to be used for the given transaction, and optionally a function to release the nonce lock.
 */
function getNextNonce(txMeta, nonceTracker) {
    return __awaiter(this, void 0, void 0, function* () {
        const { customNonceValue, txParams: { from, nonce: existingNonce }, } = txMeta;
        const customNonce = customNonceValue ? (0, controller_utils_1.toHex)(customNonceValue) : undefined;
        if (customNonce) {
            log('Using custom nonce', customNonce);
            return [customNonce, undefined];
        }
        if (existingNonce) {
            log('Using existing nonce', existingNonce);
            return [existingNonce, undefined];
        }
        const nonceLock = yield nonceTracker.getNonceLock(from);
        const nonce = (0, controller_utils_1.toHex)(nonceLock.nextNonce);
        const releaseLock = nonceLock.releaseLock.bind(nonceLock);
        log('Using nonce from nonce tracker', nonce, nonceLock.nonceDetails);
        return [nonce, releaseLock];
    });
}
exports.getNextNonce = getNextNonce;
/**
 * Filter and format transactions for the nonce tracker.
 *
 * @param currentChainId - Chain ID of the current network.
 * @param fromAddress - Address of the account from which the transactions to filter from are sent.
 * @param transactionStatus - Status of the transactions for which to filter.
 * @param transactions - Array of transactionMeta objects that have been prefiltered.
 * @returns Array of transactions formatted for the nonce tracker.
 */
function getAndFormatTransactionsForNonceTracker(currentChainId, fromAddress, transactionStatus, transactions) {
    return transactions
        .filter(({ chainId, isTransfer, isUserOperation, status, txParams: { from } }) => !isTransfer &&
        !isUserOperation &&
        chainId === currentChainId &&
        status === transactionStatus &&
        from.toLowerCase() === fromAddress.toLowerCase())
        .map(({ status, txParams: { from, gas, value, nonce } }) => {
        // the only value we care about is the nonce
        // but we need to return the other values to satisfy the type
        // TODO: refactor nonceTracker to not require this
        /* istanbul ignore next */
        return {
            status,
            history: [{}],
            txParams: {
                from: from !== null && from !== void 0 ? from : '',
                gas: gas !== null && gas !== void 0 ? gas : '',
                value: value !== null && value !== void 0 ? value : '',
                nonce: nonce !== null && nonce !== void 0 ? nonce : '',
            },
        };
    });
}
exports.getAndFormatTransactionsForNonceTracker = getAndFormatTransactionsForNonceTracker;
//# sourceMappingURL=nonce.js.map