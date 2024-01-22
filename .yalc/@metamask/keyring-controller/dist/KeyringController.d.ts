import type { TxData, TypedTransaction } from '@ethereumjs/tx';
import type { MetaMaskKeyring as QRKeyring, IKeyringState as IQRKeyringState } from '@keystonehq/metamask-airgapped-keyring';
import type { RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import type { ExportableKeyEncryptor, GenericEncryptor } from '@metamask/eth-keyring-controller/dist/types';
import type { EthBaseTransaction, EthBaseUserOperation, EthKeyring, EthUserOperation, EthUserOperationPatch } from '@metamask/keyring-api';
import type { PersonalMessageParams, TypedMessageParams } from '@metamask/message-manager';
import type { PreferencesController } from '@metamask/preferences-controller';
import type { Eip1024EncryptedData, Hex, Json } from '@metamask/utils';
import type { Patch } from 'immer';
declare const name = "KeyringController";
/**
 * Available keyring types
 */
export declare enum KeyringTypes {
    simple = "Simple Key Pair",
    hd = "HD Key Tree",
    qr = "QR Hardware Wallet Device",
    trezor = "Trezor Hardware",
    ledger = "Ledger Hardware",
    lattice = "Lattice Hardware",
    snap = "Snap Keyring",
    custody = "Custody"
}
/**
 * @type KeyringControllerState
 *
 * Keyring controller state
 * @property vault - Encrypted string representing keyring data
 * @property isUnlocked - Whether vault is unlocked
 * @property keyringTypes - Account types
 * @property keyrings - Group of accounts
 * @property encryptionKey - Keyring encryption key
 * @property encryptionSalt - Keyring encryption salt
 */
export declare type KeyringControllerState = {
    vault?: string;
    isUnlocked: boolean;
    keyrings: KeyringObject[];
    encryptionKey?: string;
    encryptionSalt?: string;
};
export declare type KeyringControllerMemState = Omit<KeyringControllerState, 'vault' | 'encryptionKey' | 'encryptionSalt'>;
export declare type KeyringControllerGetStateAction = {
    type: `${typeof name}:getState`;
    handler: () => KeyringControllerState;
};
export declare type KeyringControllerSignMessageAction = {
    type: `${typeof name}:signMessage`;
    handler: KeyringController['signMessage'];
};
export declare type KeyringControllerSignPersonalMessageAction = {
    type: `${typeof name}:signPersonalMessage`;
    handler: KeyringController['signPersonalMessage'];
};
export declare type KeyringControllerSignTypedMessageAction = {
    type: `${typeof name}:signTypedMessage`;
    handler: KeyringController['signTypedMessage'];
};
export declare type KeyringControllerDecryptMessageAction = {
    type: `${typeof name}:decryptMessage`;
    handler: KeyringController['decryptMessage'];
};
export declare type KeyringControllerGetEncryptionPublicKeyAction = {
    type: `${typeof name}:getEncryptionPublicKey`;
    handler: KeyringController['getEncryptionPublicKey'];
};
export declare type KeyringControllerGetKeyringsByTypeAction = {
    type: `${typeof name}:getKeyringsByType`;
    handler: KeyringController['getKeyringsByType'];
};
export declare type KeyringControllerGetKeyringForAccountAction = {
    type: `${typeof name}:getKeyringForAccount`;
    handler: KeyringController['getKeyringForAccount'];
};
export declare type KeyringControllerGetAccountsAction = {
    type: `${typeof name}:getAccounts`;
    handler: KeyringController['getAccounts'];
};
export declare type KeyringControllerPersistAllKeyringsAction = {
    type: `${typeof name}:persistAllKeyrings`;
    handler: KeyringController['persistAllKeyrings'];
};
export declare type KeyringControllerPrepareUserOperationAction = {
    type: `${typeof name}:prepareUserOperation`;
    handler: KeyringController['prepareUserOperation'];
};
export declare type KeyringControllerPatchUserOperationAction = {
    type: `${typeof name}:patchUserOperation`;
    handler: KeyringController['patchUserOperation'];
};
export declare type KeyringControllerSignUserOperationAction = {
    type: `${typeof name}:signUserOperation`;
    handler: KeyringController['signUserOperation'];
};
export declare type KeyringControllerStateChangeEvent = {
    type: `${typeof name}:stateChange`;
    payload: [KeyringControllerState, Patch[]];
};
export declare type KeyringControllerAccountRemovedEvent = {
    type: `${typeof name}:accountRemoved`;
    payload: [string];
};
export declare type KeyringControllerLockEvent = {
    type: `${typeof name}:lock`;
    payload: [];
};
export declare type KeyringControllerUnlockEvent = {
    type: `${typeof name}:unlock`;
    payload: [];
};
export declare type KeyringControllerQRKeyringStateChangeEvent = {
    type: `${typeof name}:qrKeyringStateChange`;
    payload: [ReturnType<IQRKeyringState['getState']>];
};
export declare type KeyringControllerActions = KeyringControllerGetStateAction | KeyringControllerSignMessageAction | KeyringControllerSignPersonalMessageAction | KeyringControllerSignTypedMessageAction | KeyringControllerDecryptMessageAction | KeyringControllerGetEncryptionPublicKeyAction | KeyringControllerGetAccountsAction | KeyringControllerGetKeyringsByTypeAction | KeyringControllerGetKeyringForAccountAction | KeyringControllerPersistAllKeyringsAction | KeyringControllerPrepareUserOperationAction | KeyringControllerPatchUserOperationAction | KeyringControllerSignUserOperationAction;
export declare type KeyringControllerEvents = KeyringControllerStateChangeEvent | KeyringControllerLockEvent | KeyringControllerUnlockEvent | KeyringControllerAccountRemovedEvent | KeyringControllerQRKeyringStateChangeEvent;
export declare type KeyringControllerMessenger = RestrictedControllerMessenger<typeof name, KeyringControllerActions, KeyringControllerEvents, string, string>;
export declare type KeyringControllerOptions = {
    syncIdentities: PreferencesController['syncIdentities'];
    updateIdentities: PreferencesController['updateIdentities'];
    setSelectedAddress: PreferencesController['setSelectedAddress'];
    setAccountLabel?: PreferencesController['setAccountLabel'];
    keyringBuilders?: {
        (): EthKeyring<Json>;
        type: string;
    }[];
    messenger: KeyringControllerMessenger;
    state?: {
        vault?: string;
    };
} & ({
    cacheEncryptionKey: true;
    encryptor?: ExportableKeyEncryptor;
} | {
    cacheEncryptionKey?: false;
    encryptor?: GenericEncryptor | ExportableKeyEncryptor;
});
/**
 * @type KeyringObject
 *
 * Keyring object to return in fullUpdate
 * @property type - Keyring type
 * @property accounts - Associated accounts
 */
export declare type KeyringObject = {
    accounts: string[];
    type: string;
};
/**
 * A strategy for importing an account
 */
export declare enum AccountImportStrategy {
    privateKey = "privateKey",
    json = "json"
}
/**
 * The `signTypedMessage` version
 *
 * @see https://docs.metamask.io/guide/signing-data.html
 */
export declare enum SignTypedDataVersion {
    V1 = "V1",
    V3 = "V3",
    V4 = "V4"
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
export declare class KeyringController extends BaseController<typeof name, KeyringControllerState, KeyringControllerMessenger> {
    #private;
    private readonly mutex;
    private readonly syncIdentities;
    private readonly updateIdentities;
    private readonly setSelectedAddress;
    private readonly setAccountLabel?;
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
    constructor(options: KeyringControllerOptions);
    /**
     * Adds a new account to the default (first) HD seed phrase keyring.
     *
     * @param accountCount - Number of accounts before adding a new one, used to
     * make the method idempotent.
     * @returns Promise resolving to keyring current state and added account
     * address.
     */
    addNewAccount(accountCount?: number): Promise<{
        keyringState: KeyringControllerMemState;
        addedAccountAddress: string;
    }>;
    /**
     * Adds a new account to the specified keyring.
     *
     * @param keyring - Keyring to add the account to.
     * @param accountCount - Number of accounts before adding a new one, used to make the method idempotent.
     * @returns Promise resolving to keyring current state and added account
     */
    addNewAccountForKeyring(keyring: EthKeyring<Json>, accountCount?: number): Promise<Hex>;
    /**
     * Adds a new account to the default (first) HD seed phrase keyring without updating identities in preferences.
     *
     * @returns Promise resolving to current state when the account is added.
     */
    addNewAccountWithoutUpdate(): Promise<KeyringControllerMemState>;
    /**
     * Effectively the same as creating a new keychain then populating it
     * using the given seed phrase.
     *
     * @param password - Password to unlock keychain.
     * @param seed - A BIP39-compliant seed phrase as Uint8Array,
     * either as a string or an array of UTF-8 bytes that represent the string.
     * @returns Promise resolving to the restored keychain object.
     */
    createNewVaultAndRestore(password: string, seed: Uint8Array): Promise<KeyringControllerMemState>;
    /**
     * Create a new primary keychain and wipe any previous keychains.
     *
     * @param password - Password to unlock the new vault.
     * @returns Newly-created keychain object.
     */
    createNewVaultAndKeychain(password: string): Promise<KeyringControllerMemState>;
    /**
     * Adds a new keyring of the given `type`.
     *
     * @param type - Keyring type name.
     * @param opts - Keyring options.
     * @throws If a builder for the given `type` does not exist.
     * @returns Promise resolving to the added keyring.
     */
    addNewKeyring(type: KeyringTypes | string, opts?: unknown): Promise<unknown>;
    /**
     * Method to verify a given password validity. Throws an
     * error if the password is invalid.
     *
     * @param password - Password of the keyring.
     */
    verifyPassword(password: string): Promise<void>;
    /**
     * Returns the status of the vault.
     *
     * @returns Boolean returning true if the vault is unlocked.
     */
    isUnlocked(): boolean;
    /**
     * Gets the seed phrase of the HD keyring.
     *
     * @param password - Password of the keyring.
     * @returns Promise resolving to the seed phrase.
     */
    exportSeedPhrase(password: string): Promise<Uint8Array>;
    /**
     * Gets the private key from the keyring controlling an address.
     *
     * @param password - Password of the keyring.
     * @param address - Address to export.
     * @returns Promise resolving to the private key for an address.
     */
    exportAccount(password: string, address: string): Promise<string>;
    /**
     * Returns the public addresses of all accounts for the current keyring.
     *
     * @returns A promise resolving to an array of addresses.
     */
    getAccounts(): Promise<string[]>;
    /**
     * Get encryption public key.
     *
     * @param account - An account address.
     * @param opts - Additional encryption options.
     * @throws If the `account` does not exist or does not support the `getEncryptionPublicKey` method
     * @returns Promise resolving to encyption public key of the `account` if one exists.
     */
    getEncryptionPublicKey(account: string, opts?: Record<string, unknown>): Promise<string>;
    /**
     * Attempts to decrypt the provided message parameters.
     *
     * @param messageParams - The decryption message parameters.
     * @param messageParams.from - The address of the account you want to use to decrypt the message.
     * @param messageParams.data - The encrypted data that you want to decrypt.
     * @returns The raw decryption result.
     */
    decryptMessage(messageParams: {
        from: string;
        data: Eip1024EncryptedData;
    }): Promise<string>;
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
    getKeyringForAccount(account: string): Promise<unknown>;
    /**
     * Returns all keyrings of the given type.
     *
     * @deprecated Use of this method is discouraged as actions executed directly on
     * keyrings are not being reflected in the KeyringController state and not
     * persisted in the vault.
     * @param type - Keyring type name.
     * @returns An array of keyrings of the given type.
     */
    getKeyringsByType(type: KeyringTypes | string): unknown[];
    /**
     * Persist all serialized keyrings in the vault.
     *
     * @returns Promise resolving with `true` value when the
     * operation completes.
     */
    persistAllKeyrings(): Promise<boolean>;
    /**
     * Imports an account with the specified import strategy.
     *
     * @param strategy - Import strategy name.
     * @param args - Array of arguments to pass to the underlying stategy.
     * @throws Will throw when passed an unrecognized strategy.
     * @returns Promise resolving to keyring current state and imported account
     * address.
     */
    importAccountWithStrategy(strategy: AccountImportStrategy, args: any[]): Promise<{
        keyringState: KeyringControllerMemState;
        importedAccountAddress: string;
    }>;
    /**
     * Removes an account from keyring state.
     *
     * @param address - Address of the account to remove.
     * @fires KeyringController:accountRemoved
     * @returns Promise resolving current state when this account removal completes.
     */
    removeAccount(address: Hex): Promise<KeyringControllerMemState>;
    /**
     * Deallocates all secrets and locks the wallet.
     *
     * @returns Promise resolving to current state.
     */
    setLocked(): Promise<KeyringControllerMemState>;
    /**
     * Signs message by calling down into a specific keyring.
     *
     * @param messageParams - PersonalMessageParams object to sign.
     * @returns Promise resolving to a signed message string.
     */
    signMessage(messageParams: PersonalMessageParams): Promise<string>;
    /**
     * Signs personal message by calling down into a specific keyring.
     *
     * @param messageParams - PersonalMessageParams object to sign.
     * @returns Promise resolving to a signed message string.
     */
    signPersonalMessage(messageParams: PersonalMessageParams): Promise<string>;
    /**
     * Signs typed message by calling down into a specific keyring.
     *
     * @param messageParams - TypedMessageParams object to sign.
     * @param version - Compatibility version EIP712.
     * @throws Will throw when passed an unrecognized version.
     * @returns Promise resolving to a signed message string or an error if any.
     */
    signTypedMessage(messageParams: TypedMessageParams, version: SignTypedDataVersion): Promise<string>;
    /**
     * Signs a transaction by calling down into a specific keyring.
     *
     * @param transaction - Transaction object to sign. Must be a `ethereumjs-tx` transaction instance.
     * @param from - Address to sign from, should be in keychain.
     * @param opts - An optional options object.
     * @returns Promise resolving to a signed transaction string.
     */
    signTransaction(transaction: TypedTransaction, from: string, opts?: Record<string, unknown>): Promise<TxData>;
    /**
     * Convert a base transaction to a base UserOperation.
     *
     * @param from - Address of the sender.
     * @param transactions - Base transactions to include in the UserOperation.
     * @returns A pseudo-UserOperation that can be used to construct a real.
     */
    prepareUserOperation(from: string, transactions: EthBaseTransaction[]): Promise<EthBaseUserOperation>;
    /**
     * Patches properties of a UserOperation. Currently, only the
     * `paymasterAndData` can be patched.
     *
     * @param from - Address of the sender.
     * @param userOp - UserOperation to patch.
     * @returns A patch to apply to the UserOperation.
     */
    patchUserOperation(from: string, userOp: EthUserOperation): Promise<EthUserOperationPatch>;
    /**
     * Signs an UserOperation.
     *
     * @param from - Address of the sender.
     * @param userOp - UserOperation to sign.
     * @returns The signature of the UserOperation.
     */
    signUserOperation(from: string, userOp: EthUserOperation): Promise<string>;
    /**
     * Attempts to decrypt the current vault and load its keyrings,
     * using the given encryption key and salt.
     *
     * @param encryptionKey - Key to unlock the keychain.
     * @param encryptionSalt - Salt to unlock the keychain.
     * @returns Promise resolving to the current state.
     */
    submitEncryptionKey(encryptionKey: string, encryptionSalt: string): Promise<KeyringControllerMemState>;
    /**
     * Attempts to decrypt the current vault and load its keyrings,
     * using the given password.
     *
     * @param password - Password to unlock the keychain.
     * @returns Promise resolving to the current state.
     */
    submitPassword(password: string): Promise<KeyringControllerMemState>;
    /**
     * Verifies the that the seed phrase restores the current keychain's accounts.
     *
     * @returns Promise resolving to the seed phrase as Uint8Array.
     */
    verifySeedPhrase(): Promise<Uint8Array>;
    /**
     * Get QR Hardware keyring.
     *
     * @returns The QR Keyring if defined, otherwise undefined
     */
    getQRKeyring(): QRKeyring | undefined;
    /**
     * Get QR hardware keyring. If it doesn't exist, add it.
     *
     * @returns The added keyring
     */
    getOrAddQRKeyring(): Promise<QRKeyring>;
    restoreQRKeyring(serialized: any): Promise<void>;
    resetQRKeyringState(): Promise<void>;
    getQRKeyringState(): Promise<IQRKeyringState>;
    submitQRCryptoHDKey(cryptoHDKey: string): Promise<void>;
    submitQRCryptoAccount(cryptoAccount: string): Promise<void>;
    submitQRSignature(requestId: string, ethSignature: string): Promise<void>;
    cancelQRSignRequest(): Promise<void>;
    /**
     * Cancels qr keyring sync.
     */
    cancelQRSynchronization(): Promise<void>;
    connectQRHardware(page: number): Promise<{
        balance: string;
        address: string;
        index: number;
    }[]>;
    unlockQRHardwareWalletAccount(index: number): Promise<void>;
    getAccountKeyringType(account: string): Promise<string>;
    forgetQRDevice(): Promise<{
        removedAccounts: string[];
        remainingAccounts: string[];
    }>;
}
export default KeyringController;
//# sourceMappingURL=KeyringController.d.ts.map