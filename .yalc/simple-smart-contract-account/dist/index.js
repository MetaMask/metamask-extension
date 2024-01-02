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
var _SimpleSmartContractAccount_bundler, _SimpleSmartContractAccount_entrypoint, _SimpleSmartContractAccount_owner, _SimpleSmartContractAccount_paymasterAddress, _SimpleSmartContractAccount_privateKey, _SimpleSmartContractAccount_provider, _SimpleSmartContractAccount_salt, _SimpleSmartContractAccount_simpleAccountFactory;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSmartContractAccount = void 0;
const providers_1 = require("@ethersproject/providers");
const utils_1 = require("@metamask/utils");
const logger_1 = require("./logger");
const ecdsa_1 = require("./ecdsa");
const SimpleAccount_1 = require("./SimpleAccount");
const VerifyingPaymaster_1 = require("./VerifyingPaymaster");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, "simple-account-snap");
class SimpleSmartContractAccount {
    constructor({ bundler, entrypoint, owner, paymasterAddress, privateKey, provider, salt, simpleAccountFactory, }) {
        _SimpleSmartContractAccount_bundler.set(this, void 0);
        _SimpleSmartContractAccount_entrypoint.set(this, void 0);
        _SimpleSmartContractAccount_owner.set(this, void 0);
        _SimpleSmartContractAccount_paymasterAddress.set(this, void 0);
        _SimpleSmartContractAccount_privateKey.set(this, void 0);
        _SimpleSmartContractAccount_provider.set(this, void 0);
        _SimpleSmartContractAccount_salt.set(this, void 0);
        _SimpleSmartContractAccount_simpleAccountFactory.set(this, void 0);
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_bundler, bundler, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_entrypoint, entrypoint, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_owner, owner, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_paymasterAddress, paymasterAddress, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_privateKey, privateKey, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_provider, new providers_1.Web3Provider(provider), "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_salt, salt, "f");
        __classPrivateFieldSet(this, _SimpleSmartContractAccount_simpleAccountFactory, simpleAccountFactory, "f");
    }
    prepareUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Received user operation request");
            const { data, to, value } = request;
            const potentialInitCode = (0, SimpleAccount_1.getInitCode)(__classPrivateFieldGet(this, _SimpleSmartContractAccount_owner, "f"), __classPrivateFieldGet(this, _SimpleSmartContractAccount_salt, "f"), __classPrivateFieldGet(this, _SimpleSmartContractAccount_simpleAccountFactory, "f"));
            const sender = yield (0, SimpleAccount_1.getSender)(potentialInitCode, __classPrivateFieldGet(this, _SimpleSmartContractAccount_provider, "f"), __classPrivateFieldGet(this, _SimpleSmartContractAccount_entrypoint, "f"));
            const callData = (0, SimpleAccount_1.getCallData)(to, value, data);
            const code = yield __classPrivateFieldGet(this, _SimpleSmartContractAccount_provider, "f").getCode(sender);
            const isDeployed = Boolean(code) && code !== "0x";
            const initCode = isDeployed ? undefined : potentialInitCode;
            const nonce = yield (0, SimpleAccount_1.getNonce)(sender, isDeployed, __classPrivateFieldGet(this, _SimpleSmartContractAccount_provider, "f"));
            const bundler = __classPrivateFieldGet(this, _SimpleSmartContractAccount_bundler, "f");
            const dummySignature = (0, SimpleAccount_1.getDummySignature)();
            const dummyPaymasterAndData = (0, VerifyingPaymaster_1.getDummyPaymasterAndData)(__classPrivateFieldGet(this, _SimpleSmartContractAccount_paymasterAddress, "f"));
            return {
                bundler,
                callData,
                dummyPaymasterAndData,
                dummySignature,
                initCode,
                sender,
                nonce,
            };
        });
    }
    updateUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Received paymaster request", {
                paymasterAddress: __classPrivateFieldGet(this, _SimpleSmartContractAccount_paymasterAddress, "f"),
            });
            const { userOperation } = request;
            const paymasterAddress = __classPrivateFieldGet(this, _SimpleSmartContractAccount_paymasterAddress, "f");
            const paymasterAndData = paymasterAddress
                ? yield (0, VerifyingPaymaster_1.getPaymasterAndData)(paymasterAddress, 0, 0, userOperation, __classPrivateFieldGet(this, _SimpleSmartContractAccount_privateKey, "f"), __classPrivateFieldGet(this, _SimpleSmartContractAccount_provider, "f"), __classPrivateFieldGet(this, _SimpleSmartContractAccount_entrypoint, "f"))
                : undefined;
            if (!paymasterAddress) {
                log("Skipping paymaster");
            }
            return { paymasterAndData };
        });
    }
    signUserOperation(request) {
        return __awaiter(this, void 0, void 0, function* () {
            log("Received user operation signature request");
            const { chainId, userOperation } = request;
            const signature = yield (0, ecdsa_1.signUserOperation)(userOperation, __classPrivateFieldGet(this, _SimpleSmartContractAccount_entrypoint, "f"), chainId, __classPrivateFieldGet(this, _SimpleSmartContractAccount_privateKey, "f"));
            return {
                signature,
            };
        });
    }
}
exports.SimpleSmartContractAccount = SimpleSmartContractAccount;
_SimpleSmartContractAccount_bundler = new WeakMap(), _SimpleSmartContractAccount_entrypoint = new WeakMap(), _SimpleSmartContractAccount_owner = new WeakMap(), _SimpleSmartContractAccount_paymasterAddress = new WeakMap(), _SimpleSmartContractAccount_privateKey = new WeakMap(), _SimpleSmartContractAccount_provider = new WeakMap(), _SimpleSmartContractAccount_salt = new WeakMap(), _SimpleSmartContractAccount_simpleAccountFactory = new WeakMap();
//# sourceMappingURL=index.js.map