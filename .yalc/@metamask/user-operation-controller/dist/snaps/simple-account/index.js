"use strict";
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable n/no-process-env */
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
const providers_1 = require("@ethersproject/providers");
const utils_1 = require("@metamask/utils");
const constants_1 = require("../../constants");
const logger_1 = require("../../logger");
const constants_2 = require("./constants");
const ecdsa_1 = require("./ecdsa");
const SimpleAccount_1 = require("./SimpleAccount");
const VerifyingPaymaster_1 = require("./VerifyingPaymaster");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'simple-account-snap');
const onUserOperationRequest = (request) => __awaiter(void 0, void 0, void 0, function* () {
    log('Received user operation request');
    const { chainId, data, ethereum, to, value } = request;
    const provider = new providers_1.Web3Provider(ethereum);
    const potentialInitCode = (0, SimpleAccount_1.getInitCode)(process.env.SIMPLE_ACCOUNT_OWNER, process.env.SIMPLE_ACCOUNT_SALT);
    const sender = yield (0, SimpleAccount_1.getSender)(potentialInitCode, provider);
    const callData = (0, SimpleAccount_1.getCallData)(to, value, data, sender);
    const code = yield provider.getCode(sender);
    const isDeployed = Boolean(code) && code !== '0x';
    const initCode = isDeployed ? '0x' : potentialInitCode;
    const nonce = yield (0, SimpleAccount_1.getNonce)(sender, isDeployed, provider);
    const bundler = getBundler(chainId);
    const dummySignature = (0, SimpleAccount_1.getDummySignature)();
    const dummyPaymasterAndData = (0, VerifyingPaymaster_1.getDummyPaymasterAndData)();
    return {
        bundler,
        callData,
        dummyPaymasterAndData,
        dummySignature,
        initCode,
        nonce,
        sender,
    };
});
const onPaymasterRequest = (request) => __awaiter(void 0, void 0, void 0, function* () {
    log('Received paymaster request', {
        paymasterAddress: process.env.PAYMASTER_ADDRESS,
    });
    const { userOperation, ethereum, privateKey } = request;
    const provider = new providers_1.Web3Provider(ethereum);
    const paymasterAddress = process.env.PAYMASTER_ADDRESS;
    const paymasterAndData = paymasterAddress
        ? yield (0, VerifyingPaymaster_1.getPaymasterAndData)(paymasterAddress, 0, 0, userOperation, privateKey, provider)
        : '0x';
    if (!paymasterAddress) {
        log('Skipping paymaster');
    }
    return { paymasterAndData };
});
const onUserOperationSignatureRequest = (request) => __awaiter(void 0, void 0, void 0, function* () {
    log('Received user operation signature request');
    const { chainId, privateKey, userOperation } = request;
    const signature = yield (0, ecdsa_1.signUserOperation)(userOperation, constants_1.ENTRYPOINT, chainId, privateKey);
    return {
        signature,
    };
});
function getBundler(chainId) {
    return constants_2.BUNDLER_URL_BY_CHAIN_ID[chainId];
}
exports.default = {
    onUserOperationRequest,
    onPaymasterRequest,
    onUserOperationSignatureRequest,
};
//# sourceMappingURL=index.js.map