"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _KeyringController_instances, _KeyringController_keyring, _KeyringController_qrKeyringStateListener, _KeyringController_registerMessageHandlers, _KeyringController_addQRKeyring, _KeyringController_subscribeToQRKeyringEvents, _KeyringController_unsubscribeFromQRKeyringsEvents, _KeyringController_fullUpdate, _KeyringController_handleLock, _KeyringController_handleUnlock, _KeyringController_getMemState;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyringController = exports.SignTypedDataVersion = exports.AccountImportStrategy = exports.KeyringTypes = void 0;
const base_controller_1 = require("@metamask/base-controller");
const eth_keyring_controller_1 = require("@metamask/eth-keyring-controller");
const utils_1 = require("@metamask/utils");
const async_mutex_1 = require("async-mutex");
const ethereumjs_util_1 = require("ethereumjs-util");
const ethereumjs_wallet_1 = __importStar(require("ethereumjs-wallet"));
const name = 'KeyringController';
/**
 * Available keyring types
 */
var KeyringTypes;
(function (KeyringTypes) {
    KeyringTypes["simple"] = "Simple Key Pair";
    KeyringTypes["hd"] = "HD Key Tree";
    KeyringTypes["qr"] = "QR Hardware Wallet Device";
    KeyringTypes["trezor"] = "Trezor Hardware";
    KeyringTypes["ledger"] = "Ledger Hardware";
    KeyringTypes["lattice"] = "Lattice Hardware";
    KeyringTypes["snap"] = "Snap Keyring";
    KeyringTypes["custody"] = "Custody";
})(KeyringTypes = exports.KeyringTypes || (exports.KeyringTypes = {}));
/**
 * A strategy for importing an account
 */
var AccountImportStrategy;
(function (AccountImportStrategy) {
    AccountImportStrategy["privateKey"] = "privateKey";
    AccountImportStrategy["json"] = "json";
})(AccountImportStrategy = exports.AccountImportStrategy || (exports.AccountImportStrategy = {}));
/**
 * The `signTypedMessage` version
 *
 * @see https://docs.metamask.io/guide/signing-data.html
 */
var SignTypedDataVersion;
(function (SignTypedDataVersion) {
    SignTypedDataVersion["V1"] = "V1";
    SignTypedDataVersion["V3"] = "V3";
    SignTypedDataVersion["V4"] = "V4";
})(SignTypedDataVersion = exports.SignTypedDataVersion || (exports.SignTypedDataVersion = {}));
const defaultState = {
    isUnlocked: false,
    keyrings: [],
};
/**
 * Assert that the given keyring has an exportable
 * mnemonic.
 *
 * @param keyring - The keyring to check
 * @throws When the keyring does not have a mnemonic
 */
function assertHasUint8ArrayMnemonic(keyring) {
    if (!((0, utils_1.hasProperty)(keyring, 'mnemonic') && keyring.mnemonic instanceof Uint8Array)) {
        throw new Error("Can't get mnemonic bytes from keyring");
    }
}
/**
 * Controller responsible for establishing and managing user identity.
 *
 * This class is a wrapper around the `eth-keyring-controller` package. The
 * `eth-keyring-controller` manages the "vault", which is an encrypted store of private keys, and
 * it manages the wallet "lock" state. This wrapper class has convenience methods for interacting
 * with the internal keyring controller and handling certain complex operations that involve the
 * keyrings.
 */
class KeyringController extends base_controller_1.BaseController {
    /**
     * Creates a KeyringController instance.
     *
     * @param options - Initial options used to configure this controller
     * @param options.syncIdentities - Sync identities with the given list of addresses.
     * @param options.updateIdentities - Generate an identity for each address given that doesn't already have an identity.
     * @param options.setSelectedAddress - Set the selected address.
     * @param options.setAccountLabel - Set a new name for account.
     * @param options.encryptor - An optional object for defining encryption schemes.
     * @param options.keyringBuilders - Set a new name for account.
     * @param options.cacheEncryptionKey - Whether to cache or not encryption key.
     * @param options.messenger - A restricted controller messenger.
     * @param options.state - Initial state to set on this controller.
     */
    constructor(options) {
        var _a;
        const { syncIdentities, updateIdentities, setSelectedAddress, setAccountLabel, keyringBuilders, messenger, state, } = options;
        super({
            name,
            metadata: {
                vault: { persist: true, anonymous: false },
                isUnlocked: { persist: false, anonymous: true },
                keyrings: { persist: false, anonymous: false },
                encryptionKey: { persist: false, anonymous: false },
                encryptionSalt: { persist: false, anonymous: false },
            },
            messenger,
            state: Object.assign(Object.assign({}, defaultState), state),
        });
        _KeyringController_instances.add(this);
        this.mutex = new async_mutex_1.Mutex();
        _KeyringController_keyring.set(this, void 0);
        _KeyringController_qrKeyringStateListener.set(this, void 0);
        if (options.cacheEncryptionKey) {
            __classPrivateFieldSet(this, _KeyringController_keyring, new eth_keyring_controller_1.KeyringController({
                initState: state,
                encryptor: options.encryptor,
                keyringBuilders,
                cacheEncryptionKey: options.cacheEncryptionKey,
            }), "f");
        }
        else {
            __classPrivateFieldSet(this, _KeyringController_keyring, new eth_keyring_controller_1.KeyringController({
                initState: state,
                encryptor: options.encryptor,
                keyringBuilders,
                cacheEncryptionKey: (_a = options.cacheEncryptionKey) !== null && _a !== void 0 ? _a : false,
            }), "f");
        }
        __classPrivateFieldGet(this, _KeyringController_keyring, "f").memStore.subscribe(__classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_fullUpdate).bind(this));
        __classPrivateFieldGet(this, _KeyringController_keyring, "f").store.subscribe(__classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_fullUpdate).bind(this));
        __classPrivateFieldGet(this, _KeyringController_keyring, "f").on('lock', __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_handleLock).bind(this));
        __classPrivateFieldGet(this, _KeyringController_keyring, "f").on('unlock', __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_handleUnlock).bind(this));
        this.syncIdentities = syncIdentities;
        this.updateIdentities = updateIdentities;
        this.setSelectedAddress = setSelectedAddress;
        this.setAccountLabel = setAccountLabel;
        __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_registerMessageHandlers).call(this);
    }
    /**
     * Adds a new account to the default (first) HD seed phrase keyring.
     *
     * @param accountCount - Number of accounts before adding a new one, used to
     * make the method idempotent.
     * @returns Promise resolving to keyring current state and added account
     * address.
     */
    addNewAccount(accountCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyring = __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType('HD Key Tree')[0];
            /* istanbul ignore if */
            if (!primaryKeyring) {
                throw new Error('No HD keyring found');
            }
            const oldAccounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            if (accountCount && oldAccounts.length !== accountCount) {
                if (accountCount > oldAccounts.length) {
                    throw new Error('Account out of sequence');
                }
                // we return the account already existing at index `accountCount`
                const primaryKeyringAccounts = yield primaryKeyring.getAccounts();
                return {
                    keyringState: __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this),
                    addedAccountAddress: primaryKeyringAccounts[accountCount],
                };
            }
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewAccount(primaryKeyring);
            const newAccounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            yield this.verifySeedPhrase();
            this.updateIdentities(newAccounts);
            const addedAccountAddress = newAccounts.find((selectedAddress) => !oldAccounts.includes(selectedAddress));
            (0, utils_1.assertIsStrictHexString)(addedAccountAddress);
            return {
                keyringState: __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this),
                addedAccountAddress,
            };
        });
    }
    /**
     * Adds a new account to the specified keyring.
     *
     * @param keyring - Keyring to add the account to.
     * @param accountCount - Number of accounts before adding a new one, used to make the method idempotent.
     * @returns Promise resolving to keyring current state and added account
     */
    addNewAccountForKeyring(keyring, accountCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldAccounts = yield this.getAccounts();
            if (accountCount && oldAccounts.length !== accountCount) {
                if (accountCount > oldAccounts.length) {
                    throw new Error('Account out of sequence');
                }
                const existingAccount = oldAccounts[accountCount];
                (0, utils_1.assertIsStrictHexString)(existingAccount);
                return existingAccount;
            }
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewAccount(keyring);
            const addedAccountAddress = (yield this.getAccounts()).find((selectedAddress) => !oldAccounts.includes(selectedAddress));
            (0, utils_1.assertIsStrictHexString)(addedAccountAddress);
            this.updateIdentities(yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts());
            return addedAccountAddress;
        });
    }
    /**
     * Adds a new account to the default (first) HD seed phrase keyring without updating identities in preferences.
     *
     * @returns Promise resolving to current state when the account is added.
     */
    addNewAccountWithoutUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyring = __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType('HD Key Tree')[0];
            /* istanbul ignore if */
            if (!primaryKeyring) {
                throw new Error('No HD keyring found');
            }
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewAccount(primaryKeyring);
            yield this.verifySeedPhrase();
            return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
        });
    }
    /**
     * Effectively the same as creating a new keychain then populating it
     * using the given seed phrase.
     *
     * @param password - Password to unlock keychain.
     * @param seed - A BIP39-compliant seed phrase as Uint8Array,
     * either as a string or an array of UTF-8 bytes that represent the string.
     * @returns Promise resolving to the restored keychain object.
     */
    createNewVaultAndRestore(password, seed) {
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            if (!password || !password.length) {
                throw new Error('Invalid password');
            }
            try {
                this.updateIdentities([]);
                yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").createNewVaultAndRestore(password, seed);
                this.updateIdentities(yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts());
                return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
            }
            finally {
                releaseLock();
            }
        });
    }
    /**
     * Create a new primary keychain and wipe any previous keychains.
     *
     * @param password - Password to unlock the new vault.
     * @returns Newly-created keychain object.
     */
    createNewVaultAndKeychain(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const accounts = yield this.getAccounts();
                if (!accounts.length) {
                    yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").createNewVaultAndKeychain(password);
                    this.updateIdentities(yield this.getAccounts());
                }
                return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
            }
            finally {
                releaseLock();
            }
        });
    }
    /**
     * Adds a new keyring of the given `type`.
     *
     * @param type - Keyring type name.
     * @param opts - Keyring options.
     * @throws If a builder for the given `type` does not exist.
     * @returns Promise resolving to the added keyring.
     */
    addNewKeyring(type, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === KeyringTypes.qr) {
                return this.getOrAddQRKeyring();
            }
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewKeyring(type, opts);
        });
    }
    /**
     * Method to verify a given password validity. Throws an
     * error if the password is invalid.
     *
     * @param password - Password of the keyring.
     */
    verifyPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").verifyPassword(password);
        });
    }
    /**
     * Returns the status of the vault.
     *
     * @returns Boolean returning true if the vault is unlocked.
     */
    isUnlocked() {
        return this.state.isUnlocked;
    }
    /**
     * Gets the seed phrase of the HD keyring.
     *
     * @param password - Password of the keyring.
     * @returns Promise resolving to the seed phrase.
     */
    exportSeedPhrase(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyPassword(password);
            assertHasUint8ArrayMnemonic(__classPrivateFieldGet(this, _KeyringController_keyring, "f").keyrings[0]);
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").keyrings[0].mnemonic;
        });
    }
    /**
     * Gets the private key from the keyring controlling an address.
     *
     * @param password - Password of the keyring.
     * @param address - Address to export.
     * @returns Promise resolving to the private key for an address.
     */
    exportAccount(password, address) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.verifyPassword(password);
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").exportAccount(address);
        });
    }
    /**
     * Returns the public addresses of all accounts for the current keyring.
     *
     * @returns A promise resolving to an array of addresses.
     */
    getAccounts() {
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
    }
    /**
     * Get encryption public key.
     *
     * @param account - An account address.
     * @param opts - Additional encryption options.
     * @throws If the `account` does not exist or does not support the `getEncryptionPublicKey` method
     * @returns Promise resolving to encyption public key of the `account` if one exists.
     */
    getEncryptionPublicKey(account, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").getEncryptionPublicKey(account, opts);
        });
    }
    /**
     * Attempts to decrypt the provided message parameters.
     *
     * @param messageParams - The decryption message parameters.
     * @param messageParams.from - The address of the account you want to use to decrypt the message.
     * @param messageParams.data - The encrypted data that you want to decrypt.
     * @returns The raw decryption result.
     */
    decryptMessage(messageParams) {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").decryptMessage(messageParams);
        });
    }
    /**
     * Returns the currently initialized keyring that manages
     * the specified `address` if one exists.
     *
     * @deprecated Use of this method is discouraged as actions executed directly on
     * keyrings are not being reflected in the KeyringController state and not
     * persisted in the vault.
     * @param account - An account address.
     * @returns Promise resolving to keyring of the `account` if one exists.
     */
    getKeyringForAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringForAccount(account);
        });
    }
    /**
     * Returns all keyrings of the given type.
     *
     * @deprecated Use of this method is discouraged as actions executed directly on
     * keyrings are not being reflected in the KeyringController state and not
     * persisted in the vault.
     * @param type - Keyring type name.
     * @returns An array of keyrings of the given type.
     */
    getKeyringsByType(type) {
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType(type);
    }
    /**
     * Persist all serialized keyrings in the vault.
     *
     * @returns Promise resolving with `true` value when the
     * operation completes.
     */
    persistAllKeyrings() {
        return __awaiter(this, void 0, void 0, function* () {
            return __classPrivateFieldGet(this, _KeyringController_keyring, "f").persistAllKeyrings();
        });
    }
    /**
     * Imports an account with the specified import strategy.
     *
     * @param strategy - Import strategy name.
     * @param args - Array of arguments to pass to the underlying stategy.
     * @throws Will throw when passed an unrecognized strategy.
     * @returns Promise resolving to keyring current state and imported account
     * address.
     */
    importAccountWithStrategy(strategy, 
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args) {
        return __awaiter(this, void 0, void 0, function* () {
            let privateKey;
            switch (strategy) {
                case 'privateKey':
                    const [importedKey] = args;
                    if (!importedKey) {
                        throw new Error('Cannot import an empty key.');
                    }
                    const prefixed = (0, ethereumjs_util_1.addHexPrefix)(importedKey);
                    let bufferedPrivateKey;
                    try {
                        bufferedPrivateKey = (0, ethereumjs_util_1.toBuffer)(prefixed);
                    }
                    catch (_a) {
                        throw new Error('Cannot import invalid private key.');
                    }
                    /* istanbul ignore if */
                    if (!(0, ethereumjs_util_1.isValidPrivate)(bufferedPrivateKey) ||
                        // ensures that the key is 64 bytes long
                        (0, ethereumjs_util_1.getBinarySize)(prefixed) !== 64 + '0x'.length) {
                        throw new Error('Cannot import invalid private key.');
                    }
                    privateKey = (0, ethereumjs_util_1.stripHexPrefix)(prefixed);
                    break;
                case 'json':
                    let wallet;
                    const [input, password] = args;
                    try {
                        wallet = ethereumjs_wallet_1.thirdparty.fromEtherWallet(input, password);
                    }
                    catch (e) {
                        wallet = wallet || (yield ethereumjs_wallet_1.default.fromV3(input, password, true));
                    }
                    privateKey = (0, ethereumjs_util_1.bufferToHex)(wallet.getPrivateKey());
                    break;
                default:
                    throw new Error(`Unexpected import strategy: '${strategy}'`);
            }
            const newKeyring = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewKeyring(KeyringTypes.simple, [
                privateKey,
            ]);
            const accounts = yield newKeyring.getAccounts();
            const allAccounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            this.updateIdentities(allAccounts);
            return {
                keyringState: __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this),
                importedAccountAddress: accounts[0],
            };
        });
    }
    /**
     * Removes an account from keyring state.
     *
     * @param address - Address of the account to remove.
     * @fires KeyringController:accountRemoved
     * @returns Promise resolving current state when this account removal completes.
     */
    removeAccount(address) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").removeAccount(address);
            this.messagingSystem.publish(`${name}:accountRemoved`, address);
            return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
        });
    }
    /**
     * Deallocates all secrets and locks the wallet.
     *
     * @returns Promise resolving to current state.
     */
    setLocked() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_unsubscribeFromQRKeyringsEvents).call(this);
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").setLocked();
            return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
        });
    }
    /**
     * Signs message by calling down into a specific keyring.
     *
     * @param messageParams - PersonalMessageParams object to sign.
     * @returns Promise resolving to a signed message string.
     */
    signMessage(messageParams) {
        if (!messageParams.data) {
            throw new Error("Can't sign an empty message");
        }
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").signMessage(messageParams);
    }
    /**
     * Signs personal message by calling down into a specific keyring.
     *
     * @param messageParams - PersonalMessageParams object to sign.
     * @returns Promise resolving to a signed message string.
     */
    signPersonalMessage(messageParams) {
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").signPersonalMessage(messageParams);
    }
    /**
     * Signs typed message by calling down into a specific keyring.
     *
     * @param messageParams - TypedMessageParams object to sign.
     * @param version - Compatibility version EIP712.
     * @throws Will throw when passed an unrecognized version.
     * @returns Promise resolving to a signed message string or an error if any.
     */
    signTypedMessage(messageParams, version) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (![
                    SignTypedDataVersion.V1,
                    SignTypedDataVersion.V3,
                    SignTypedDataVersion.V4,
                ].includes(version)) {
                    throw new Error(`Unexpected signTypedMessage version: '${version}'`);
                }
                return yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").signTypedMessage({
                    from: messageParams.from,
                    data: version !== SignTypedDataVersion.V1 &&
                        typeof messageParams.data === 'string'
                        ? JSON.parse(messageParams.data)
                        : messageParams.data,
                }, { version });
            }
            catch (error) {
                throw new Error(`Keyring Controller signTypedMessage: ${error}`);
            }
        });
    }
    /**
     * Signs a transaction by calling down into a specific keyring.
     *
     * @param transaction - Transaction object to sign. Must be a `ethereumjs-tx` transaction instance.
     * @param from - Address to sign from, should be in keychain.
     * @param opts - An optional options object.
     * @returns Promise resolving to a signed transaction string.
     */
    signTransaction(transaction, from, opts) {
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").signTransaction(transaction, from, opts);
    }
    /**
     * Convert a base transaction to a base UserOperation.
     *
     * @param from - Address of the sender.
     * @param transactions - Base transactions to include in the UserOperation.
     * @returns A pseudo-UserOperation that can be used to construct a real.
     */
    prepareUserOperation(from, transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").prepareUserOperation(from, transactions);
        });
    }
    /**
     * Patches properties of a UserOperation. Currently, only the
     * `paymasterAndData` can be patched.
     *
     * @param from - Address of the sender.
     * @param userOp - UserOperation to patch.
     * @returns A patch to apply to the UserOperation.
     */
    patchUserOperation(from, userOp) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").patchUserOperation(from, userOp);
        });
    }
    /**
     * Signs an UserOperation.
     *
     * @param from - Address of the sender.
     * @param userOp - UserOperation to sign.
     * @returns The signature of the UserOperation.
     */
    signUserOperation(from, userOp) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").signUserOperation(from, userOp);
        });
    }
    /**
     * Attempts to decrypt the current vault and load its keyrings,
     * using the given encryption key and salt.
     *
     * @param encryptionKey - Key to unlock the keychain.
     * @param encryptionSalt - Salt to unlock the keychain.
     * @returns Promise resolving to the current state.
     */
    submitEncryptionKey(encryptionKey, encryptionSalt) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").submitEncryptionKey(encryptionKey, encryptionSalt);
            const qrKeyring = this.getQRKeyring();
            if (qrKeyring) {
                // if there is a QR keyring, we need to subscribe
                // to its events after unlocking the vault
                __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_subscribeToQRKeyringEvents).call(this, qrKeyring);
            }
            return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
        });
    }
    /**
     * Attempts to decrypt the current vault and load its keyrings,
     * using the given password.
     *
     * @param password - Password to unlock the keychain.
     * @returns Promise resolving to the current state.
     */
    submitPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").submitPassword(password);
            const accounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            const qrKeyring = this.getQRKeyring();
            if (qrKeyring) {
                // if there is a QR keyring, we need to subscribe
                // to its events after unlocking the vault
                __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_subscribeToQRKeyringEvents).call(this, qrKeyring);
            }
            yield this.syncIdentities(accounts);
            return __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_getMemState).call(this);
        });
    }
    /**
     * Verifies the that the seed phrase restores the current keychain's accounts.
     *
     * @returns Promise resolving to the seed phrase as Uint8Array.
     */
    verifySeedPhrase() {
        return __awaiter(this, void 0, void 0, function* () {
            const primaryKeyring = __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType(KeyringTypes.hd)[0];
            /* istanbul ignore if */
            if (!primaryKeyring) {
                throw new Error('No HD keyring found.');
            }
            assertHasUint8ArrayMnemonic(primaryKeyring);
            const seedWords = primaryKeyring.mnemonic;
            const accounts = yield primaryKeyring.getAccounts();
            /* istanbul ignore if */
            if (accounts.length === 0) {
                throw new Error('Cannot verify an empty keyring.');
            }
            // The HD Keyring Builder is a default keyring builder
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const hdKeyringBuilder = __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringBuilderForType(KeyringTypes.hd);
            const hdKeyring = hdKeyringBuilder();
            // @ts-expect-error @metamask/eth-hd-keyring correctly handles
            // Uint8Array seed phrases in the `deserialize` method.
            yield hdKeyring.deserialize({
                mnemonic: seedWords,
                numberOfAccounts: accounts.length,
            });
            const testAccounts = yield hdKeyring.getAccounts();
            /* istanbul ignore if */
            if (testAccounts.length !== accounts.length) {
                throw new Error('Seed phrase imported incorrect number of accounts.');
            }
            testAccounts.forEach((account, i) => {
                /* istanbul ignore if */
                if (account.toLowerCase() !== accounts[i].toLowerCase()) {
                    throw new Error('Seed phrase imported different accounts.');
                }
            });
            return seedWords;
        });
    }
    // QR Hardware related methods
    /**
     * Get QR Hardware keyring.
     *
     * @returns The QR Keyring if defined, otherwise undefined
     */
    getQRKeyring() {
        // QRKeyring is not yet compatible with Keyring type from @metamask/utils
        return __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType(KeyringTypes.qr)[0];
    }
    /**
     * Get QR hardware keyring. If it doesn't exist, add it.
     *
     * @returns The added keyring
     */
    getOrAddQRKeyring() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getQRKeyring() || (yield __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_addQRKeyring).call(this));
        });
    }
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    restoreQRKeyring(serialized) {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).deserialize(serialized);
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").persistAllKeyrings();
            this.updateIdentities(yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts());
        });
    }
    resetQRKeyringState() {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).resetStore();
        });
    }
    getQRKeyringState() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getOrAddQRKeyring()).getMemStore();
        });
    }
    submitQRCryptoHDKey(cryptoHDKey) {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).submitCryptoHDKey(cryptoHDKey);
        });
    }
    submitQRCryptoAccount(cryptoAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).submitCryptoAccount(cryptoAccount);
        });
    }
    submitQRSignature(requestId, ethSignature) {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).submitSignature(requestId, ethSignature);
        });
    }
    cancelQRSignRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.getOrAddQRKeyring()).cancelSignRequest();
        });
    }
    /**
     * Cancels qr keyring sync.
     */
    cancelQRSynchronization() {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line n/no-sync
            (yield this.getOrAddQRKeyring()).cancelSync();
        });
    }
    connectQRHardware(page) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const keyring = yield this.getOrAddQRKeyring();
                let accounts;
                switch (page) {
                    case -1:
                        accounts = yield keyring.getPreviousPage();
                        break;
                    case 1:
                        accounts = yield keyring.getNextPage();
                        break;
                    default:
                        accounts = yield keyring.getFirstPage();
                }
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return accounts.map((account) => {
                    return Object.assign(Object.assign({}, account), { balance: '0x0' });
                });
            }
            catch (e) {
                // TODO: Add test case for when keyring throws
                /* istanbul ignore next */
                throw new Error(`Unspecified error when connect QR Hardware, ${e}`);
            }
        });
    }
    unlockQRHardwareWalletAccount(index) {
        return __awaiter(this, void 0, void 0, function* () {
            const keyring = yield this.getOrAddQRKeyring();
            keyring.setAccountToUnlock(index);
            const oldAccounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            // QRKeyring is not yet compatible with Keyring from
            // @metamask/utils, but we can use the `addNewAccount` method
            // as it internally calls `addAccounts` from on the keyring instance,
            // which is supported by QRKeyring API.
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewAccount(keyring);
            const newAccounts = yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts();
            this.updateIdentities(newAccounts);
            newAccounts.forEach((address) => {
                if (!oldAccounts.includes(address)) {
                    if (this.setAccountLabel) {
                        this.setAccountLabel(address, `${keyring.getName()} ${index}`);
                    }
                    this.setSelectedAddress(address);
                }
            });
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").persistAllKeyrings();
        });
    }
    getAccountKeyringType(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringForAccount(account)).type;
        });
    }
    forgetQRDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const keyring = yield this.getOrAddQRKeyring();
            const allAccounts = (yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts());
            keyring.forgetDevice();
            const remainingAccounts = (yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").getAccounts());
            const removedAccounts = allAccounts.filter((address) => !remainingAccounts.includes(address));
            this.updateIdentities(remainingAccounts);
            yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").persistAllKeyrings();
            return { removedAccounts, remainingAccounts };
        });
    }
}
exports.KeyringController = KeyringController;
_KeyringController_keyring = new WeakMap(), _KeyringController_qrKeyringStateListener = new WeakMap(), _KeyringController_instances = new WeakSet(), _KeyringController_registerMessageHandlers = function _KeyringController_registerMessageHandlers() {
    this.messagingSystem.registerActionHandler(`${name}:signMessage`, this.signMessage.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:signPersonalMessage`, this.signPersonalMessage.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:signTypedMessage`, this.signTypedMessage.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:decryptMessage`, this.decryptMessage.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:getEncryptionPublicKey`, this.getEncryptionPublicKey.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:getAccounts`, this.getAccounts.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:getKeyringsByType`, this.getKeyringsByType.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:getKeyringForAccount`, this.getKeyringForAccount.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:persistAllKeyrings`, this.persistAllKeyrings.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:prepareUserOperation`, this.prepareUserOperation.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:patchUserOperation`, this.patchUserOperation.bind(this));
    this.messagingSystem.registerActionHandler(`${name}:signUserOperation`, this.signUserOperation.bind(this));
}, _KeyringController_addQRKeyring = function _KeyringController_addQRKeyring() {
    return __awaiter(this, void 0, void 0, function* () {
        // QRKeyring is not yet compatible with Keyring type from @metamask/utils
        const qrKeyring = (yield __classPrivateFieldGet(this, _KeyringController_keyring, "f").addNewKeyring(KeyringTypes.qr));
        __classPrivateFieldGet(this, _KeyringController_instances, "m", _KeyringController_subscribeToQRKeyringEvents).call(this, qrKeyring);
        return qrKeyring;
    });
}, _KeyringController_subscribeToQRKeyringEvents = function _KeyringController_subscribeToQRKeyringEvents(qrKeyring) {
    __classPrivateFieldSet(this, _KeyringController_qrKeyringStateListener, (state) => {
        this.messagingSystem.publish(`${name}:qrKeyringStateChange`, state);
    }, "f");
    qrKeyring.getMemStore().subscribe(__classPrivateFieldGet(this, _KeyringController_qrKeyringStateListener, "f"));
}, _KeyringController_unsubscribeFromQRKeyringsEvents = function _KeyringController_unsubscribeFromQRKeyringsEvents() {
    const qrKeyrings = __classPrivateFieldGet(this, _KeyringController_keyring, "f").getKeyringsByType(KeyringTypes.qr);
    qrKeyrings.forEach((qrKeyring) => {
        if (__classPrivateFieldGet(this, _KeyringController_qrKeyringStateListener, "f")) {
            qrKeyring.getMemStore().unsubscribe(__classPrivateFieldGet(this, _KeyringController_qrKeyringStateListener, "f"));
        }
    });
}, _KeyringController_fullUpdate = function _KeyringController_fullUpdate() {
    const { vault } = __classPrivateFieldGet(this, _KeyringController_keyring, "f").store.getState();
    const { keyrings, isUnlocked, encryptionKey, encryptionSalt } = __classPrivateFieldGet(this, _KeyringController_keyring, "f").memStore.getState();
    this.update(() => ({
        vault,
        keyrings,
        isUnlocked,
        encryptionKey,
        encryptionSalt,
    }));
}, _KeyringController_handleLock = function _KeyringController_handleLock() {
    this.messagingSystem.publish(`${name}:lock`);
}, _KeyringController_handleUnlock = function _KeyringController_handleUnlock() {
    this.messagingSystem.publish(`${name}:unlock`);
}, _KeyringController_getMemState = function _KeyringController_getMemState() {
    return {
        isUnlocked: this.state.isUnlocked,
        keyrings: this.state.keyrings,
    };
};
exports.default = KeyringController;
//# sourceMappingURL=KeyringController.js.map