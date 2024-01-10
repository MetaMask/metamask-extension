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
exports.getDummySignature = exports.getNonce = exports.getCallData = exports.getSender = exports.getInitCode = void 0;
const constants_1 = require("@ethersproject/constants");
const contracts_1 = require("@ethersproject/contracts");
const ethereumjs_util_1 = require("ethereumjs-util");
const logger_1 = require("./logger");
const Entrypoint_json_1 = __importDefault(require("./abi/Entrypoint.json"));
const SimpleAccount_json_1 = __importDefault(require("./abi/SimpleAccount.json"));
const SimpleAccountFactory_json_1 = __importDefault(require("./abi/SimpleAccountFactory.json"));
const constants_2 = require("./constants");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, "simple-account");
function getInitCode(owner, salt, simpleAccountFactory) {
    const SimpleAccountFactoryContract = new contracts_1.Contract(simpleAccountFactory, SimpleAccountFactory_json_1.default);
    const initCode = simpleAccountFactory +
        (0, ethereumjs_util_1.stripHexPrefix)(SimpleAccountFactoryContract.interface.encodeFunctionData("createAccount", [owner, salt]));
    log("Generated init code", {
        initCode,
        owner,
        salt,
    });
    return initCode;
}
exports.getInitCode = getInitCode;
function getSender(initCode, provider, entrypoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const entrypointContract = new contracts_1.Contract(entrypoint, Entrypoint_json_1.default, provider);
        let expectedError;
        const sender = yield entrypointContract.callStatic
            .getSenderAddress(initCode)
            .catch((error) => {
            var _a;
            expectedError = error;
            return (_a = error === null || error === void 0 ? void 0 : error.errorArgs) === null || _a === void 0 ? void 0 : _a.sender;
        });
        if (!sender || typeof sender !== "string") {
            throw new Error(`Could not determine sender - Error: ${JSON.stringify(expectedError)}`);
        }
        log("Determined sender", sender);
        return sender;
    });
}
exports.getSender = getSender;
function getCallData(to, value, data) {
    const simpleAccountContract = contracts_1.Contract.getInterface(SimpleAccount_json_1.default);
    return simpleAccountContract.encodeFunctionData("execute", [
        to !== null && to !== void 0 ? to : constants_1.AddressZero,
        value !== null && value !== void 0 ? value : "0x0",
        data !== null && data !== void 0 ? data : "0x",
    ]);
}
exports.getCallData = getCallData;
function getNonce(sender, isDeployed, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const simpleAccountContract = new contracts_1.Contract(sender, SimpleAccount_json_1.default, provider);
        const nonce = isDeployed
            ? (yield simpleAccountContract.getNonce()).toHexString()
            : "0x0";
        if (isDeployed) {
            log("Retrieved nonce from smart contract", nonce);
        }
        return nonce;
    });
}
exports.getNonce = getNonce;
function getDummySignature() {
    return constants_2.DUMMY_SIGNATURE;
}
exports.getDummySignature = getDummySignature;
//# sourceMappingURL=SimpleAccount.js.map