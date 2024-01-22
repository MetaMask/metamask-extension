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
exports.addGasBuffer = exports.estimateGas = exports.updateGas = exports.DEFAULT_GAS_MULTIPLIER = exports.FIXED_GAS = exports.log = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const utils_1 = require("@metamask/utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
exports.log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'gas');
exports.FIXED_GAS = '0x5208';
exports.DEFAULT_GAS_MULTIPLIER = 1.5;
function updateGas(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const { txMeta } = request;
        const initialParams = Object.assign({}, txMeta.txParams);
        const [gas, simulationFails] = yield getGas(request);
        txMeta.txParams.gas = gas;
        txMeta.simulationFails = simulationFails;
        if (!initialParams.gas) {
            txMeta.originalGasEstimate = txMeta.txParams.gas;
        }
        if (!txMeta.defaultGasEstimates) {
            txMeta.defaultGasEstimates = {};
        }
        txMeta.defaultGasEstimates.gas = txMeta.txParams.gas;
    });
}
exports.updateGas = updateGas;
function estimateGas(txParams, ethQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = Object.assign({}, txParams);
        const { data, value } = request;
        const { gasLimit: gasLimitHex, number: blockNumber } = yield getLatestBlock(ethQuery);
        const gasLimitBN = (0, controller_utils_1.hexToBN)(gasLimitHex);
        request.data = data ? (0, ethereumjs_util_1.addHexPrefix)(data) : data;
        request.gas = (0, controller_utils_1.BNToHex)((0, controller_utils_1.fractionBN)(gasLimitBN, 19, 20));
        request.value = value || '0x0';
        let estimatedGas = request.gas;
        let simulationFails;
        try {
            estimatedGas = yield (0, controller_utils_1.query)(ethQuery, 'estimateGas', [request]);
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            simulationFails = {
                reason: error.message,
                errorKey: error.errorKey,
                debug: {
                    blockNumber,
                    blockGasLimit: gasLimitHex,
                },
            };
            (0, exports.log)('Estimation failed', Object.assign(Object.assign({}, simulationFails), { fallback: estimateGas }));
        }
        return {
            blockGasLimit: gasLimitHex,
            estimatedGas,
            simulationFails,
        };
    });
}
exports.estimateGas = estimateGas;
function addGasBuffer(estimatedGas, blockGasLimit, multiplier) {
    const estimatedGasBN = (0, controller_utils_1.hexToBN)(estimatedGas);
    const maxGasBN = (0, controller_utils_1.hexToBN)(blockGasLimit).muln(0.9);
    const paddedGasBN = estimatedGasBN.muln(multiplier);
    if (estimatedGasBN.gt(maxGasBN)) {
        const estimatedGasHex = (0, ethereumjs_util_1.addHexPrefix)(estimatedGas);
        (0, exports.log)('Using estimated value', estimatedGasHex);
        return estimatedGasHex;
    }
    if (paddedGasBN.lt(maxGasBN)) {
        const paddedHex = (0, ethereumjs_util_1.addHexPrefix)((0, controller_utils_1.BNToHex)(paddedGasBN));
        (0, exports.log)('Using padded estimate', paddedHex, multiplier);
        return paddedHex;
    }
    const maxHex = (0, ethereumjs_util_1.addHexPrefix)((0, controller_utils_1.BNToHex)(maxGasBN));
    (0, exports.log)('Using 90% of block gas limit', maxHex);
    return maxHex;
}
exports.addGasBuffer = addGasBuffer;
function getGas(request) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { providerConfig, txMeta } = request;
        if (txMeta.txParams.gas) {
            (0, exports.log)('Using value from request', txMeta.txParams.gas);
            return [txMeta.txParams.gas];
        }
        if (yield requiresFixedGas(request)) {
            (0, exports.log)('Using fixed value', exports.FIXED_GAS);
            return [exports.FIXED_GAS];
        }
        const { blockGasLimit, estimatedGas, simulationFails } = yield estimateGas(txMeta.txParams, request.ethQuery);
        if (providerConfig.type === controller_utils_1.NetworkType.rpc) {
            (0, exports.log)('Using original estimate as custom network');
            return [estimatedGas, simulationFails];
        }
        const bufferMultiplier = (_a = constants_1.GAS_BUFFER_CHAIN_OVERRIDES[providerConfig.chainId]) !== null && _a !== void 0 ? _a : exports.DEFAULT_GAS_MULTIPLIER;
        const bufferedGas = addGasBuffer(estimatedGas, blockGasLimit, bufferMultiplier);
        return [bufferedGas, simulationFails];
    });
}
function requiresFixedGas({ ethQuery, txMeta, providerConfig, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const isCustomNetwork = providerConfig.type === controller_utils_1.NetworkType.rpc;
        const { txParams: { to, data }, } = txMeta;
        if (isCustomNetwork || !to || data) {
            return false;
        }
        const code = yield getCode(ethQuery, to);
        return !code || code === '0x';
    });
}
function getCode(ethQuery, address) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, controller_utils_1.query)(ethQuery, 'getCode', [address]);
    });
}
function getLatestBlock(ethQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, controller_utils_1.query)(ethQuery, 'getBlockByNumber', ['latest', false]);
    });
}
//# sourceMappingURL=gas.js.map