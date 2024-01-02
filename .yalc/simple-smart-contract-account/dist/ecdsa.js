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
exports.signUserOperation = exports.signHash = void 0;
const abi_1 = require("@ethersproject/abi");
const bytes_1 = require("@ethersproject/bytes");
const keccak256_1 = require("@ethersproject/keccak256");
const wallet_1 = require("@ethersproject/wallet");
const utils_1 = require("@metamask/utils");
const logger_1 = require("./logger");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, "ecdsa");
function signHash(hash, privateKey) {
    log("Signing hash", hash);
    const data = (0, bytes_1.arrayify)(hash);
    const signer = new wallet_1.Wallet(privateKey);
    return signer.signMessage(data);
}
exports.signHash = signHash;
function signUserOperation(userOperation, entrypointAddress, chainId, privateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        log("Signing user operation", userOperation);
        const hash = getUserOperationHash(userOperation, entrypointAddress, chainId);
        log("Generated user operation hash", hash);
        return yield signHash(hash, privateKey);
    });
}
exports.signUserOperation = signUserOperation;
function getUserOperationHash(userOperation, entrypointAddress, chainId) {
    const chainIdDecimal = parseInt(chainId, 16);
    const hash = (0, keccak256_1.keccak256)(encodeUserOperation(userOperation));
    const data = abi_1.defaultAbiCoder.encode(["bytes32", "address", "uint256"], [hash, entrypointAddress, chainIdDecimal]);
    return (0, keccak256_1.keccak256)(data);
}
function encodeUserOperation(userOperation) {
    return abi_1.defaultAbiCoder.encode([
        "address",
        "uint256",
        "bytes32",
        "bytes32",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "bytes32",
    ], [
        userOperation.sender,
        userOperation.nonce,
        (0, keccak256_1.keccak256)(userOperation.initCode),
        (0, keccak256_1.keccak256)(userOperation.callData),
        userOperation.callGasLimit,
        userOperation.verificationGasLimit,
        userOperation.preVerificationGas,
        userOperation.maxFeePerGas,
        userOperation.maxPriorityFeePerGas,
        (0, keccak256_1.keccak256)(userOperation.paymasterAndData),
    ]);
}
//# sourceMappingURL=ecdsa.js.map