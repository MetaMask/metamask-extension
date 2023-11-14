"use strict";
// Temporary until new keyring is available via KeyringController.
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
exports.signUserOperation = void 0;
const bytes_1 = require("@ethersproject/bytes");
const wallet_1 = require("@ethersproject/wallet");
const keccak256_1 = require("@ethersproject/keccak256");
const abi_1 = require("@ethersproject/abi");
function signUserOperation(userOperation, entrypointAddress, chainId, privateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = getUserOperationHash(userOperation, entrypointAddress, chainId);
        const message = (0, bytes_1.arrayify)(hash);
        const signer = new wallet_1.Wallet(privateKey);
        return yield signer.signMessage(message);
    });
}
exports.signUserOperation = signUserOperation;
function getUserOperationHash(userOperation, entrypointAddress, chainId) {
    const chainIdDecimal = parseInt(chainId, 16);
    const hash = (0, keccak256_1.keccak256)(encodeUserOperationForSigning(userOperation));
    const data = abi_1.defaultAbiCoder.encode(['bytes32', 'address', 'uint256'], [hash, entrypointAddress, chainIdDecimal]);
    return (0, keccak256_1.keccak256)(data);
}
function encodeUserOperationForSigning(userOperation) {
    return abi_1.defaultAbiCoder.encode([
        'address',
        'uint256',
        'bytes32',
        'bytes32',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'uint256',
        'bytes32',
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
//# sourceMappingURL=signature.js.map