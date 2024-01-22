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
const utils_1 = require("@metamask/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const logger_1 = require("../logger");
const types_1 = require("../types");
const swaps_1 = require("./swaps");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'gas-fees');
function updateGasFees(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { txMeta } = request;
        const initialParams = Object.assign({}, txMeta.txParams);
        const isSwap = swaps_1.SWAP_TRANSACTION_TYPES.includes(txMeta.type);
        const savedGasFees = isSwap ? undefined : request.getSavedGasFees();
        const suggestedGasFees = yield getSuggestedGasFees(request);
        log('Suggested gas fees', suggestedGasFees);
        const getGasFeeRequest = Object.assign(Object.assign({}, request), { savedGasFees,
            initialParams,
            suggestedGasFees });
        txMeta.txParams.maxFeePerGas = getMaxFeePerGas(getGasFeeRequest);
        txMeta.txParams.maxPriorityFeePerGas =
            getMaxPriorityFeePerGas(getGasFeeRequest);
        txMeta.txParams.gasPrice = getGasPrice(getGasFeeRequest);
        txMeta.userFeeLevel = getUserFeeLevel(getGasFeeRequest);
        log('Updated gas fee properties', {
            maxFeePerGas: txMeta.txParams.maxFeePerGas,
            maxPriorityFeePerGas: txMeta.txParams.maxPriorityFeePerGas,
            gasPrice: txMeta.txParams.gasPrice,
        });
        if (txMeta.txParams.maxFeePerGas || txMeta.txParams.maxPriorityFeePerGas) {
            delete txMeta.txParams.gasPrice;
        }
        if (txMeta.txParams.gasPrice) {
            delete txMeta.txParams.maxFeePerGas;
            delete txMeta.txParams.maxPriorityFeePerGas;
        }
        updateDefaultGasEstimates(txMeta);
    });
}
exports.updateGasFees = updateGasFees;
function getMaxFeePerGas(request) {
    const { savedGasFees, eip1559, initialParams, suggestedGasFees } = request;
    if (!eip1559) {
        return undefined;
    }
    if (savedGasFees) {
        const maxFeePerGas = gweiDecimalToWeiHex(savedGasFees.maxBaseFee);
        log('Using maxFeePerGas from savedGasFees', maxFeePerGas);
        return maxFeePerGas;
    }
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
    if (suggestedGasFees.gasPrice) {
        log('Setting maxFeePerGas to suggested gasPrice', suggestedGasFees.gasPrice);
        return suggestedGasFees.gasPrice;
    }
    log('maxFeePerGas not set');
    return undefined;
}
function getMaxPriorityFeePerGas(request) {
    const { eip1559, initialParams, savedGasFees, suggestedGasFees, txMeta } = request;
    if (!eip1559) {
        return undefined;
    }
    if (savedGasFees) {
        const maxPriorityFeePerGas = gweiDecimalToWeiHex(savedGasFees.priorityFee);
        log('Using maxPriorityFeePerGas from savedGasFees.priorityFee', maxPriorityFeePerGas);
        return maxPriorityFeePerGas;
    }
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
    if (txMeta.txParams.maxFeePerGas) {
        log('Setting maxPriorityFeePerGas to maxFeePerGas', txMeta.txParams.maxFeePerGas);
        return txMeta.txParams.maxFeePerGas;
    }
    log('maxPriorityFeePerGas not set');
    return undefined;
}
function getGasPrice(request) {
    const { eip1559, initialParams, suggestedGasFees } = request;
    if (eip1559) {
        return undefined;
    }
    if (initialParams.gasPrice) {
        log('Using gasPrice from request', initialParams.gasPrice);
        return initialParams.gasPrice;
    }
    if (suggestedGasFees.gasPrice) {
        log('Using suggested gasPrice', suggestedGasFees.gasPrice);
        return suggestedGasFees.gasPrice;
    }
    log('gasPrice not set');
    return undefined;
}
function getUserFeeLevel(request) {
    const { eip1559, initialParams, savedGasFees, suggestedGasFees, txMeta } = request;
    if (!eip1559) {
        return undefined;
    }
    if (savedGasFees) {
        return types_1.UserFeeLevel.CUSTOM;
    }
    if (!initialParams.maxFeePerGas &&
        !initialParams.maxPriorityFeePerGas &&
        initialParams.gasPrice) {
        return txMeta.origin === controller_utils_1.ORIGIN_METAMASK
            ? types_1.UserFeeLevel.CUSTOM
            : types_1.UserFeeLevel.DAPP_SUGGESTED;
    }
    if (!initialParams.maxFeePerGas &&
        !initialParams.maxPriorityFeePerGas &&
        suggestedGasFees.maxFeePerGas &&
        suggestedGasFees.maxPriorityFeePerGas) {
        return types_1.UserFeeLevel.MEDIUM;
    }
    if (txMeta.origin === controller_utils_1.ORIGIN_METAMASK) {
        return types_1.UserFeeLevel.MEDIUM;
    }
    return types_1.UserFeeLevel.DAPP_SUGGESTED;
}
function updateDefaultGasEstimates(txMeta) {
    if (!txMeta.defaultGasEstimates) {
        txMeta.defaultGasEstimates = {};
    }
    txMeta.defaultGasEstimates.maxFeePerGas = txMeta.txParams.maxFeePerGas;
    txMeta.defaultGasEstimates.maxPriorityFeePerGas =
        txMeta.txParams.maxPriorityFeePerGas;
    txMeta.defaultGasEstimates.gasPrice = txMeta.txParams.gasPrice;
    txMeta.defaultGasEstimates.estimateType = txMeta.userFeeLevel;
}
function getSuggestedGasFees(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { eip1559, ethQuery, getGasFeeEstimates, txMeta } = request;
        if ((!eip1559 && txMeta.txParams.gasPrice) ||
            (eip1559 &&
                txMeta.txParams.maxFeePerGas &&
                txMeta.txParams.maxPriorityFeePerGas)) {
            return {};
        }
        try {
            const { gasFeeEstimates, gasEstimateType } = yield getGasFeeEstimates();
            if (eip1559 && gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.FEE_MARKET) {
                const { medium: { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } = {}, } = gasFeeEstimates;
                if (suggestedMaxPriorityFeePerGas && suggestedMaxFeePerGas) {
                    return {
                        maxFeePerGas: gweiDecimalToWeiHex(suggestedMaxFeePerGas),
                        maxPriorityFeePerGas: gweiDecimalToWeiHex(suggestedMaxPriorityFeePerGas),
                    };
                }
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.LEGACY) {
                // The LEGACY type includes low, medium and high estimates of
                // gas price values.
                return {
                    gasPrice: gweiDecimalToWeiHex(gasFeeEstimates.medium),
                };
            }
            if (gasEstimateType === gas_fee_controller_1.GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
                // The ETH_GASPRICE type just includes a single gas price property,
                // which we can assume was retrieved from eth_gasPrice
                return {
                    gasPrice: gweiDecimalToWeiHex(gasFeeEstimates.gasPrice),
                };
            }
        }
        catch (error) {
            log('Failed to get suggested gas fees', error);
        }
        const gasPriceDecimal = (yield (0, controller_utils_1.query)(ethQuery, 'gasPrice'));
        const gasPrice = gasPriceDecimal
            ? (0, ethereumjs_util_1.addHexPrefix)(gasPriceDecimal.toString(16))
            : undefined;
        return { gasPrice };
    });
}
function gweiDecimalToWeiHex(value) {
    return (0, controller_utils_1.toHex)((0, controller_utils_1.gweiDecToWEIBN)(value));
}
//# sourceMappingURL=gas-fees.js.map