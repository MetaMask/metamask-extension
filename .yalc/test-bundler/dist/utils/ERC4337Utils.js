"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHexlify = exports.deepHexlify = exports.rethrowError = exports.decodeErrorReason = exports.getUserOpHash = exports.packUserOp = exports.AddressZero = void 0;
const utils_1 = require("ethers/lib/utils");
const IEntryPoint_json_1 = require("@account-abstraction/contracts/artifacts/IEntryPoint.json");
const ethers_1 = require("ethers");
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('aa.utils');
// UserOperation is the first parameter of validateUseOp
const validateUserOpMethod = 'simulateValidation';
const UserOpType = (_a = IEntryPoint_json_1.abi.find(entry => entry.name === validateUserOpMethod)) === null || _a === void 0 ? void 0 : _a.inputs[0];
if (UserOpType == null) {
    throw new Error(`unable to find method ${validateUserOpMethod} in EP ${IEntryPoint_json_1.abi.filter(x => x.type === 'function').map(x => x.name).join(',')}`);
}
exports.AddressZero = ethers_1.ethers.constants.AddressZero;
/**
 * pack the userOperation
 * @param op
 * @param forSignature "true" if the hash is needed to calculate the getUserOpHash()
 *  "false" to pack entire UserOp, for calculating the calldata cost of putting it on-chain.
 */
function packUserOp(op, forSignature = true) {
    if (forSignature) {
        return utils_1.defaultAbiCoder.encode(['address', 'uint256', 'bytes32', 'bytes32',
            'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
            'bytes32'], [op.sender, op.nonce, (0, utils_1.keccak256)(op.initCode), (0, utils_1.keccak256)(op.callData),
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            (0, utils_1.keccak256)(op.paymasterAndData)]);
    }
    else {
        // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
        return utils_1.defaultAbiCoder.encode(['address', 'uint256', 'bytes', 'bytes',
            'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
            'bytes', 'bytes'], [op.sender, op.nonce, op.initCode, op.callData,
            op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
            op.paymasterAndData, op.signature]);
    }
}
exports.packUserOp = packUserOp;
/**
 * calculate the userOpHash of a given userOperation.
 * The userOpHash is a hash of all UserOperation fields, except the "signature" field.
 * The entryPoint uses this value in the emitted UserOperationEvent.
 * A wallet may use this value as the hash to sign (the SampleWallet uses this method)
 * @param op
 * @param entryPoint
 * @param chainId
 */
function getUserOpHash(op, entryPoint, chainId) {
    const userOpHash = (0, utils_1.keccak256)(packUserOp(op, true));
    const enc = utils_1.defaultAbiCoder.encode(['bytes32', 'address', 'uint256'], [userOpHash, entryPoint, chainId]);
    return (0, utils_1.keccak256)(enc);
}
exports.getUserOpHash = getUserOpHash;
const ErrorSig = (0, utils_1.keccak256)(Buffer.from('Error(string)')).slice(0, 10); // 0x08c379a0
const FailedOpSig = (0, utils_1.keccak256)(Buffer.from('FailedOp(uint256,string)')).slice(0, 10); // 0x220266b6
/**
 * decode bytes thrown by revert as Error(message) or FailedOp(opIndex,paymaster,message)
 */
function decodeErrorReason(error) {
    debug('decoding', error);
    if (error.startsWith(ErrorSig)) {
        const [message] = utils_1.defaultAbiCoder.decode(['string'], '0x' + error.substring(10));
        return { message };
    }
    else if (error.startsWith(FailedOpSig)) {
        let [opIndex, message] = utils_1.defaultAbiCoder.decode(['uint256', 'string'], '0x' + error.substring(10));
        message = `FailedOp: ${message}`;
        return {
            message,
            opIndex
        };
    }
}
exports.decodeErrorReason = decodeErrorReason;
/**
 * update thrown Error object with our custom FailedOp message, and re-throw it.
 * updated both "message" and inner encoded "data"
 * tested on geth, hardhat-node
 * usage: entryPoint.handleOps().catch(decodeError)
 */
function rethrowError(e) {
    let error = e;
    let parent = e;
    if ((error === null || error === void 0 ? void 0 : error.error) != null) {
        error = error.error;
    }
    while ((error === null || error === void 0 ? void 0 : error.data) != null) {
        parent = error;
        error = error.data;
    }
    const decoded = typeof error === 'string' && error.length > 2 ? decodeErrorReason(error) : undefined;
    if (decoded != null) {
        e.message = decoded.message;
        if (decoded.opIndex != null) {
            // helper for chai: convert our FailedOp error into "Error(msg)"
            const errorWithMsg = (0, utils_1.hexConcat)([ErrorSig, utils_1.defaultAbiCoder.encode(['string'], [decoded.message])]);
            // modify in-place the error object:
            parent.data = errorWithMsg;
        }
    }
    throw e;
}
exports.rethrowError = rethrowError;
/**
 * hexlify all members of object, recursively
 * @param obj
 */
function deepHexlify(obj) {
    if (typeof obj === 'function') {
        return undefined;
    }
    if (obj == null || typeof obj === 'string' || typeof obj === 'boolean') {
        return obj;
    }
    else if (obj._isBigNumber != null || typeof obj !== 'object') {
        return (0, utils_1.hexlify)(obj).replace(/^0x0/, '0x');
    }
    if (Array.isArray(obj)) {
        return obj.map(member => deepHexlify(member));
    }
    return Object.keys(obj)
        .reduce((set, key) => (Object.assign(Object.assign({}, set), { [key]: deepHexlify(obj[key]) })), {});
}
exports.deepHexlify = deepHexlify;
// resolve all property and hexlify.
// (UserOpMethodHandler receives data from the network, so we need to pack our generated values)
async function resolveHexlify(a) {
    return deepHexlify(await (0, utils_1.resolveProperties)(a));
}
exports.resolveHexlify = resolveHexlify;
//# sourceMappingURL=ERC4337Utils.js.map