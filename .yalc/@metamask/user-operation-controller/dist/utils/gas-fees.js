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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGasFees = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const eth_query_1 = __importDefault(require("@metamask/eth-query"));
const gas_fee_controller_1 = require("@metamask/gas-fee-controller");
const transaction_controller_1 = require("@metamask/transaction-controller");
const ethereumjs_util_1 = require("ethereumjs-util");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'gas-fees');
/**
 * Populates the gas fee properties for a user operation.
 * @param request - The request to update the gas fees.
 * @param request.getGasFeeEstimates - A callback to get gas fee estimates.
 * @param request.metadata - The metadata for the user operation.
 * @param request.originalRequest - The original request to add the user operation.
 * @param request.provider - A provider to query the network.
 * @param request.transaction - The transaction that created the user operation.
 */
function updateGasFees(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadata, originalRequest, transaction } = request;
        const { userOperation } = metadata;
        let suggestedGasFees;
        const getGasFeeEstimates = () => __awaiter(this, void 0, void 0, function* () {
            if (!suggestedGasFees) {
                suggestedGasFees = yield getSuggestedGasFees(request);
            }
            return suggestedGasFees;
        });
        userOperation.maxFeePerGas = yield getMaxFeePerGas(originalRequest, getGasFeeEstimates, transaction);
        userOperation.maxPriorityFeePerGas = yield getMaxPriorityFeePerGas(originalRequest, getGasFeeEstimates, userOperation, transaction);
        metadata.userFeeLevel = getUserFeeLevel(metadata, originalRequest, suggestedGasFees, transaction);
    });
}
exports.updateGasFees = updateGasFees;
/**
 * Gets the maxFeePerGas for a user operation.
 * @param originalRequest - The original request to add the user operation.
 * @param getGetFasEstimates - A callback to get gas fee estimates.
 * @param transaction - The transaction that created the user operation.
 * @returns The maxFeePerGas for the user operation.
 */
function getMaxFeePerGas(originalRequest, getGetFasEstimates, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const { maxFeePerGas, maxPriorityFeePerGas } = originalRequest;
        const { gasPrice } = transaction !== null && transaction !== void 0 ? transaction : {};
        if (!isGasFeeEmpty(maxFeePerGas)) {
            log('Using maxFeePerGas from request', maxFeePerGas);
            return maxFeePerGas;
        }
        if (isGasFeeEmpty(maxPriorityFeePerGas) && gasPrice) {
            log('Setting maxFeePerGas to transaction gasPrice', gasPrice);
            return gasPrice;
        }
        const { maxFeePerGas: suggestedMaxFeePerGas } = yield getGetFasEstimates();
        if (!suggestedMaxFeePerGas) {
            throw new Error('Failed to get gas fee estimate for maxFeePerGas');
        }
        log('Using maxFeePerGas from estimate', suggestedMaxFeePerGas);
        return suggestedMaxFeePerGas;
    });
}
/**
 * Gets the maxPriorityFeePerGas for a user operation.
 * @param originalRequest - The original request to add the user operation.
 * @param getGetFasEstimates - A callback to get gas fee estimates.
 * @param userOperation - The user operation being updated.
 * @param transaction - The transaction that created the user operation.
 * @returns The maxPriorityFeePerGas for the user operation.
 */
function getMaxPriorityFeePerGas(originalRequest, getGetFasEstimates, userOperation, transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const { maxFeePerGas, maxPriorityFeePerGas } = originalRequest;
        const { gasPrice } = transaction !== null && transaction !== void 0 ? transaction : {};
        const { maxFeePerGas: updatedMaxFeePerGas } = userOperation;
        if (!isGasFeeEmpty(maxPriorityFeePerGas)) {
            log('Using maxPriorityFeePerGas from request', maxPriorityFeePerGas);
            return maxPriorityFeePerGas;
        }
        if (isGasFeeEmpty(maxFeePerGas) && gasPrice) {
            log('Setting maxPriorityFeePerGas to transaction gasPrice', gasPrice);
            return gasPrice;
        }
        const { maxPriorityFeePerGas: suggestedMaxPriorityFeePerGas } = yield getGetFasEstimates();
        if (suggestedMaxPriorityFeePerGas) {
            log('Using maxPriorityFeePerGas from estimate', suggestedMaxPriorityFeePerGas);
            return suggestedMaxPriorityFeePerGas;
        }
        log('Setting maxPriorityFeePerGas to maxFeePerGas', updatedMaxFeePerGas);
        return updatedMaxFeePerGas;
    });
}
/**
 * Gets the userFeeLevel for a user operation.
 * @param metadata - The metadata for the user operation.
 * @param originalRequest - The original request to add the user operation.
 * @param suggestedGasFees - The suggested gas fees, if any.
 * @param transaction - The transaction that created the user operation.
 * @returns The userFeeLevel for the user operation.
 */
function getUserFeeLevel(metadata, originalRequest, suggestedGasFees, transaction) {
    const { origin } = metadata;
    const { maxFeePerGas, maxPriorityFeePerGas } = originalRequest;
    const { maxFeePerGas: suggestedMaxFeePerGas, maxPriorityFeePerGas: suggestedMaxPriorityFeePerGas, } = suggestedGasFees || {};
    if (isGasFeeEmpty(maxFeePerGas) &&
        isGasFeeEmpty(maxPriorityFeePerGas) &&
        (transaction === null || transaction === void 0 ? void 0 : transaction.gasPrice)) {
        return origin === controller_utils_1.ORIGIN_METAMASK
            ? transaction_controller_1.UserFeeLevel.CUSTOM
            : transaction_controller_1.UserFeeLevel.DAPP_SUGGESTED;
    }
    if (isGasFeeEmpty(maxFeePerGas) &&
        isGasFeeEmpty(maxPriorityFeePerGas) &&
        suggestedMaxFeePerGas &&
        suggestedMaxPriorityFeePerGas) {
        return transaction_controller_1.UserFeeLevel.MEDIUM;
    }
    if (origin === controller_utils_1.ORIGIN_METAMASK) {
        return transaction_controller_1.UserFeeLevel.CUSTOM;
    }
    return transaction_controller_1.UserFeeLevel.DAPP_SUGGESTED;
}
/**
 * Gets suggested gas fees.
 * @param request - The request to update the gas fees.
 * @param request.getGasFeeEstimates - A callback to get gas fee estimates.
 * @param request.provider - A provider to query the network.
 * @returns The suggested gas fees.
 */
function getSuggestedGasFees(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { getGasFeeEstimates, provider } = request;
        try {
            const { gasFeeEstimates, gasEstimateType } = yield getGasFeeEstimates();
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.FEE_MARKET) {
                /* istanbul ignore next */
                const { medium: { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } = {}, } = gasFeeEstimates;
                if (suggestedMaxPriorityFeePerGas && suggestedMaxFeePerGas) {
                    const values = {
                        maxFeePerGas: gweiDecimalToWeiHex(suggestedMaxFeePerGas),
                        maxPriorityFeePerGas: gweiDecimalToWeiHex(suggestedMaxPriorityFeePerGas),
                    };
                    log('Using medium values from fee market estimate', values);
                    return values;
                }
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.LEGACY) {
                const maxFeePerGas = gweiDecimalToWeiHex(gasFeeEstimates.medium);
                log('Using medium value from legacy estimate', maxFeePerGas);
                return {
                    maxFeePerGas,
                };
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
                const maxFeePerGas = gweiDecimalToWeiHex(gasFeeEstimates.gasPrice);
                log('Using gasPrice from estimate', maxFeePerGas);
                return {
                    maxFeePerGas,
                };
            }
        }
        catch (error) {
            log('Failed to get estimate', error);
        }
        const gasPriceDecimal = (yield (0, controller_utils_1.query)(new eth_query_1.default(provider), 'gasPrice'));
        if (!gasPriceDecimal) {
            return {};
        }
        const maxFeePerGas = (0, ethereumjs_util_1.addHexPrefix)(gasPriceDecimal.toString(16));
        log('Using gasPrice from network as fallback', maxFeePerGas);
        return { maxFeePerGas };
    });
}
/**
 * Converts a GWEI decimal string to a WEI hexadecimal string.
 * @param value - The GWEI decimal string to convert.
 * @returns The WEI hexadecimal string.
 */
function gweiDecimalToWeiHex(value) {
    return (0, controller_utils_1.toHex)((0, controller_utils_1.gweiDecToWEIBN)(value));
}
/**
 * Checks if a gas fee property is empty.
 * @param value - The gas fee value to check.
 * @returns Whether the gas fee property is empty.
 */
function isGasFeeEmpty(value) {
    return !value || value === constants_1.EMPTY_BYTES;
}
//# sourceMappingURL=gas-fees.js.map