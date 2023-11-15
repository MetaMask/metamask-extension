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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDummySignature = exports.getNonce = exports.getCallData = exports.getSender = exports.getInitCode = void 0;
const constants_1 = require("@ethersproject/constants");
const contracts_1 = require("@ethersproject/contracts");
const ethereumjs_util_1 = require("ethereumjs-util");
const constants_2 = require("../../constants");
const logger_1 = require("../../logger");
const Entrypoint_json_1 = __importDefault(require("./abi/Entrypoint.json"));
const SimpleAccount_json_1 = __importDefault(require("./abi/SimpleAccount.json"));
const SimpleAccountFactory_json_1 = __importDefault(require("./abi/SimpleAccountFactory.json"));
const constants_3 = require("./constants");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'simple-account');
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
function getInitCode(owner, salt) {
    const SimpleAccountFactoryContract = new contracts_1.Contract(SIMPLE_ACCOUNT_FACTORY_ADDRESS, SimpleAccountFactory_json_1.default);
    const initCode = SIMPLE_ACCOUNT_FACTORY_ADDRESS +
        (0, ethereumjs_util_1.stripHexPrefix)(SimpleAccountFactoryContract.interface.encodeFunctionData('createAccount', [owner, salt]));
    log('Generated init code', {
        initCode,
        owner,
        salt,
    });
    return initCode;
}
exports.getInitCode = getInitCode;
function getSender(initCode, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const entrypointContract = new contracts_1.Contract(constants_2.ENTRYPOINT, Entrypoint_json_1.default, provider);
        const sender = yield entrypointContract.callStatic
            .getSenderAddress(initCode)
            .catch((error) => error.errorArgs.sender);
        log('Determined sender', sender);
        return sender;
    });
}
exports.getSender = getSender;
function getCallData(to, value, data, sender) {
    const simpleAccountContract = new contracts_1.Contract(sender, SimpleAccount_json_1.default);
    return simpleAccountContract.interface.encodeFunctionData('execute', [
        to !== null && to !== void 0 ? to : constants_1.AddressZero,
        value !== null && value !== void 0 ? value : '0x0',
        data !== null && data !== void 0 ? data : '0x',
    ]);
}
exports.getCallData = getCallData;
function getNonce(sender, isDeployed, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const simpleAccountContract = new contracts_1.Contract(sender, SimpleAccount_json_1.default, provider);
        const nonce = isDeployed
            ? (yield simpleAccountContract.getNonce()).toHexString()
            : '0x0';
        if (isDeployed) {
            log('Retrieved nonce from smart contract', nonce);
        }
        return nonce;
    });
}
exports.getNonce = getNonce;
function getDummySignature() {
    return constants_3.DUMMY_SIGNATURE;
}
exports.getDummySignature = getDummySignature;
//# sourceMappingURL=SimpleAccount.js.map