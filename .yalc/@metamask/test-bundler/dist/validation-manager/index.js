"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRulesViolations = exports.supportsDebugTraceCall = void 0;
const BundlerCollectorTracer_1 = require("./BundlerCollectorTracer");
const GethTracer_1 = require("./GethTracer");
const ValidationManager_1 = require("./ValidationManager");
const contract_types_1 = require("../contract-types");
const utils_1 = require("../utils");
__exportStar(require("./ValidationManager"), exports);
/**
 *
 * @param provider
 */
async function supportsDebugTraceCall(provider) {
    const p = provider.send;
    if (p._clientVersion == null) {
        p._clientVersion = await provider.send('web3_clientVersion', []);
    }
    // make sure we can trace a call.
    const ret = await (0, GethTracer_1.debug_traceCall)(provider, { from: utils_1.AddressZero, to: utils_1.AddressZero, data: '0x' }, { tracer: BundlerCollectorTracer_1.bundlerCollectorTracer }).catch((e) => e);
    return ret.logs != null;
}
exports.supportsDebugTraceCall = supportsDebugTraceCall;
/**
 *
 * @param provider
 * @param userOperation
 * @param entryPointAddress
 */
async function checkRulesViolations(provider, userOperation, entryPointAddress) {
    const supportsTrace = await supportsDebugTraceCall(provider);
    if (!supportsTrace) {
        throw new Error('This provider does not support stack tracing');
    }
    const entryPoint = contract_types_1.IEntryPoint__factory.connect(entryPointAddress, provider);
    const validationManager = new ValidationManager_1.ValidationManager(entryPoint, false);
    return await validationManager.validateUserOp(userOperation);
}
exports.checkRulesViolations = checkRulesViolations;
//# sourceMappingURL=index.js.map