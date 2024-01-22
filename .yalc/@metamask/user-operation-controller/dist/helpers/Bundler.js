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
var _Bundler_instances, _Bundler_url, _Bundler_query;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundler = void 0;
const logger_1 = require("../logger");
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'bundler');
/**
 * A helper class for interacting with a bundler.
 */
class Bundler {
    constructor(url) {
        _Bundler_instances.add(this);
        _Bundler_url.set(this, void 0);
        __classPrivateFieldSet(this, _Bundler_url, url, "f");
    }
    /**
     * Estimate the gas required to execute a user operation.
     *
     * @param userOperation - The user operation to estimate gas for.
     * @param entrypoint - The address of entrypoint to use for the user operation.
     * @returns The estimated gas limits for the user operation.
     */
    estimateUserOperationGas(userOperation, entrypoint) {
        return __awaiter(this, void 0, void 0, function* () {
            log('Estimating gas', { url: __classPrivateFieldGet(this, _Bundler_url, "f"), userOperation, entrypoint });
            const response = yield __classPrivateFieldGet(this, _Bundler_instances, "m", _Bundler_query).call(this, 'eth_estimateUserOperationGas', [userOperation, entrypoint]);
            log('Estimated gas', { response });
            return response;
        });
    }
    /**
     * Retrieve the receipt for a user operation.
     * @param hash - The hash of the user operation.
     * @returns The receipt for the user operation, or `undefined` if the user operation is pending.
     */
    getUserOperationReceipt(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            log('Getting user operation receipt', { url: __classPrivateFieldGet(this, _Bundler_url, "f"), hash });
            return yield __classPrivateFieldGet(this, _Bundler_instances, "m", _Bundler_query).call(this, 'eth_getUserOperationReceipt', [hash]);
        });
    }
    /**
     * Submit a user operation to the bundler.
     * @param userOperation - The signed user operation to submit.
     * @param entrypoint - The address of entrypoint to use for the user operation.
     * @returns The hash of the user operation.
     */
    sendUserOperation(userOperation, entrypoint) {
        return __awaiter(this, void 0, void 0, function* () {
            log('Sending user operation', {
                url: __classPrivateFieldGet(this, _Bundler_url, "f"),
                userOperation,
                entrypoint,
            });
            const hash = yield __classPrivateFieldGet(this, _Bundler_instances, "m", _Bundler_query).call(this, 'eth_sendUserOperation', [
                userOperation,
                entrypoint,
            ]);
            log('Sent user operation', hash);
            return hash;
        });
    }
}
exports.Bundler = Bundler;
_Bundler_url = new WeakMap(), _Bundler_instances = new WeakSet(), _Bundler_query = function _Bundler_query(method, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        };
        const response = yield fetch(__classPrivateFieldGet(this, _Bundler_url, "f"), request);
        const responseJson = yield response.json();
        if (responseJson.error) {
            const error = new Error(responseJson.error.message || responseJson.error);
            error.code =
                responseJson.error.code;
            throw error;
        }
        return responseJson.result;
    });
};
//# sourceMappingURL=Bundler.js.map