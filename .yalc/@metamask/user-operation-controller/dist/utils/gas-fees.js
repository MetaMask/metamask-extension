"use strict";
/* eslint-disable jsdoc/require-jsdoc */
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
exports.updateGasFees = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const gas_fee_controller_1 = require("@metamask/gas-fee-controller");
const transaction_controller_1 = require("@metamask/transaction-controller");
const utils_1 = require("@metamask/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const logger_1 = require("../logger");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'gas-fees');
function updateGasFees(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadata } = request;
        const initialParams = Object.assign({}, metadata.transactionParams);
        const suggestedGasFees = yield getSuggestedGasFees(request);
        log('Suggested gas fees', suggestedGasFees);
        const getGasFeeRequest = Object.assign(Object.assign({}, request), { initialParams,
            suggestedGasFees });
        metadata.userOperation.maxFeePerGas = getMaxFeePerGas(getGasFeeRequest);
        metadata.userOperation.maxPriorityFeePerGas =
            getMaxPriorityFeePerGas(getGasFeeRequest);
        metadata.userFeeLevel = getUserFeeLevel(getGasFeeRequest) || null;
        log('Updated gas fee properties', {
            maxFeePerGas: metadata.userOperation.maxFeePerGas,
            maxPriorityFeePerGas: metadata.userOperation.maxPriorityFeePerGas,
            userFeeLevel: metadata.userFeeLevel,
        });
    });
}
exports.updateGasFees = updateGasFees;
function getMaxFeePerGas(request) {
    const { initialParams, suggestedGasFees } = request;
    if (initialParams.maxFeePerGas) {
        log('Using maxFeePerGas from request', initialParams.maxFeePerGas);
        return initialParams.maxFeePerGas;
    }
    if (initialParams.gasPrice && !initialParams.maxPriorityFeePerGas) {
        log('Setting maxFeePerGas to gasPrice from request', initialParams.gasPrice);
        return initialParams.gasPrice;
    }
    if (suggestedGasFees.maxFeePerGas) {
        log('Using suggested maxFeePerGas', suggestedGasFees.maxFeePerGas);
        return suggestedGasFees.maxFeePerGas;
    }
    throw new Error('Cannot set maxFeePerGas');
}
function getMaxPriorityFeePerGas(request) {
    const { initialParams, suggestedGasFees, metadata } = request;
    if (initialParams.maxPriorityFeePerGas) {
        log('Using maxPriorityFeePerGas from request', initialParams.maxPriorityFeePerGas);
        return initialParams.maxPriorityFeePerGas;
    }
    if (initialParams.gasPrice && !initialParams.maxFeePerGas) {
        log('Setting maxPriorityFeePerGas to gasPrice from request', initialParams.gasPrice);
        return initialParams.gasPrice;
    }
    if (suggestedGasFees.maxPriorityFeePerGas) {
        log('Using suggested maxPriorityFeePerGas', suggestedGasFees.maxPriorityFeePerGas);
        return suggestedGasFees.maxPriorityFeePerGas;
    }
    if (metadata.userOperation.maxFeePerGas) {
        log('Setting maxPriorityFeePerGas to maxFeePerGas', metadata.userOperation.maxFeePerGas);
        return metadata.userOperation.maxFeePerGas;
    }
    throw new Error('Cannot set maxPriorityFeePerGas');
}
function getUserFeeLevel(request) {
    const { initialParams, suggestedGasFees } = request;
    if (!initialParams.maxFeePerGas &&
        !initialParams.maxPriorityFeePerGas &&
        initialParams.gasPrice) {
        return transaction_controller_1.UserFeeLevel.DAPP_SUGGESTED;
    }
    if (!initialParams.maxFeePerGas &&
        !initialParams.maxPriorityFeePerGas &&
        suggestedGasFees.maxFeePerGas &&
        suggestedGasFees.maxPriorityFeePerGas) {
        return transaction_controller_1.UserFeeLevel.MEDIUM;
    }
    return transaction_controller_1.UserFeeLevel.DAPP_SUGGESTED;
}
function getSuggestedGasFees(request) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const { getGasFeeEstimates, metadata } = request;
        if (((_a = metadata.transactionParams) === null || _a === void 0 ? void 0 : _a.maxFeePerGas) &&
            ((_b = metadata.transactionParams) === null || _b === void 0 ? void 0 : _b.maxPriorityFeePerGas)) {
            return {};
        }
        try {
            const { gasFeeEstimates, gasEstimateType } = yield getGasFeeEstimates();
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.FEE_MARKET) {
                const { medium: { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } = {}, } = gasFeeEstimates;
                if (suggestedMaxPriorityFeePerGas && suggestedMaxFeePerGas) {
                    return {
                        maxFeePerGas: gweiDecimalToWeiHex(suggestedMaxFeePerGas),
                        maxPriorityFeePerGas: gweiDecimalToWeiHex(suggestedMaxPriorityFeePerGas),
                    };
                }
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.LEGACY) {
                const maxFeePerGas = gweiDecimalToWeiHex(gasFeeEstimates.medium);
                return {
                    maxFeePerGas,
                    maxPriorityFeePerGas: maxFeePerGas,
                };
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
                const maxFeePerGas = gweiDecimalToWeiHex(gasFeeEstimates.gasPrice);
                return {
                    maxFeePerGas,
                    maxPriorityFeePerGas: maxFeePerGas,
                };
            }
        }
        catch (error) {
            log('Failed to get suggested gas fees', error);
        }
        const gasPriceDecimal = yield request.provider.getGasPrice();
        const maxFeePerGas = gasPriceDecimal
            ? (0, ethereumjs_util_1.addHexPrefix)(gasPriceDecimal.toHexString())
            : undefined;
        return { maxFeePerGas, maxPriorityFeePerGas: maxFeePerGas };
    });
}
function gweiDecimalToWeiHex(value) {
    return (0, controller_utils_1.toHex)((0, controller_utils_1.gweiDecToWEIBN)(value));
}
//# sourceMappingURL=gas-fees.js.map