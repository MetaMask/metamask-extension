"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TrezorKeyring_instances, _TrezorKeyring_getPage, _TrezorKeyring_signTransaction, _TrezorKeyring_normalize, _TrezorKeyring_addressFromIndex, _TrezorKeyring_pathFromAddress;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrezorKeyring = exports.TREZOR_CONNECT_MANIFEST = void 0;
const tx_1 = require("@ethereumjs/tx");
const util_1 = require("@ethereumjs/util");
const eth_sig_util_1 = require("@metamask/eth-sig-util");
const utils_1 = require("@metamask/utils");
const connect_plugin_ethereum_1 = require("@trezor/connect-plugin-ethereum");
const hdkey_1 = __importDefault(require("hdkey"));
const hdPathString = `m/44'/60'/0'/0`;
const SLIP0044TestnetPath = `m/44'/1'/0'/0`;
const legacyMewPath = `m/44'/60'/0'`;
const ALLOWED_HD_PATHS = {
    [hdPathString]: true,
    [legacyMewPath]: true,
    [SLIP0044TestnetPath]: true,
};
const keyringType = 'Trezor Hardware';
const pathBase = 'm';
const MAX_INDEX = 1000;
const DELAY_BETWEEN_POPUPS = 1000;
exports.TREZOR_CONNECT_MANIFEST = {
    appName: 'MetaMask',
    email: 'support@metamask.io',
    appUrl: 'https://metamask.io',
};
async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Trezor Connect failure payloads often set `error` to the generic string "Unknown error"
 * while the real reason is in `code` (e.g. Failure_ActionCancelled). Prefer code-specific text.
 *
 * @param payload - `response.payload` from a failed Trezor Connect call
 * @returns Message suitable for `new Error(...)`
 */
function getTrezorConnectFailureMessage(payload) {
    if (!payload || typeof payload !== 'object') {
        return 'Unknown error';
    }
    const code = payload.code;
    const err = typeof payload.error === 'string' ? payload.error : '';
    const codeMessages = {
        Failure_ActionCancelled: 'Action cancelled by user',
        Failure_PinCancelled: 'PIN cancelled',
        Method_Cancel: 'Cancelled',
        Method_Interrupted: 'Popup closed',
        Device_Disconnected: 'Device disconnected',
    };
    if (typeof code === 'string' && codeMessages[code]) {
        return codeMessages[code];
    }
    if (err && err !== 'Unknown error') {
        return err;
    }
    if (typeof code === 'string' && code.length > 0) {
        return code;
    }
    return err || 'Unknown error';
}
/**
 * @param error - Caught value from Trezor Connect / bridge
 */
function normalizeTrezorCaughtError(error) {
    if (error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string') {
        const codeMessages = {
            Failure_ActionCancelled: 'Action cancelled by user',
            Failure_PinCancelled: 'PIN cancelled',
            Method_Cancel: 'Cancelled',
            Method_Interrupted: 'Popup closed',
            Device_Disconnected: 'Device disconnected',
        };
        if (codeMessages[error.code]) {
            return new Error(codeMessages[error.code]);
        }
    }
    if (error instanceof Error) {
        if (error.message && error.message !== 'Unknown error') {
            return error;
        }
    }
    const fallback = (error === null || error === void 0 ? void 0 : error.toString()) || 'Unknown error';
    return new Error(fallback);
}
/**
 * Check if the given transaction is made with ethereumjs-tx or @ethereumjs/tx
 *
 * Transactions built with older versions of ethereumjs-tx have a
 * getChainId method that newer versions do not.
 * Older versions are mutable
 * while newer versions default to being immutable.
 * Expected shape and type
 * of data for v, r and s differ (Buffer (old) vs BN (new)).
 *
 * @param tx
 * @returns Returns `true` if tx is an old-style ethereumjs-tx transaction.
 */
function isOldStyleEthereumjsTx(tx) {
    return typeof tx.getChainId === 'function';
}
class TrezorKeyring {
    constructor({ bridge }) {
        _TrezorKeyring_instances.add(this);
        this.type = keyringType;
        this.accounts = [];
        this.hdk = new hdkey_1.default();
        this.hdPath = hdPathString;
        this.page = 0;
        this.perPage = 5;
        this.unlockedAccount = 0;
        this.paths = {};
        if (!bridge) {
            throw new Error('Bridge is a required dependency for the keyring');
        }
        this.bridge = bridge;
    }
    /**
     * Gets the model, if known.
     * This may be `undefined` if the model hasn't been loaded yet.
     *
     * @returns
     */
    getModel() {
        return this.bridge.model;
    }
    async init() {
        return this.bridge.init({
            manifest: exports.TREZOR_CONNECT_MANIFEST,
            lazyLoad: true,
        });
    }
    async destroy() {
        return this.bridge.dispose();
    }
    async serialize() {
        return Promise.resolve({
            hdPath: this.hdPath,
            accounts: this.accounts.slice(),
            page: this.page,
            paths: this.paths,
            perPage: this.perPage,
            unlockedAccount: this.unlockedAccount,
        });
    }
    async deserialize(opts) {
        var _a, _b, _c, _d;
        this.hdPath = (_a = opts.hdPath) !== null && _a !== void 0 ? _a : hdPathString;
        this.accounts = (_b = opts.accounts) !== null && _b !== void 0 ? _b : [];
        this.page = (_c = opts.page) !== null && _c !== void 0 ? _c : 0;
        this.perPage = (_d = opts.perPage) !== null && _d !== void 0 ? _d : 5;
        return Promise.resolve();
    }
    isUnlocked() {
        var _a;
        return Boolean((_a = this.hdk) === null || _a === void 0 ? void 0 : _a.publicKey);
    }
    async unlock() {
        if (this.isUnlocked()) {
            return Promise.resolve('already unlocked');
        }
        return new Promise((resolve, reject) => {
            this.bridge
                .getPublicKey({
                path: this.hdPath,
                coin: 'ETH',
            })
                .then((response) => {
                var _a;
                if (response.success) {
                    this.hdk.publicKey = Buffer.from(response.payload.publicKey, 'hex');
                    this.hdk.chainCode = Buffer.from(response.payload.chainCode, 'hex');
                    resolve('just unlocked');
                }
                else {
                    reject(new Error(getTrezorConnectFailureMessage(response.payload)));
                }
            })
                .catch((e) => {
                reject(normalizeTrezorCaughtError(e));
            });
        });
    }
    setAccountToUnlock(index) {
        this.unlockedAccount = parseInt(String(index), 10);
    }
    async addAccounts(numberOfAccounts) {
        return new Promise((resolve, reject) => {
            this.unlock()
                .then((_) => {
                const from = this.unlockedAccount;
                const to = from + numberOfAccounts;
                const newAccounts = [];
                for (let i = from; i < to; i++) {
                    const address = __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_addressFromIndex).call(this, pathBase, i);
                    if (!this.accounts.includes(address)) {
                        this.accounts = [...this.accounts, address];
                        newAccounts.push(address);
                    }
                    this.page = 0;
                }
                resolve(newAccounts);
            })
                .catch((e) => {
                reject(e);
            });
        });
    }
    async getFirstPage() {
        this.page = 0;
        return __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_getPage).call(this, 1);
    }
    async getNextPage() {
        return __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_getPage).call(this, 1);
    }
    async getPreviousPage() {
        return __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_getPage).call(this, -1);
    }
    async getAccounts() {
        return Promise.resolve(this.accounts.slice());
    }
    removeAccount(address) {
        if (!this.accounts.map((a) => a.toLowerCase()).includes(address.toLowerCase())) {
            throw new Error(`Address ${address} not found in this keyring`);
        }
        this.accounts = this.accounts.filter((a) => a.toLowerCase() !== address.toLowerCase());
    }
    /**
     * Signs a transaction using Trezor.
     *
     * Accepts either an ethereumjs-tx or @ethereumjs/tx transaction, and returns
     * the same type.
     *
     * @param address - Hex string address.
     * @param tx - Instance of either new-style or old-style ethereumjs transaction.
     * @returns The signed transaction, an instance of either new-style or old-style
     * ethereumjs transaction.
     */
    async signTransaction(address, tx) {
        if (isOldStyleEthereumjsTx(tx)) {
            // In this version of ethereumjs-tx we must add the chainId in hex format
            // to the initial v value. The chainId must be included in the serialized
            // transaction which is only communicated to ethereumjs-tx in this
            // value. In newer versions the chainId is communicated via the 'Common'
            // object.
            return __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_signTransaction).call(this, address,
            // @types/ethereumjs-tx and old ethereumjs-tx versions document
            // this function return value as Buffer, but the actual
            // Transaction._chainId will always be a number.
            // See https://github.com/ethereumjs/ethereumjs-tx/blob/v1.3.7/index.js#L126
            tx.getChainId(), tx, (payload) => {
                tx.v = Buffer.from(payload.v, 'hex');
                tx.r = Buffer.from(payload.r, 'hex');
                tx.s = Buffer.from(payload.s, 'hex');
                return tx;
            });
        }
        return __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_signTransaction).call(this, address, Number(tx.common.chainId()), tx, (payload) => {
            // Because tx will be immutable, first get a plain javascript object that
            // represents the transaction. Using txData here as it aligns with the
            // nomenclature of ethereumjs/tx.
            const txData = tx.toJSON();
            // The fromTxData utility expects a type to support transactions with a type other than 0
            txData.type = tx.type;
            // The fromTxData utility expects v,r and s to be hex prefixed
            txData.v = (0, utils_1.add0x)(payload.v);
            txData.r = (0, utils_1.add0x)(payload.r);
            txData.s = (0, utils_1.add0x)(payload.s);
            // Adopt the 'common' option from the original transaction and set the
            // returned object to be frozen if the original is frozen.
            return tx_1.TransactionFactory.fromTxData(txData, {
                common: tx.common,
                freeze: Object.isFrozen(tx),
            });
        });
    }
    async signMessage(withAccount, data) {
        return this.signPersonalMessage(withAccount, data);
    }
    // For personal_sign, we need to prefix the message:
    async signPersonalMessage(withAccount, message) {
        return new Promise((resolve, reject) => {
            this.unlock()
                .then((status) => {
                setTimeout(() => {
                    this.bridge
                        .ethereumSignMessage({
                        path: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_pathFromAddress).call(this, withAccount),
                        message: (0, utils_1.remove0x)(message),
                        hex: true,
                    })
                        .then((response) => {
                        var _a;
                        if (response.success) {
                            if (response.payload.address !==
                                (0, utils_1.getChecksumAddress)(withAccount)) {
                                reject(new Error('signature doesnt match the right address'));
                            }
                            const signature = `0x${response.payload.signature}`;
                            resolve(signature);
                        }
                        else {
                            reject(new Error(getTrezorConnectFailureMessage(response.payload)));
                        }
                    })
                        .catch((e) => {
                        reject(normalizeTrezorCaughtError(e));
                    });
                    // This is necessary to avoid popup collision
                    // between the unlock & sign trezor popups
                }, status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0);
            })
                .catch((e) => {
                reject(normalizeTrezorCaughtError(e));
            });
        });
    }
    // EIP-712 Sign Typed Data
    async signTypedData(address, data, options) {
        var _a, _b;
        const { version } = options !== null && options !== void 0 ? options : { version: eth_sig_util_1.SignTypedDataVersion.V4 };
        const dataWithHashes = (0, connect_plugin_ethereum_1.transformTypedData)(data, version === eth_sig_util_1.SignTypedDataVersion.V4);
        // set default values for signTypedData
        // Trezor is stricter than @metamask/eth-sig-util in what it accepts
        const { types, message = {}, domain = {}, primaryType,
        // snake_case since Trezor uses Protobuf naming conventions here
        domain_separator_hash, // eslint-disable-line camelcase
        message_hash, // eslint-disable-line camelcase
         } = dataWithHashes;
        // This is necessary to avoid popup collision
        // between the unlock & sign trezor popups
        const status = await this.unlock();
        await wait(status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0);
        const response = await this.bridge.ethereumSignTypedData({
            path: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_pathFromAddress).call(this, address),
            data: {
                types: Object.assign(Object.assign({}, types), { EIP712Domain: (_a = types.EIP712Domain) !== null && _a !== void 0 ? _a : [] }),
                message,
                domain,
                primaryType,
            },
            metamask_v4_compat: true, // eslint-disable-line camelcase
            // Trezor 1 only supports blindly signing hashes
            domain_separator_hash, // eslint-disable-line camelcase
            message_hash: message_hash !== null && message_hash !== void 0 ? message_hash : '', // eslint-disable-line camelcase
        });
        if (response.success) {
            if ((0, utils_1.getChecksumAddress)(address) !== response.payload.address) {
                throw new Error('signature doesnt match the right address');
            }
            return response.payload.signature;
        }
        throw new Error(getTrezorConnectFailureMessage(response.payload));
    }
    forgetDevice() {
        this.accounts = [];
        this.hdk = new hdkey_1.default();
        this.page = 0;
        this.unlockedAccount = 0;
        this.paths = {};
    }
    /**
     * Set the HD path to be used by the keyring. Only known supported HD paths are allowed.
     *
     * If the given HD path is already the current HD path, nothing happens. Otherwise the new HD
     * path is set, and the wallet state is completely reset.
     *
     * @throws {Error] Throws if the HD path is not supported.
     *
     * @param hdPath - The HD path to set.
     */
    setHdPath(hdPath) {
        if (!ALLOWED_HD_PATHS[hdPath]) {
            throw new Error(`The setHdPath method does not support setting HD Path to ${hdPath}`);
        }
        // Reset HDKey if the path changes
        if (this.hdPath !== hdPath) {
            this.hdk = new hdkey_1.default();
            this.accounts = [];
            this.page = 0;
            this.perPage = 5;
            this.unlockedAccount = 0;
            this.paths = {};
        }
        this.hdPath = hdPath;
    }
}
exports.TrezorKeyring = TrezorKeyring;
_TrezorKeyring_instances = new WeakSet(), _TrezorKeyring_getPage = async function _TrezorKeyring_getPage(increment) {
    this.page += increment;
    if (this.page <= 0) {
        this.page = 1;
    }
    return new Promise((resolve, reject) => {
        this.unlock()
            .then((_) => {
            const from = (this.page - 1) * this.perPage;
            const to = from + this.perPage;
            const accounts = [];
            for (let i = from; i < to; i++) {
                const address = __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_addressFromIndex).call(this, pathBase, i);
                accounts.push({
                    address,
                    balance: null,
                    index: i,
                });
                this.paths[(0, utils_1.getChecksumAddress)(address)] = i;
            }
            resolve(accounts);
        })
            .catch((e) => {
            reject(e);
        });
    });
}, _TrezorKeyring_signTransaction =
/**
 *
 * @param address - Hex string address.
 * @param chainId - Chain ID
 * @param tx - Instance of either new-style or old-style ethereumjs transaction.
 * @param handleSigning - Converts signed transaction
 * to the same new-style or old-style ethereumjs-tx.
 * @returns The signed transaction, an instance of either new-style or old-style
 * ethereumjs transaction.
 */
async function _TrezorKeyring_signTransaction(address, chainId, tx, handleSigning) {
    var _a, _b, _c, _d;
    let transaction;
    if (isOldStyleEthereumjsTx(tx)) {
        // legacy transaction from ethereumjs-tx package has no .toJSON() function,
        // so we need to convert to hex-strings manually manually
        transaction = {
            to: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.to),
            value: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.value),
            data: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.data),
            chainId,
            nonce: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.nonce),
            gasLimit: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.gasLimit),
            gasPrice: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, tx.gasPrice),
        };
    }
    else {
        // new-style transaction from @ethereumjs/tx package
        // we can just copy tx.toJSON() for everything except chainId, which must be a number
        transaction = Object.assign(Object.assign({}, tx.toJSON()), { chainId, to: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_normalize).call(this, Buffer.from((_b = (_a = tx.to) === null || _a === void 0 ? void 0 : _a.bytes) !== null && _b !== void 0 ? _b : [])) });
    }
    try {
        const status = await this.unlock();
        await wait(status === 'just unlocked' ? DELAY_BETWEEN_POPUPS : 0);
        const response = await this.bridge.ethereumSignTransaction({
            path: __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_pathFromAddress).call(this, address),
            transaction,
        });
        if (response.success) {
            const newOrMutatedTx = handleSigning(response.payload);
            const addressSignedWith = (0, utils_1.getChecksumAddress)((0, utils_1.add0x)(newOrMutatedTx.getSenderAddress().toString('hex')));
            const correctAddress = (0, utils_1.getChecksumAddress)(address);
            if (addressSignedWith !== correctAddress) {
                throw new Error("signature doesn't match the right address");
            }
            return newOrMutatedTx;
        }
        throw new Error(getTrezorConnectFailureMessage(response.payload));
    }
    catch (e) {
        throw normalizeTrezorCaughtError(e);
    }
}, _TrezorKeyring_normalize = function _TrezorKeyring_normalize(buf) {
    return (0, utils_1.bytesToHex)(buf);
}, _TrezorKeyring_addressFromIndex = function _TrezorKeyring_addressFromIndex(basePath, i) {
    const dkey = this.hdk.derive(`${basePath}/${i}`);
    const address = (0, utils_1.bytesToHex)((0, util_1.publicToAddress)(dkey.publicKey, true));
    return (0, util_1.toChecksumAddress)(address);
}, _TrezorKeyring_pathFromAddress = function _TrezorKeyring_pathFromAddress(address) {
    const checksummedAddress = (0, utils_1.getChecksumAddress)(address);
    let index = this.paths[checksummedAddress];
    if (typeof index === 'undefined') {
        for (let i = 0; i < MAX_INDEX; i++) {
            if (checksummedAddress === __classPrivateFieldGet(this, _TrezorKeyring_instances, "m", _TrezorKeyring_addressFromIndex).call(this, pathBase, i)) {
                index = i;
                break;
            }
        }
    }
    if (typeof index === 'undefined') {
        throw new Error('Unknown address');
    }
    return `${this.hdPath}/${index}`;
};
TrezorKeyring.type = keyringType;
//# sourceMappingURL=trezor-keyring.cjs.map
