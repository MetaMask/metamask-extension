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
exports.updateGas = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const constants_1 = require("../constants");
const Bundler_1 = require("../helpers/Bundler");
const logger_1 = require("../logger");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'gas');
/**
 * A multiplier to apply to all gas estimate values returned from the bundler.
 */
const GAS_ESTIMATE_MULTIPLIER = 1.5;
/**
 * Populates the gas properties for a user operation.
 * @param metadata - The metadata for the user operation.
 * @param prepareResponse - The prepare response from the smart contract account.
 * @param entrypoint - Address of the entrypoint contract.
 */
function updateGas(metadata, prepareResponse, entrypoint) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { userOperation } = metadata;
        if (prepareResponse.gas) {
            userOperation.callGasLimit = prepareResponse.gas.callGasLimit;
            userOperation.preVerificationGas = prepareResponse.gas.preVerificationGas;
            userOperation.verificationGasLimit =
                prepareResponse.gas.verificationGasLimit;
            log('Using gas values from smart contract account', {
                callGasLimit: userOperation.callGasLimit,
                preVerificationGas: userOperation.preVerificationGas,
                verificationGasLimit: userOperation.verificationGasLimit,
            });
            return;
        }
        const payload = Object.assign(Object.assign({}, userOperation), { maxFeePerGas: constants_1.VALUE_ZERO, maxPriorityFeePerGas: constants_1.VALUE_ZERO, callGasLimit: constants_1.VALUE_ZERO, preVerificationGas: constants_1.VALUE_ZERO, verificationGasLimit: '0xF4240' });
        const bundler = new Bundler_1.Bundler(metadata.bundlerUrl);
        const estimate = yield bundler.estimateUserOperationGas(payload, entrypoint);
        userOperation.callGasLimit = normalizeGasEstimate(estimate.callGasLimit);
        userOperation.preVerificationGas = normalizeGasEstimate(estimate.preVerificationGas);
        userOperation.verificationGasLimit = normalizeGasEstimate(((_a = estimate.verificationGasLimit) !== null && _a !== void 0 ? _a : estimate.verificationGas));
        log('Using buffered gas values from bundler estimate', {
            callGasLimit: userOperation.callGasLimit,
            preVerificationGas: userOperation.preVerificationGas,
            verificationGasLimit: userOperation.verificationGasLimit,
            multiplier: GAS_ESTIMATE_MULTIPLIER,
            estimate,
        });
    });
}
exports.updateGas = updateGas;
/**
 * Normalizes a gas estimate value from the bundler.
 * @param rawValue - The raw value to normalize.
 * @returns The normalized value as a hexadecimal string.
 */
function normalizeGasEstimate(rawValue) {
    const value = typeof rawValue === 'string' ? (0, controller_utils_1.hexToBN)(rawValue) : new ethereumjs_util_1.BN(rawValue);
    const bufferedValue = value.muln(GAS_ESTIMATE_MULTIPLIER);
    return (0, ethereumjs_util_1.addHexPrefix)(bufferedValue.toString(16));
}
//# sourceMappingURL=gas.js.map