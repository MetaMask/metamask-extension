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
exports.getDummyPaymasterAndData = exports.getPaymasterAndData = void 0;
const abi_1 = require("@ethersproject/abi");
const contracts_1 = require("@ethersproject/contracts");
const ethereumjs_util_1 = require("ethereumjs-util");
const logger_1 = require("./logger");
const VerifyingPaymaster_json_1 = __importDefault(require("./abi/VerifyingPaymaster.json"));
const constants_1 = require("./constants");
const ecdsa_1 = require("./ecdsa");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, "verifying-paymaster");
function getPaymasterAndData(paymasterAddress, validUntil, validAfter, userOperation, privateKey, provider, entrypoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifyingPaymasterContract = new contracts_1.Contract(paymasterAddress, VerifyingPaymaster_json_1.default, provider);
        const hash = yield verifyingPaymasterContract.getHash(userOperation, validUntil, validAfter);
        log("Retrieved user operation hash from paymaster", hash);
        const signature = yield (0, ecdsa_1.signHash)(hash, privateKey);
        log("Generated user operation signature", signature);
        const data = paymasterAddress +
            (0, ethereumjs_util_1.stripHexPrefix)(abi_1.defaultAbiCoder.encode(["uint48", "uint48"], [validUntil, validAfter])) +
            (0, ethereumjs_util_1.stripHexPrefix)(signature);
        log("Generated paymaster data", data);
        const isValid = yield verifyPaymasterData(userOperation, data, verifyingPaymasterContract, entrypoint);
        if (!isValid) {
            throw new Error("Validation of paymaster data failed");
        }
        return data;
    });
}
exports.getPaymasterAndData = getPaymasterAndData;
function getDummyPaymasterAndData(paymasterAddress) {
    if (!paymasterAddress) {
        return undefined;
    }
    const encodedValidUntilAfter = (0, ethereumjs_util_1.stripHexPrefix)(abi_1.defaultAbiCoder.encode(["uint48", "uint48"], [0, 0]));
    return `${paymasterAddress}${encodedValidUntilAfter}${(0, ethereumjs_util_1.stripHexPrefix)(constants_1.DUMMY_SIGNATURE)}`;
}
exports.getDummyPaymasterAndData = getDummyPaymasterAndData;
function verifyPaymasterData(userOperation, paymasterAndData, paymasterContract, entrypoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const testUserOperation = Object.assign(Object.assign({}, userOperation), { paymasterAndData });
        const result = yield paymasterContract.callStatic.validatePaymasterUserOp(testUserOperation, "0x".padEnd(66, "0"), 1, { from: entrypoint });
        const packedResult = result[1].toHexString();
        const failed = packedResult.endsWith("1");
        log("Validated paymaster data with contract", {
            packedResult,
            valid: !failed,
        });
        return !failed;
    });
}
//# sourceMappingURL=VerifyingPaymaster.js.map