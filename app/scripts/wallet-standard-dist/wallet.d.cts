import type { MultichainApiClient, SessionData } from "@metamask/multichain-api-client";
import { type SolanaChain } from "@solana/wallet-standard-chains";
import { type SolanaSignAndSendTransactionFeature, type SolanaSignInFeature, type SolanaSignMessageFeature, type SolanaSignTransactionFeature } from "@solana/wallet-standard-features";
import type { IdentifierArray, Wallet } from "@wallet-standard/base";
import { type StandardConnectFeature, type StandardDisconnectFeature, type StandardEventsFeature } from "@wallet-standard/features";
import { ReadonlyWalletAccount } from "@wallet-standard/wallet";
import { Scope, type WalletOptions } from "./types.cjs";
export declare class MetamaskWalletAccount extends ReadonlyWalletAccount {
    constructor({ address, publicKey, chains }: {
        address: string;
        publicKey: Uint8Array;
        chains: IdentifierArray;
    });
}
export declare class MetamaskWallet implements Wallet {
    #private;
    readonly version: "1.0.0";
    readonly name: string;
    readonly icon: `data:image/svg+xml;base64,${string}` | `data:image/webp;base64,${string}` | `data:image/png;base64,${string}` | `data:image/gif;base64,${string}`;
    readonly chains: SolanaChain[];
    protected scope: Scope | undefined;
    client: MultichainApiClient;
    /**
     * Listen for up to 2 seconds to the accountsChanged event emitted on page load
     * @returns If any, the initial selected address
     */
    protected getInitialSelectedAddress(): Promise<string | undefined>;
    get accounts(): MetamaskWalletAccount[];
    get features(): StandardConnectFeature & SolanaSignInFeature & StandardDisconnectFeature & StandardEventsFeature & SolanaSignAndSendTransactionFeature & SolanaSignTransactionFeature & SolanaSignMessageFeature;
    constructor({ client, walletName }: WalletOptions);
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
    protected updateSession(session: SessionData | undefined, selectedAddress: string | undefined): void;
}
//# sourceMappingURL=wallet.d.cts.map