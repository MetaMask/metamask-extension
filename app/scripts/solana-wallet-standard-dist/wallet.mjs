var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _MetamaskWallet_instances, _MetamaskWallet_listeners, _MetamaskWallet_selectedAddressOnPageLoadPromise, _MetamaskWallet_account, _MetamaskWallet_removeAccountsChangedListener, _MetamaskWallet_on, _MetamaskWallet_emit, _MetamaskWallet_off, _MetamaskWallet_connect, _MetamaskWallet_signIn, _MetamaskWallet_disconnect, _MetamaskWallet_signAndSendTransaction, _MetamaskWallet_signTransaction, _MetamaskWallet_signMessage, _MetamaskWallet_handleAccountsChangedEvent, _MetamaskWallet_getAccountFromAddress, _MetamaskWallet_validateSendTransactionInput, _MetamaskWallet_tryRestoringSession, _MetamaskWallet_createSession;
import { SOLANA_DEVNET_CHAIN, SOLANA_MAINNET_CHAIN, SOLANA_TESTNET_CHAIN } from "@solana/wallet-standard-chains";
import { SolanaSignAndSendTransaction, SolanaSignIn, SolanaSignMessage, SolanaSignTransaction } from "@solana/wallet-standard-features";
import { StandardConnect, StandardDisconnect, StandardEvents } from "@wallet-standard/features";
import { ReadonlyWalletAccount } from "@wallet-standard/wallet";
import bs58 from "bs58";
import { metamaskIcon } from "./icon.mjs";
import { Scope } from "./types.mjs";
import { getAddressFromCaipAccountId, getNonSolanaSessionScopes, getScopeFromWalletStandardChain, isAccountChangedEvent } from "./utils.mjs";
export class MetamaskWalletAccount extends ReadonlyWalletAccount {
    constructor({ address, publicKey, chains }) {
        const features = [
            SolanaSignAndSendTransaction,
            SolanaSignTransaction,
            SolanaSignMessage,
            SolanaSignIn,
        ];
        super({ address, publicKey, chains, features });
        if (new.target === MetamaskWalletAccount) {
            Object.freeze(this);
        }
    }
}
export class MetamaskWallet {
    /**
     * Listen for up to 2 seconds to the accountsChanged event emitted on page load
     * @returns If any, the initial selected address
     */
    getInitialSelectedAddress() {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(undefined);
            }, 2000);
            const handleAccountChange = (data) => {
                if (isAccountChangedEvent(data)) {
                    const address = data?.params?.notification?.params?.[0];
                    if (address) {
                        clearTimeout(timeout);
                        removeNotification?.();
                        resolve(address);
                    }
                }
            };
            const removeNotification = this.client.onNotification(handleAccountChange);
        });
    }
    get accounts() {
        return __classPrivateFieldGet(this, _MetamaskWallet_account, "f") ? [__classPrivateFieldGet(this, _MetamaskWallet_account, "f")] : [];
    }
    get features() {
        return {
            [StandardConnect]: {
                version: this.version,
                connect: __classPrivateFieldGet(this, _MetamaskWallet_connect, "f"),
            },
            [SolanaSignIn]: {
                version: this.version,
                signIn: __classPrivateFieldGet(this, _MetamaskWallet_signIn, "f"),
            },
            [StandardDisconnect]: {
                version: this.version,
                disconnect: __classPrivateFieldGet(this, _MetamaskWallet_disconnect, "f"),
            },
            [StandardEvents]: {
                version: this.version,
                on: __classPrivateFieldGet(this, _MetamaskWallet_on, "f"),
            },
            [SolanaSignAndSendTransaction]: {
                version: this.version,
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: __classPrivateFieldGet(this, _MetamaskWallet_signAndSendTransaction, "f"),
            },
            [SolanaSignTransaction]: {
                version: this.version,
                supportedTransactionVersions: ['legacy', 0],
                signTransaction: __classPrivateFieldGet(this, _MetamaskWallet_signTransaction, "f"),
            },
            [SolanaSignMessage]: {
                version: this.version,
                signMessage: __classPrivateFieldGet(this, _MetamaskWallet_signMessage, "f"),
            },
        };
    }
    constructor({ client, walletName }) {
        _MetamaskWallet_instances.add(this);
        _MetamaskWallet_listeners.set(this, {});
        this.version = '1.0.0';
        this.icon = metamaskIcon;
        this.chains = [SOLANA_MAINNET_CHAIN, SOLANA_DEVNET_CHAIN, SOLANA_TESTNET_CHAIN];
        _MetamaskWallet_selectedAddressOnPageLoadPromise.set(this, void 0);
        _MetamaskWallet_account.set(this, void 0);
        _MetamaskWallet_removeAccountsChangedListener.set(this, void 0);
        _MetamaskWallet_on.set(this, (event, listener) => {
            if (__classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event]) {
                __classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event]?.push(listener);
            }
            else {
                __classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event] = [listener];
            }
            return () => __classPrivateFieldGet(this, _MetamaskWallet_instances, "m", _MetamaskWallet_off).call(this, event, listener);
        });
        _MetamaskWallet_connect.set(this, async () => {
            if (this.accounts.length) {
                // Already connected
                return { accounts: this.accounts };
            }
            // Try restoring session
            await __classPrivateFieldGet(this, _MetamaskWallet_tryRestoringSession, "f").call(this);
            // Otherwise create a session on Mainnet by default
            if (!this.accounts.length) {
                await __classPrivateFieldGet(this, _MetamaskWallet_createSession, "f").call(this, Scope.MAINNET);
            }
            // In case user didn't select any Solana scope/account, return
            if (!this.accounts.length) {
                return { accounts: [] };
            }
            __classPrivateFieldSet(this, _MetamaskWallet_removeAccountsChangedListener, this.client.onNotification(__classPrivateFieldGet(this, _MetamaskWallet_instances, "m", _MetamaskWallet_handleAccountsChangedEvent).bind(this)), "f");
            return { accounts: this.accounts };
        });
        _MetamaskWallet_signIn.set(this, async (...inputs) => {
            if (!__classPrivateFieldGet(this, _MetamaskWallet_account, "f") || !this.scope) {
                await __classPrivateFieldGet(this, _MetamaskWallet_connect, "f").call(this);
                if (!__classPrivateFieldGet(this, _MetamaskWallet_account, "f") || !this.scope) {
                    throw new Error('Not connected');
                }
            }
            const results = [];
            for (const input of inputs) {
                const signInRes = await this.client.invokeMethod({
                    scope: this.scope,
                    request: {
                        method: 'signIn',
                        params: {
                            ...input,
                            domain: input.domain || window.location.host,
                            address: input.address || __classPrivateFieldGet(this, _MetamaskWallet_account, "f").address,
                        },
                    },
                });
                results.push({
                    account: __classPrivateFieldGet(this, _MetamaskWallet_account, "f"),
                    signedMessage: Buffer.from(signInRes.signedMessage, 'base64'),
                    signature: bs58.decode(signInRes.signature),
                });
            }
            return results;
        });
        _MetamaskWallet_disconnect.set(this, async () => {
            __classPrivateFieldSet(this, _MetamaskWallet_account, undefined, "f");
            this.scope = undefined;
            __classPrivateFieldGet(this, _MetamaskWallet_removeAccountsChangedListener, "f")?.call(this);
            __classPrivateFieldSet(this, _MetamaskWallet_removeAccountsChangedListener, undefined, "f");
            __classPrivateFieldGet(this, _MetamaskWallet_instances, "m", _MetamaskWallet_emit).call(this, 'change', { accounts: this.accounts });
            await this.client.revokeSession();
        });
        _MetamaskWallet_signAndSendTransaction.set(this, async (...inputs) => {
            const account = __classPrivateFieldGet(this, _MetamaskWallet_account, "f");
            if (!account) {
                throw new Error('Not connected');
            }
            __classPrivateFieldGet(this, _MetamaskWallet_validateSendTransactionInput, "f").call(this, inputs);
            const scope = getScopeFromWalletStandardChain(inputs[0]?.chain);
            const session = await this.client.getSession();
            const sessionAccounts = session?.sessionScopes[scope]?.accounts;
            // Update session if account isn't permissioned for this scope
            if (sessionAccounts?.includes(`${scope}:${account.address}`)) {
                this.scope = scope;
            }
            else {
                // Create the session with only the devnet scope, to protect users from accidentally signing transactions on mainnet
                await __classPrivateFieldGet(this, _MetamaskWallet_createSession, "f").call(this, scope, [account.address]);
            }
            const results = [];
            for (const { transaction: transactionBuffer, account } of inputs) {
                const transaction = Buffer.from(transactionBuffer).toString('base64');
                const signAndSendTransactionRes = await this.client.invokeMethod({
                    scope,
                    request: {
                        method: 'signAndSendTransaction',
                        params: {
                            account: { address: account.address },
                            transaction,
                            scope,
                        },
                    },
                });
                results.push({
                    signature: bs58.decode(signAndSendTransactionRes.signature),
                });
            }
            return results;
        });
        _MetamaskWallet_signTransaction.set(this, async (...inputs) => {
            if (!this.scope) {
                throw new Error('Not connected');
            }
            const results = [];
            for (const { transaction: transactionBuffer, account } of inputs) {
                const transaction = Buffer.from(transactionBuffer).toString('base64');
                const signTransactionRes = await this.client.invokeMethod({
                    scope: this.scope,
                    request: {
                        method: 'signTransaction',
                        params: {
                            account: { address: account.address },
                            transaction,
                            scope: this.scope,
                        },
                    },
                });
                results.push({
                    signedTransaction: Uint8Array.from(Buffer.from(signTransactionRes.signedTransaction, 'base64')),
                });
            }
            return results;
        });
        _MetamaskWallet_signMessage.set(this, async (...inputs) => {
            if (!this.scope) {
                throw new Error('Not connected');
            }
            const results = [];
            for (const { message: messageBuffer, account } of inputs) {
                const message = Buffer.from(messageBuffer).toString('base64');
                const signMessageRes = await this.client.invokeMethod({
                    scope: this.scope,
                    request: {
                        method: 'signMessage',
                        params: {
                            message,
                            account: { address: account.address },
                        },
                    },
                });
                results.push({
                    signedMessage: Buffer.from(signMessageRes.signedMessage, 'base64'),
                    signature: bs58.decode(signMessageRes.signature),
                    signatureType: signMessageRes.signatureType,
                });
            }
            return results;
        });
        _MetamaskWallet_validateSendTransactionInput.set(this, (inputs) => {
            const accountAddress = __classPrivateFieldGet(this, _MetamaskWallet_account, "f")?.address;
            const firstChain = inputs[0]?.chain;
            for (const { account: { address: transactionAddress }, chain, } of inputs) {
                // Verify all transactions are on the same and connected account
                if (transactionAddress !== accountAddress) {
                    throw new Error('Invalid transaction addresses');
                }
                // Verify all transactions are on the same chain
                if (chain !== firstChain) {
                    throw new Error('All transactions must be on the same chain');
                }
            }
        });
        _MetamaskWallet_tryRestoringSession.set(this, async () => {
            try {
                const existingSession = await this.client.getSession();
                if (!existingSession) {
                    return;
                }
                // Get the account from accountChanged emitted on page load, if any
                const account = await __classPrivateFieldGet(this, _MetamaskWallet_selectedAddressOnPageLoadPromise, "f");
                this.updateSession(existingSession, account);
            }
            catch (error) {
                console.warn('Error restoring session', error);
            }
        });
        _MetamaskWallet_createSession.set(this, async (scope, addresses) => {
            let resolvePromise;
            const waitForAccountChangedPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            // If there are multiple accounts, wait for the first accountChanged event to know which one to use
            const handleAccountChange = (data) => {
                if (!isAccountChangedEvent(data)) {
                    return;
                }
                const selectedAddress = data?.params?.notification?.params?.[0];
                if (selectedAddress) {
                    removeNotification();
                    resolvePromise(selectedAddress);
                }
            };
            const removeNotification = this.client.onNotification(handleAccountChange);
            // Get non-solana scopes to preserve them when creating new session. Relevant on Multichain dApps only.
            const nonSolanaSessionScopes = getNonSolanaSessionScopes(await this.client.getSession());
            const session = await this.client.createSession({
                optionalScopes: {
                    ...nonSolanaSessionScopes,
                    [scope]: {
                        ...(addresses ? { accounts: addresses.map((address) => `${scope}:${address}`) } : {}),
                        methods: [],
                        notifications: [],
                    },
                },
                sessionProperties: {
                    solana_accountChanged_notifications: true,
                },
            });
            // Wait for the accountChanged event to know which one to use, timeout after 200ms
            const selectedAddress = await Promise.race([
                waitForAccountChangedPromise,
                new Promise((resolve) => setTimeout(() => resolve(undefined), 200)),
            ]);
            this.updateSession(session, selectedAddress);
        });
        this.client = client;
        this.name = `${walletName ?? 'MetaMask'}`;
        __classPrivateFieldSet(this, _MetamaskWallet_selectedAddressOnPageLoadPromise, this.getInitialSelectedAddress(), "f");
    }
    /**
     * Updates the session and the account to connect to.
     * This method handles the logic for selecting the appropriate Solana network scope (mainnet/devnet/testnet)
     * and account to connect to based on the following priority:
     * 1. First tries to find an available scope in order: mainnet > devnet > testnet, supposing the same set of accounts
     *    is available for all Solana scopes
     * 2. For account selection:
     *    - First tries to use the selectedAddress param, most likely coming from the accountsChanged event
     *    - Falls back to the previously saved account if it exists in the scope
     *    - Finally defaults to the first account in the scope
     *
     * @param session - The session data containing available scopes and accounts
     * @param selectedAddress - The address that was selected by the user, if any
     */
    updateSession(session, selectedAddress) {
        // Get session scopes
        const sessionScopes = new Set(Object.keys(session?.sessionScopes ?? {}));
        // Find the first available scope in priority order: mainnet > devnet > testnet.
        const scopePriorityOrder = [Scope.MAINNET, Scope.DEVNET, Scope.TESTNET];
        const scope = scopePriorityOrder.find((scope) => sessionScopes.has(scope));
        // If no scope is available, don't disconnect so that we can create/update a new session
        if (!scope) {
            __classPrivateFieldSet(this, _MetamaskWallet_account, undefined, "f");
            return;
        }
        const scopeAccounts = session?.sessionScopes[scope]?.accounts;
        // In case the Solana scope is available but without any accounts
        // Could happen if the user already created a session using ethereum injected provider for example or the SDK
        // Don't disconnect so that we can create/update a new session
        if (!scopeAccounts?.[0]) {
            __classPrivateFieldSet(this, _MetamaskWallet_account, undefined, "f");
            return;
        }
        let addressToConnect;
        // Try to use selectedAddress
        if (selectedAddress && scopeAccounts.includes(`${scope}:${selectedAddress}`)) {
            addressToConnect = selectedAddress;
        }
        // Otherwise try to use the previously saved address in this.#account
        else if (__classPrivateFieldGet(this, _MetamaskWallet_account, "f")?.address && scopeAccounts.includes(`${scope}:${__classPrivateFieldGet(this, _MetamaskWallet_account, "f")?.address}`)) {
            addressToConnect = __classPrivateFieldGet(this, _MetamaskWallet_account, "f").address;
        }
        // Otherwise select first account
        else {
            addressToConnect = getAddressFromCaipAccountId(scopeAccounts[0]);
        }
        // Update the account and scope
        __classPrivateFieldSet(this, _MetamaskWallet_account, __classPrivateFieldGet(this, _MetamaskWallet_instances, "m", _MetamaskWallet_getAccountFromAddress).call(this, addressToConnect), "f");
        this.scope = scope;
        __classPrivateFieldGet(this, _MetamaskWallet_instances, "m", _MetamaskWallet_emit).call(this, 'change', { accounts: this.accounts });
    }
}
_MetamaskWallet_listeners = new WeakMap(), _MetamaskWallet_selectedAddressOnPageLoadPromise = new WeakMap(), _MetamaskWallet_account = new WeakMap(), _MetamaskWallet_removeAccountsChangedListener = new WeakMap(), _MetamaskWallet_on = new WeakMap(), _MetamaskWallet_connect = new WeakMap(), _MetamaskWallet_signIn = new WeakMap(), _MetamaskWallet_disconnect = new WeakMap(), _MetamaskWallet_signAndSendTransaction = new WeakMap(), _MetamaskWallet_signTransaction = new WeakMap(), _MetamaskWallet_signMessage = new WeakMap(), _MetamaskWallet_validateSendTransactionInput = new WeakMap(), _MetamaskWallet_tryRestoringSession = new WeakMap(), _MetamaskWallet_createSession = new WeakMap(), _MetamaskWallet_instances = new WeakSet(), _MetamaskWallet_emit = function _MetamaskWallet_emit(event, ...args) {
    for (const listener of __classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event] ?? []) {
        listener.apply(null, args);
    }
}, _MetamaskWallet_off = function _MetamaskWallet_off(event, listener) {
    __classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event] = __classPrivateFieldGet(this, _MetamaskWallet_listeners, "f")[event]?.filter((existingListener) => listener !== existingListener);
}, _MetamaskWallet_handleAccountsChangedEvent = 
/**
 * Handles the accountsChanged event.
 * @param data - The event data
 */
async function _MetamaskWallet_handleAccountsChangedEvent(data) {
    if (!isAccountChangedEvent(data)) {
        return;
    }
    const addressToSelect = data?.params?.notification?.params?.[0];
    // If no address is provided, disconnect
    if (!addressToSelect) {
        await __classPrivateFieldGet(this, _MetamaskWallet_disconnect, "f").call(this);
        return;
    }
    const session = await this.client.getSession();
    this.updateSession(session, addressToSelect);
}, _MetamaskWallet_getAccountFromAddress = function _MetamaskWallet_getAccountFromAddress(address) {
    return new MetamaskWalletAccount({
        address,
        publicKey: new Uint8Array(bs58.decode(address)),
        chains: this.chains,
    });
};
//# sourceMappingURL=wallet.mjs.map