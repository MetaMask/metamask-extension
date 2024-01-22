"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGasFeeValues = exports.normalizeTxError = exports.validateIfTransactionUnapproved = exports.validateMinimumIncrease = exports.getIncreasedPriceFromExisting = exports.getIncreasedPriceHex = exports.isGasPriceValue = exports.isFeeMarketEIP1559Values = exports.validateGasValues = exports.isEIP1559Transaction = exports.normalizeTxParams = exports.ESTIMATE_GAS_ERROR = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const utils_1 = require("@metamask/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const types_1 = require("../types");
exports.ESTIMATE_GAS_ERROR = 'eth_estimateGas rpc method error';
// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NORMALIZERS = {
    data: (data) => (0, ethereumjs_util_1.addHexPrefix)(data),
    from: (from) => (0, ethereumjs_util_1.addHexPrefix)(from).toLowerCase(),
    gas: (gas) => (0, ethereumjs_util_1.addHexPrefix)(gas),
    gasLimit: (gas) => (0, ethereumjs_util_1.addHexPrefix)(gas),
    gasPrice: (gasPrice) => (0, ethereumjs_util_1.addHexPrefix)(gasPrice),
    nonce: (nonce) => (0, ethereumjs_util_1.addHexPrefix)(nonce),
    to: (to) => (0, ethereumjs_util_1.addHexPrefix)(to).toLowerCase(),
    value: (value) => (0, ethereumjs_util_1.addHexPrefix)(value),
    maxFeePerGas: (maxFeePerGas) => (0, ethereumjs_util_1.addHexPrefix)(maxFeePerGas),
    maxPriorityFeePerGas: (maxPriorityFeePerGas) => (0, ethereumjs_util_1.addHexPrefix)(maxPriorityFeePerGas),
    estimatedBaseFee: (maxPriorityFeePerGas) => (0, ethereumjs_util_1.addHexPrefix)(maxPriorityFeePerGas),
    type: (type) => (type === '0x0' ? '0x0' : undefined),
};
/**
 * Normalizes properties on transaction params.
 *
 * @param txParams - The transaction params to normalize.
 * @returns Normalized transaction params.
 */
function normalizeTxParams(txParams) {
    const normalizedTxParams = { from: '' };
    for (const key of (0, utils_1.getKnownPropertyNames)(NORMALIZERS)) {
        if (txParams[key]) {
            normalizedTxParams[key] = NORMALIZERS[key](txParams[key]);
        }
    }
    if (!normalizedTxParams.value) {
        normalizedTxParams.value = '0x0';
    }
    return normalizedTxParams;
}
exports.normalizeTxParams = normalizeTxParams;
/**
 * Checks if a transaction is EIP-1559 by checking for the existence of
 * maxFeePerGas and maxPriorityFeePerGas within its parameters.
 *
 * @param txParams - Transaction params object to add.
 * @returns Boolean that is true if the transaction is EIP-1559 (has maxFeePerGas and maxPriorityFeePerGas), otherwise returns false.
 */
function isEIP1559Transaction(txParams) {
    const hasOwnProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    return (hasOwnProp(txParams, 'maxFeePerGas') &&
        hasOwnProp(txParams, 'maxPriorityFeePerGas'));
}
exports.isEIP1559Transaction = isEIP1559Transaction;
const validateGasValues = (gasValues) => {
    Object.keys(gasValues).forEach((key) => {
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = gasValues[key];
        if (typeof value !== 'string' || !(0, ethereumjs_util_1.isHexString)(value)) {
            throw new TypeError(`expected hex string for ${key} but received: ${value}`);
        }
    });
};
exports.validateGasValues = validateGasValues;
const isFeeMarketEIP1559Values = (gasValues) => (gasValues === null || gasValues === void 0 ? void 0 : gasValues.maxFeePerGas) !== undefined ||
    (gasValues === null || gasValues === void 0 ? void 0 : gasValues.maxPriorityFeePerGas) !== undefined;
exports.isFeeMarketEIP1559Values = isFeeMarketEIP1559Values;
const isGasPriceValue = (gasValues) => (gasValues === null || gasValues === void 0 ? void 0 : gasValues.gasPrice) !== undefined;
exports.isGasPriceValue = isGasPriceValue;
const getIncreasedPriceHex = (value, rate) => (0, ethereumjs_util_1.addHexPrefix)(`${parseInt(`${value * rate}`, 10).toString(16)}`);
exports.getIncreasedPriceHex = getIncreasedPriceHex;
const getIncreasedPriceFromExisting = (value, rate) => {
    return (0, exports.getIncreasedPriceHex)((0, controller_utils_1.convertHexToDecimal)(value), rate);
};
exports.getIncreasedPriceFromExisting = getIncreasedPriceFromExisting;
/**
 * Validates that the proposed value is greater than or equal to the minimum value.
 *
 * @param proposed - The proposed value.
 * @param min - The minimum value.
 * @returns The proposed value.
 * @throws Will throw if the proposed value is too low.
 */
function validateMinimumIncrease(proposed, min) {
    const proposedDecimal = (0, controller_utils_1.convertHexToDecimal)(proposed);
    const minDecimal = (0, controller_utils_1.convertHexToDecimal)(min);
    if (proposedDecimal >= minDecimal) {
        return proposed;
    }
    const errorMsg = `The proposed value: ${proposedDecimal} should meet or exceed the minimum value: ${minDecimal}`;
    throw new Error(errorMsg);
}
exports.validateMinimumIncrease = validateMinimumIncrease;
/**
 * Validates that a transaction is unapproved.
 * Throws if the transaction is not unapproved.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param fnName - The name of the function calling this helper.
 */
function validateIfTransactionUnapproved(transactionMeta, fnName) {
    if ((transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.status) !== types_1.TransactionStatus.unapproved) {
        throw new Error(`TransactionsController: Can only call ${fnName} on an unapproved transaction.
      Current tx status: ${transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.status}`);
    }
}
exports.validateIfTransactionUnapproved = validateIfTransactionUnapproved;
/**
 * Normalizes properties on transaction params.
 *
 * @param error - The error to be normalize.
 * @returns Normalized transaction error.
 */
function normalizeTxError(error) {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error === null || error === void 0 ? void 0 : error.code,
        rpc: error === null || error === void 0 ? void 0 : error.value,
    };
}
exports.normalizeTxError = normalizeTxError;
/**
 * Normalize an object containing gas fee values.
 *
 * @param gasFeeValues - An object containing gas fee values.
 * @returns An object containing normalized gas fee values.
 */
function normalizeGasFeeValues(gasFeeValues) {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalize = (value) => typeof value === 'string' ? (0, ethereumjs_util_1.addHexPrefix)(value) : value;
    if ('gasPrice' in gasFeeValues) {
        return {
            gasPrice: normalize(gasFeeValues.gasPrice),
        };
    }
    return {
        maxFeePerGas: normalize(gasFeeValues.maxFeePerGas),
        maxPriorityFeePerGas: normalize(gasFeeValues.maxPriorityFeePerGas),
    };
}
exports.normalizeGasFeeValues = normalizeGasFeeValues;
//# sourceMappingURL=utils.js.map