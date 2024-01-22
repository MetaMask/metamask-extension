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
exports.validateTxParams = exports.validateTransactionOrigin = void 0;
const abi_1 = require("@ethersproject/abi");
const controller_utils_1 = require("@metamask/controller-utils");
const metamask_eth_abis_1 = require("@metamask/metamask-eth-abis");
const rpc_errors_1 = require("@metamask/rpc-errors");
const types_1 = require("../types");
const utils_1 = require("./utils");
/**
 * Validates whether a transaction initiated by a specific 'from' address is permitted by the origin.
 *
 * @param permittedAddresses - The permitted accounts for the given origin.
 * @param selectedAddress - The currently selected Ethereum address in the wallet.
 * @param from - The address from which the transaction is initiated.
 * @param origin - The origin or source of the transaction.
 * @throws Throws an error if the transaction is not permitted.
 */
function validateTransactionOrigin(permittedAddresses, selectedAddress, from, origin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (origin === controller_utils_1.ORIGIN_METAMASK) {
            // Ensure the 'from' address matches the currently selected address
            if (from !== selectedAddress) {
                throw rpc_errors_1.rpcErrors.internal({
                    message: `Internally initiated transaction is using invalid account.`,
                    data: {
                        origin,
                        fromAddress: from,
                        selectedAddress,
                    },
                });
            }
            return;
        }
        // Check if the origin has permissions to initiate transactions from the specified address
        if (!permittedAddresses.includes(from)) {
            throw rpc_errors_1.providerErrors.unauthorized({ data: { origin } });
        }
    });
}
exports.validateTransactionOrigin = validateTransactionOrigin;
/**
 * Validates the transaction params for required properties and throws in
 * the event of any validation error.
 *
 * @param txParams - Transaction params object to validate.
 * @param isEIP1559Compatible - whether or not the current network supports EIP-1559 transactions.
 */
function validateTxParams(txParams, isEIP1559Compatible = true) {
    validateEIP1559Compatibility(txParams, isEIP1559Compatible);
    validateParamFrom(txParams.from);
    validateParamRecipient(txParams);
    validateParamValue(txParams.value);
    validateParamData(txParams.data);
    validateParamChainId(txParams.chainId);
    validateGasFeeParams(txParams);
}
exports.validateTxParams = validateTxParams;
/**
 * Validates EIP-1559 compatibility for transaction creation.
 *
 * @param txParams - The transaction parameters to validate.
 * @param isEIP1559Compatible - Indicates if the current network supports EIP-1559.
 * @throws Throws invalid params if the transaction specifies EIP-1559 but the network does not support it.
 */
function validateEIP1559Compatibility(txParams, isEIP1559Compatible) {
    if ((0, utils_1.isEIP1559Transaction)(txParams) && !isEIP1559Compatible) {
        throw rpc_errors_1.rpcErrors.invalidParams('Invalid transaction params: params specify an EIP-1559 transaction but the current network does not support EIP-1559');
    }
}
/**
 * Validates value property, ensuring it is a valid positive integer number
 * denominated in wei.
 *
 * @param value - The value to validate, expressed as a string.
 * @throws Throws an error if the value is not a valid positive integer
 * number denominated in wei.
 * - If the value contains a hyphen (-), it is considered invalid.
 * - If the value contains a decimal point (.), it is considered invalid.
 * - If the value is not a finite number, is NaN, or is not a safe integer, it is considered invalid.
 */
function validateParamValue(value) {
    if (value !== undefined) {
        if (value.includes('-')) {
            throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction value "${value}": not a positive number.`);
        }
        if (value.includes('.')) {
            throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction value "${value}": number must be in wei.`);
        }
        const intValue = parseInt(value, 10);
        const isValid = Number.isFinite(intValue) &&
            !Number.isNaN(intValue) &&
            !isNaN(Number(value)) &&
            Number.isSafeInteger(intValue);
        if (!isValid) {
            throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction value ${value}: number must be a valid number.`);
        }
    }
}
/**
 * Validates the recipient address in a transaction's parameters.
 *
 * @param txParams - The transaction parameters object to validate.
 * @throws Throws an error if the recipient address is invalid:
 * - If the recipient address is an empty string ('0x') or undefined and the transaction contains data,
 * the "to" field is removed from the transaction parameters.
 * - If the recipient address is not a valid hexadecimal Ethereum address, an error is thrown.
 */
function validateParamRecipient(txParams) {
    if (txParams.to === '0x' || txParams.to === undefined) {
        if (txParams.data) {
            delete txParams.to;
        }
        else {
            throw rpc_errors_1.rpcErrors.invalidParams(`Invalid "to" address.`);
        }
    }
    else if (txParams.to !== undefined && !(0, controller_utils_1.isValidHexAddress)(txParams.to)) {
        throw rpc_errors_1.rpcErrors.invalidParams(`Invalid "to" address.`);
    }
}
/**
 * Validates the recipient address in a transaction's parameters.
 *
 * @param from - The from property to validate.
 * @throws Throws an error if the recipient address is invalid:
 * - If the recipient address is an empty string ('0x') or undefined and the transaction contains data,
 * the "to" field is removed from the transaction parameters.
 * - If the recipient address is not a valid hexadecimal Ethereum address, an error is thrown.
 */
function validateParamFrom(from) {
    if (!from || typeof from !== 'string') {
        throw rpc_errors_1.rpcErrors.invalidParams(`Invalid "from" address ${from}: not a string.`);
    }
    if (!(0, controller_utils_1.isValidHexAddress)(from)) {
        throw rpc_errors_1.rpcErrors.invalidParams('Invalid "from" address.');
    }
}
/**
 * Validates input data for transactions.
 *
 * @param value - The input data to validate.
 * @throws Throws invalid params if the input data is invalid.
 */
function validateParamData(value) {
    if (value) {
        const ERC20Interface = new abi_1.Interface(metamask_eth_abis_1.abiERC20);
        try {
            ERC20Interface.parseTransaction({ data: value });
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            if (error.message.match(/BUFFER_OVERRUN/u)) {
                throw rpc_errors_1.rpcErrors.invalidParams('Invalid transaction params: data out-of-bounds, BUFFER_OVERRUN.');
            }
        }
    }
}
/**
 * Validates chainId type.
 *
 * @param chainId - The chainId to validate.
 */
function validateParamChainId(chainId) {
    if (chainId !== undefined &&
        typeof chainId !== 'number' &&
        typeof chainId !== 'string') {
        throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction params: chainId is not a Number or hex string. got: (${chainId})`);
    }
}
/**
 * Validates gas values.
 *
 * @param txParams - The transaction parameters to validate.
 */
function validateGasFeeParams(txParams) {
    if (txParams.gasPrice) {
        ensureProperTransactionEnvelopeTypeProvided(txParams, 'gasPrice');
        ensureMutuallyExclusiveFieldsNotProvided(txParams, 'gasPrice', 'maxFeePerGas');
        ensureMutuallyExclusiveFieldsNotProvided(txParams, 'gasPrice', 'maxPriorityFeePerGas');
        ensureFieldIsString(txParams, 'gasPrice');
    }
    if (txParams.maxFeePerGas) {
        ensureProperTransactionEnvelopeTypeProvided(txParams, 'maxFeePerGas');
        ensureMutuallyExclusiveFieldsNotProvided(txParams, 'maxFeePerGas', 'gasPrice');
        ensureFieldIsString(txParams, 'maxFeePerGas');
    }
    if (txParams.maxPriorityFeePerGas) {
        ensureProperTransactionEnvelopeTypeProvided(txParams, 'maxPriorityFeePerGas');
        ensureMutuallyExclusiveFieldsNotProvided(txParams, 'maxPriorityFeePerGas', 'gasPrice');
        ensureFieldIsString(txParams, 'maxPriorityFeePerGas');
    }
}
/**
 * Ensures that the provided txParams has the proper 'type' specified for the
 * given field, if it is provided. If types do not match throws an
 * invalidParams error.
 *
 * @param txParams - The transaction parameters object
 * @param field - The current field being validated
 * @throws {ethErrors.rpc.invalidParams} Throws if type does not match the
 * expectations for provided field.
 */
function ensureProperTransactionEnvelopeTypeProvided(txParams, field) {
    switch (field) {
        case 'maxFeePerGas':
        case 'maxPriorityFeePerGas':
            if (txParams.type &&
                txParams.type !== types_1.TransactionEnvelopeType.feeMarket) {
                throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction envelope type: specified type "${txParams.type}" but including maxFeePerGas and maxPriorityFeePerGas requires type: "${types_1.TransactionEnvelopeType.feeMarket}"`);
            }
            break;
        case 'gasPrice':
        default:
            if (txParams.type &&
                txParams.type === types_1.TransactionEnvelopeType.feeMarket) {
                throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction envelope type: specified type "${txParams.type}" but included a gasPrice instead of maxFeePerGas and maxPriorityFeePerGas`);
            }
    }
}
/**
 * Given two fields, ensure that the second field is not included in txParams,
 * and if it is throw an invalidParams error.
 *
 * @param txParams - The transaction parameters object
 * @param fieldBeingValidated - The current field being validated
 * @param mutuallyExclusiveField - The field to ensure is not provided
 * @throws {ethErrors.rpc.invalidParams} Throws if mutuallyExclusiveField is
 * present in txParams.
 */
function ensureMutuallyExclusiveFieldsNotProvided(txParams, fieldBeingValidated, mutuallyExclusiveField) {
    if (typeof txParams[mutuallyExclusiveField] !== 'undefined') {
        throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction params: specified ${fieldBeingValidated} but also included ${mutuallyExclusiveField}, these cannot be mixed`);
    }
}
/**
 * Ensures that the provided value for field is a string, throws an
 * invalidParams error if field is not a string.
 *
 * @param txParams - The transaction parameters object
 * @param field - The current field being validated
 * @throws {rpcErrors.invalidParams} Throws if field is not a string
 */
function ensureFieldIsString(txParams, field) {
    if (typeof txParams[field] !== 'string') {
        throw rpc_errors_1.rpcErrors.invalidParams(`Invalid transaction params: ${field} is not a string. got: (${txParams[field]})`);
    }
}
//# sourceMappingURL=validation.js.map