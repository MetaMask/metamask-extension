"use strict";
/* eslint-disable jsdoc/require-jsdoc */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionMetadata = void 0;
const transaction_controller_1 = require("@metamask/transaction-controller");
const ethereumjs_util_1 = require("ethereumjs-util");
const types_1 = require("../types");
function getTransactionMetadata(metadata) {
    var _a;
    const { actualGasCost, actualGasUsed, baseFeePerGas, chainId, error: rawError, transactionHash, id, time, transactionParams, userOperation, userFeeLevel, } = metadata;
    if (!transactionParams) {
        return undefined;
    }
    const { nonce } = userOperation !== null && userOperation !== void 0 ? userOperation : {};
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
    const gas = addHex(userOperation === null || userOperation === void 0 ? void 0 : userOperation.preVerificationGas, userOperation === null || userOperation === void 0 ? void 0 : userOperation.verificationGasLimit, userOperation === null || userOperation === void 0 ? void 0 : userOperation.callGasLimit);
    const maxFeePerGas = userOperation.maxFeePerGas === '0x'
        ? undefined
        : userOperation.maxFeePerGas;
    const maxPriorityFeePerGas = userOperation.maxPriorityFeePerGas === '0x'
        ? undefined
        : userOperation.maxPriorityFeePerGas;
    const txParams = Object.assign(Object.assign({}, transactionParams), { from: userOperation.sender, gas,
        nonce,
        maxFeePerGas,
        maxPriorityFeePerGas });
    // Since the user operations only support EIP-1559, we won't need this.
    delete txParams.gasPrice;
    const type = 'userOperation';
    return {
        baseFeePerGas: (_a = baseFeePerGas) !== null && _a !== void 0 ? _a : undefined,
        chainId: chainId,
        error,
        hash: transactionHash !== null && transactionHash !== void 0 ? transactionHash : undefined,
        id,
        txReceipt: {
            effectiveGasPrice: effectiveGasPrice !== null && effectiveGasPrice !== void 0 ? effectiveGasPrice : undefined,
            gasUsed: actualGasUsed !== null && actualGasUsed !== void 0 ? actualGasUsed : undefined,
        },
        status,
        time,
        txParams,
        type,
        userFeeLevel: userFeeLevel || undefined,
    };
}
exports.getTransactionMetadata = getTransactionMetadata;
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