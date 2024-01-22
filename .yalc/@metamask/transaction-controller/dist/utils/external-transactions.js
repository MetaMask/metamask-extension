"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfirmedExternalTransaction = void 0;
// These utility functions are exclusively used by `confirmExternalTransaction` method in controller
const rpc_errors_1 = require("@metamask/rpc-errors");
const types_1 = require("../types");
/**
 * Validates the external provided transaction meta.
 *
 * @param transactionMeta - The transaction meta to validate.
 * @param confirmedTxs - The confirmed transactions in controller state.
 * @param pendingTxs - The submitted transactions in controller state.
 */
function validateConfirmedExternalTransaction(transactionMeta, confirmedTxs, pendingTxs) {
    if (!transactionMeta || !transactionMeta.txParams) {
        throw rpc_errors_1.rpcErrors.invalidParams('"transactionMeta" or "transactionMeta.txParams" is missing');
    }
    if (transactionMeta.status !== types_1.TransactionStatus.confirmed) {
        throw rpc_errors_1.rpcErrors.invalidParams('External transaction status should be "confirmed"');
    }
    const externalTxNonce = transactionMeta.txParams.nonce;
    if (pendingTxs && pendingTxs.length > 0) {
        const foundPendingTxByNonce = pendingTxs.find((tx) => { var _a; return ((_a = tx.txParams) === null || _a === void 0 ? void 0 : _a.nonce) === externalTxNonce; });
        if (foundPendingTxByNonce) {
            throw rpc_errors_1.rpcErrors.invalidParams('External transaction nonce should not be in pending txs');
        }
    }
    if (confirmedTxs && confirmedTxs.length > 0) {
        const foundConfirmedTxByNonce = confirmedTxs.find((tx) => { var _a; return ((_a = tx.txParams) === null || _a === void 0 ? void 0 : _a.nonce) === externalTxNonce; });
        if (foundConfirmedTxByNonce) {
            throw rpc_errors_1.rpcErrors.invalidParams('External transaction nonce should not be in confirmed txs');
        }
    }
}
exports.validateConfirmedExternalTransaction = validateConfirmedExternalTransaction;
//# sourceMappingURL=external-transactions.js.map