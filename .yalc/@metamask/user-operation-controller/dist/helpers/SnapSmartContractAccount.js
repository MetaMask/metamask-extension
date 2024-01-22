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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SnapSmartContractAccount_messenger;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapSmartContractAccount = void 0;
const constants_1 = require("../constants");
class SnapSmartContractAccount {
    constructor(messenger) {
        _SnapSmartContractAccount_messenger.set(this, void 0);
        __classPrivateFieldSet(this, _SnapSmartContractAccount_messenger, messenger, "f");
    }
    prepareUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: requestData, from: sender, to: requestTo, value: requestValue, } = request;
            const data = requestData !== null && requestData !== void 0 ? requestData : constants_1.EMPTY_BYTES;
            const to = requestTo !== null && requestTo !== void 0 ? requestTo : constants_1.ADDRESS_ZERO;
            const value = requestValue !== null && requestValue !== void 0 ? requestValue : constants_1.VALUE_ZERO;
            const response = yield __classPrivateFieldGet(this, _SnapSmartContractAccount_messenger, "f").call('KeyringController:prepareUserOperation', sender, [{ data, to, value }]);
            const { bundlerUrl: bundler, callData, dummyPaymasterAndData, dummySignature, gasLimits: gas, initCode, nonce, } = response;
            return {
                bundler,
                callData,
                dummyPaymasterAndData,
                dummySignature,
                gas,
                initCode,
                nonce,
                sender,
            };
        });
    }
    updateUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userOperation } = request;
            const { sender } = userOperation;
            const { paymasterAndData: responsePaymasterAndData } = yield __classPrivateFieldGet(this, _SnapSmartContractAccount_messenger, "f").call('KeyringController:patchUserOperation', sender, userOperation);
            const paymasterAndData = responsePaymasterAndData === constants_1.EMPTY_BYTES
                ? undefined
                : responsePaymasterAndData;
            return {
                paymasterAndData,
            };
        });
    }
    signUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userOperation } = request;
            const { sender } = userOperation;
            const signature = yield __classPrivateFieldGet(this, _SnapSmartContractAccount_messenger, "f").call('KeyringController:signUserOperation', sender, userOperation);
            return { signature };
        });
    }
}
exports.SnapSmartContractAccount = SnapSmartContractAccount;
_SnapSmartContractAccount_messenger = new WeakMap();
//# sourceMappingURL=SnapSmartContractAccount.js.map