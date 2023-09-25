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
var _EtherscanNameProvider_instances, _EtherscanNameProvider_apiKey, _EtherscanNameProvider_lastRequestTime, _EtherscanNameProvider_mutex, _EtherscanNameProvider_sendRequest, _EtherscanNameProvider_buildResult, _EtherscanNameProvider_getUrl;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtherscanNameProvider = void 0;
const async_mutex_1 = require("async-mutex");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const types_1 = require("../types");
const util_1 = require("../util");
const ID = 'etherscan';
const LABEL = 'Etherscan (Verified Contract Name)';
const RATE_LIMIT_INTERVAL = 5; // 5 seconds
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'etherscan');
class EtherscanNameProvider {
    constructor({ apiKey } = {}) {
        _EtherscanNameProvider_instances.add(this);
        _EtherscanNameProvider_apiKey.set(this, void 0);
        _EtherscanNameProvider_lastRequestTime.set(this, 0);
        _EtherscanNameProvider_mutex.set(this, new async_mutex_1.Mutex());
        __classPrivateFieldSet(this, _EtherscanNameProvider_apiKey, apiKey, "f");
    }
    getMetadata() {
        return {
            sourceIds: { [types_1.NameType.ETHEREUM_ADDRESS]: [ID] },
            sourceLabels: { [ID]: LABEL },
        };
    }
    getProposedNames(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield __classPrivateFieldGet(this, _EtherscanNameProvider_mutex, "f").acquire();
            try {
                const { value, chainId } = request;
                const time = Date.now();
                const timeSinceLastRequest = time - __classPrivateFieldGet(this, _EtherscanNameProvider_lastRequestTime, "f");
                if (timeSinceLastRequest < RATE_LIMIT_INTERVAL) {
                    log('Skipping request to avoid rate limit');
                    return __classPrivateFieldGet(this, _EtherscanNameProvider_instances, "m", _EtherscanNameProvider_buildResult).call(this, [], RATE_LIMIT_INTERVAL);
                }
                const url = __classPrivateFieldGet(this, _EtherscanNameProvider_instances, "m", _EtherscanNameProvider_getUrl).call(this, chainId, {
                    module: 'contract',
                    action: 'getsourcecode',
                    address: value,
                    apikey: __classPrivateFieldGet(this, _EtherscanNameProvider_apiKey, "f"),
                });
                const { responseData, error } = yield __classPrivateFieldGet(this, _EtherscanNameProvider_instances, "m", _EtherscanNameProvider_sendRequest).call(this, url);
                if (error) {
                    log('Request failed', error);
                    throw error;
                }
                if ((responseData === null || responseData === void 0 ? void 0 : responseData.message) === 'NOTOK') {
                    log('Request warning', responseData.result);
                    return __classPrivateFieldGet(this, _EtherscanNameProvider_instances, "m", _EtherscanNameProvider_buildResult).call(this, [], RATE_LIMIT_INTERVAL);
                }
                const results = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.result) !== null && _a !== void 0 ? _a : [];
                const proposedNames = results.map((result) => result.ContractName);
                log('New proposed names', proposedNames);
                return __classPrivateFieldGet(this, _EtherscanNameProvider_instances, "m", _EtherscanNameProvider_buildResult).call(this, proposedNames);
            }
            finally {
                releaseLock();
            }
        });
    }
}
exports.EtherscanNameProvider = EtherscanNameProvider;
_EtherscanNameProvider_apiKey = new WeakMap(), _EtherscanNameProvider_lastRequestTime = new WeakMap(), _EtherscanNameProvider_mutex = new WeakMap(), _EtherscanNameProvider_instances = new WeakSet(), _EtherscanNameProvider_sendRequest = function _EtherscanNameProvider_sendRequest(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            log('Sending request', url);
            const responseData = (yield (0, util_1.handleFetch)(url));
            return { responseData };
        }
        catch (error) {
            return { error };
        }
        finally {
            __classPrivateFieldSet(this, _EtherscanNameProvider_lastRequestTime, Date.now(), "f");
        }
    });
}, _EtherscanNameProvider_buildResult = function _EtherscanNameProvider_buildResult(proposedNames, retryDelay) {
    return {
        results: {
            [ID]: {
                proposedNames,
                retryDelay,
            },
        },
    };
}, _EtherscanNameProvider_getUrl = function _EtherscanNameProvider_getUrl(chainId, params) {
    const networkInfo = constants_1.ETHERSCAN_SUPPORTED_NETWORKS[chainId];
    if (!networkInfo) {
        throw new Error(`Etherscan does not support chain with ID: ${chainId}`);
    }
    let url = `https://${networkInfo.subdomain}.${networkInfo.domain}/api`;
    Object.keys(params).forEach((key, index) => {
        const value = params[key];
        if (!value) {
            return;
        }
        url += `${index === 0 ? '?' : '&'}${key}=${value}`;
    });
    return url;
};
//# sourceMappingURL=etherscan.js.map