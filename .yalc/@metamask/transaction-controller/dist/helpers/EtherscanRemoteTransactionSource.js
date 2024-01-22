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
var _EtherscanRemoteTransactionSource_instances, _EtherscanRemoteTransactionSource_includeTokenTransfers, _EtherscanRemoteTransactionSource_isTokenRequestPending, _EtherscanRemoteTransactionSource_fetchNormalTransactions, _EtherscanRemoteTransactionSource_fetchTokenTransactions, _EtherscanRemoteTransactionSource_getResponseTransactions, _EtherscanRemoteTransactionSource_normalizeTransaction, _EtherscanRemoteTransactionSource_normalizeTokenTransaction, _EtherscanRemoteTransactionSource_normalizeTransactionBase;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EtherscanRemoteTransactionSource = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const logger_1 = require("../logger");
const types_1 = require("../types");
const etherscan_1 = require("../utils/etherscan");
/**
 * A RemoteTransactionSource that fetches transaction data from Etherscan.
 */
class EtherscanRemoteTransactionSource {
    constructor({ includeTokenTransfers, } = {}) {
        _EtherscanRemoteTransactionSource_instances.add(this);
        _EtherscanRemoteTransactionSource_includeTokenTransfers.set(this, void 0);
        _EtherscanRemoteTransactionSource_isTokenRequestPending.set(this, void 0);
        _EtherscanRemoteTransactionSource_fetchNormalTransactions.set(this, (request, etherscanRequest) => __awaiter(this, void 0, void 0, function* () {
            const { currentChainId } = request;
            const etherscanTransactions = yield (0, etherscan_1.fetchEtherscanTransactions)(etherscanRequest);
            return __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_getResponseTransactions).call(this, etherscanTransactions).map((tx) => __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_normalizeTransaction).call(this, tx, currentChainId));
        }));
        _EtherscanRemoteTransactionSource_fetchTokenTransactions.set(this, (request, etherscanRequest) => __awaiter(this, void 0, void 0, function* () {
            const { currentChainId } = request;
            const etherscanTransactions = yield (0, etherscan_1.fetchEtherscanTokenTransactions)(etherscanRequest);
            return __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_getResponseTransactions).call(this, etherscanTransactions).map((tx) => __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_normalizeTokenTransaction).call(this, tx, currentChainId));
        }));
        __classPrivateFieldSet(this, _EtherscanRemoteTransactionSource_includeTokenTransfers, includeTokenTransfers !== null && includeTokenTransfers !== void 0 ? includeTokenTransfers : true, "f");
        __classPrivateFieldSet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, false, "f");
    }
    isSupportedNetwork(chainId) {
        return Object.keys(constants_1.ETHERSCAN_SUPPORTED_NETWORKS).includes(chainId);
    }
    getLastBlockVariations() {
        return [__classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, "f") ? 'token' : 'normal'];
    }
    fetchTransactions(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const etherscanRequest = Object.assign(Object.assign({}, request), { chainId: request.currentChainId });
            const transactions = __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, "f")
                ? yield __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_fetchTokenTransactions, "f").call(this, request, etherscanRequest)
                : yield __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_fetchNormalTransactions, "f").call(this, request, etherscanRequest);
            if (__classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_includeTokenTransfers, "f")) {
                __classPrivateFieldSet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, !__classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, "f"), "f");
            }
            return transactions;
        });
    }
}
exports.EtherscanRemoteTransactionSource = EtherscanRemoteTransactionSource;
_EtherscanRemoteTransactionSource_includeTokenTransfers = new WeakMap(), _EtherscanRemoteTransactionSource_isTokenRequestPending = new WeakMap(), _EtherscanRemoteTransactionSource_fetchNormalTransactions = new WeakMap(), _EtherscanRemoteTransactionSource_fetchTokenTransactions = new WeakMap(), _EtherscanRemoteTransactionSource_instances = new WeakSet(), _EtherscanRemoteTransactionSource_getResponseTransactions = function _EtherscanRemoteTransactionSource_getResponseTransactions(response) {
    let result = response.result;
    if (response.status === '0') {
        result = [];
        if (response.result.length) {
            (0, logger_1.incomingTransactionsLogger)('Ignored Etherscan request error', {
                message: response.result,
                type: __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_isTokenRequestPending, "f") ? 'token' : 'normal',
            });
        }
    }
    return result;
}, _EtherscanRemoteTransactionSource_normalizeTransaction = function _EtherscanRemoteTransactionSource_normalizeTransaction(txMeta, currentChainId) {
    const base = __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_normalizeTransactionBase).call(this, txMeta, currentChainId);
    return Object.assign(Object.assign(Object.assign({}, base), { txParams: Object.assign(Object.assign({}, base.txParams), { data: txMeta.input }) }), (txMeta.isError === '0'
        ? { status: types_1.TransactionStatus.confirmed }
        : {
            error: new Error('Transaction failed'),
            status: types_1.TransactionStatus.failed,
        }));
}, _EtherscanRemoteTransactionSource_normalizeTokenTransaction = function _EtherscanRemoteTransactionSource_normalizeTokenTransaction(txMeta, currentChainId) {
    const base = __classPrivateFieldGet(this, _EtherscanRemoteTransactionSource_instances, "m", _EtherscanRemoteTransactionSource_normalizeTransactionBase).call(this, txMeta, currentChainId);
    return Object.assign(Object.assign({}, base), { isTransfer: true, transferInformation: {
            contractAddress: txMeta.contractAddress,
            decimals: Number(txMeta.tokenDecimal),
            symbol: txMeta.tokenSymbol,
        } });
}, _EtherscanRemoteTransactionSource_normalizeTransactionBase = function _EtherscanRemoteTransactionSource_normalizeTransactionBase(txMeta, currentChainId) {
    const time = parseInt(txMeta.timeStamp, 10) * 1000;
    return {
        blockNumber: txMeta.blockNumber,
        chainId: currentChainId,
        hash: txMeta.hash,
        id: (0, uuid_1.v1)({ msecs: time }),
        status: types_1.TransactionStatus.confirmed,
        time,
        txParams: {
            chainId: currentChainId,
            from: txMeta.from,
            gas: (0, controller_utils_1.BNToHex)(new ethereumjs_util_1.BN(txMeta.gas)),
            gasPrice: (0, controller_utils_1.BNToHex)(new ethereumjs_util_1.BN(txMeta.gasPrice)),
            gasUsed: (0, controller_utils_1.BNToHex)(new ethereumjs_util_1.BN(txMeta.gasUsed)),
            nonce: (0, controller_utils_1.BNToHex)(new ethereumjs_util_1.BN(txMeta.nonce)),
            to: txMeta.to,
            value: (0, controller_utils_1.BNToHex)(new ethereumjs_util_1.BN(txMeta.value)),
        },
        type: types_1.TransactionType.incoming,
        verifiedOnBlockchain: false,
    };
};
//# sourceMappingURL=EtherscanRemoteTransactionSource.js.map