"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionMetadata = void 0;
const transaction_controller_1 = require("@metamask/transaction-controller");
const ethereumjs_util_1 = require("ethereumjs-util");
const constants_1 = require("../constants");
const types_1 = require("../types");
/**
 * Converts a user operation metadata object into a transaction metadata object.
 * @param metadata - The user operation metadata object to convert.
 * @returns The equivalent transaction metadata object.
 */
function getTransactionMetadata(metadata) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const { actualGasCost, actualGasUsed, baseFeePerGas, chainId, error: rawError, origin, transactionHash, id, swapsMetadata, time, transactionParams, transactionType, userFeeLevel: rawUserFeeLevel, userOperation, } = metadata;
    if (!transactionParams) {
        return undefined;
    }
    // effectiveGasPrice = actualGasCost / actualGasUsed
    const effectiveGasPrice = actualGasCost && actualGasUsed
        ? (0, ethereumjs_util_1.addHexPrefix)(new ethereumjs_util_1.BN((0, ethereumjs_util_1.stripHexPrefix)(actualGasCost), 16)
            .div(new ethereumjs_util_1.BN((0, ethereumjs_util_1.stripHexPrefix)(actualGasUsed), 16))
            .toString(16))
        : undefined;
    const error = (rawError
        ? {
            name: rawError.name,
            message: rawError.message,
            stack: rawError.stack,
            code: rawError.code,
            rpc: rawError.rpc,
        }
        : undefined);
    const status = {
        [types_1.UserOperationStatus.Unapproved]: transaction_controller_1.TransactionStatus.unapproved,
        [types_1.UserOperationStatus.Approved]: transaction_controller_1.TransactionStatus.approved,
        [types_1.UserOperationStatus.Signed]: transaction_controller_1.TransactionStatus.signed,
        [types_1.UserOperationStatus.Submitted]: transaction_controller_1.TransactionStatus.submitted,
        [types_1.UserOperationStatus.Confirmed]: transaction_controller_1.TransactionStatus.confirmed,
        [types_1.UserOperationStatus.Failed]: transaction_controller_1.TransactionStatus.failed,
    }[metadata.status];
    const gas = addHex(userOperation.preVerificationGas, userOperation.verificationGasLimit, userOperation.callGasLimit);
    const hasPaymaster = userOperation.paymasterAndData !== constants_1.EMPTY_BYTES;
    const maxFeePerGas = hasPaymaster ? constants_1.VALUE_ZERO : userOperation.maxFeePerGas;
    const maxPriorityFeePerGas = hasPaymaster
        ? constants_1.VALUE_ZERO
        : userOperation.maxPriorityFeePerGas;
    const nonce = userOperation.nonce === constants_1.EMPTY_BYTES ? undefined : userOperation.nonce;
    const txParams = Object.assign(Object.assign({}, transactionParams), { from: userOperation.sender, gas,
        nonce,
        maxFeePerGas,
        maxPriorityFeePerGas });
    // User operations only support EIP-1559 gas fee properties.
    delete txParams.gasPrice;
    const swaps = {
        approvalTxId: (_a = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.approvalTxId) !== null && _a !== void 0 ? _a : undefined,
        destinationTokenAddress: (_b = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.destinationTokenAddress) !== null && _b !== void 0 ? _b : undefined,
        destinationTokenDecimals: (_c = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.destinationTokenDecimals) !== null && _c !== void 0 ? _c : undefined,
        destinationTokenSymbol: (_d = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.destinationTokenSymbol) !== null && _d !== void 0 ? _d : undefined,
        estimatedBaseFee: (_e = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.estimatedBaseFee) !== null && _e !== void 0 ? _e : undefined,
        sourceTokenSymbol: (_f = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.sourceTokenSymbol) !== null && _f !== void 0 ? _f : undefined,
        swapMetaData: (_g = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.swapMetaData) !== null && _g !== void 0 ? _g : undefined,
        swapTokenValue: (_h = swapsMetadata === null || swapsMetadata === void 0 ? void 0 : swapsMetadata.swapTokenValue) !== null && _h !== void 0 ? _h : undefined,
    };
    const userFeeLevel = hasPaymaster ? transaction_controller_1.UserFeeLevel.CUSTOM : rawUserFeeLevel;
    return Object.assign({ baseFeePerGas: (_j = baseFeePerGas) !== null && _j !== void 0 ? _j : undefined, chainId: chainId, error, hash: transactionHash !== null && transactionHash !== void 0 ? transactionHash : undefined, id, isUserOperation: true, origin,
        status,
        time,
        txParams, txReceipt: {
            effectiveGasPrice: effectiveGasPrice !== null && effectiveGasPrice !== void 0 ? effectiveGasPrice : undefined,
            gasUsed: actualGasUsed !== null && actualGasUsed !== void 0 ? actualGasUsed : undefined,
        }, type: transactionType !== null && transactionType !== void 0 ? transactionType : undefined, userFeeLevel: userFeeLevel }, swaps);
}
exports.getTransactionMetadata = getTransactionMetadata;
/**
 * Adds the given hexadecimal values together.
 * @param values - The hexadecimal values to add together.
 * @returns The sum of the given hexadecimal values.
 */
function addHex(...values) {
    const total = new ethereumjs_util_1.BN(0);
    for (const value of values) {
        if (!value) {
            continue;
        }
        total.iadd(new ethereumjs_util_1.BN((0, ethereumjs_util_1.stripHexPrefix)(value), 16));
    }
    return (0, ethereumjs_util_1.addHexPrefix)(total.toString(16));
}
//# sourceMappingURL=transaction.js.map