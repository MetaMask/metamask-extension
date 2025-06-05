import type { MultichainApiClient } from "@metamask/multichain-api-client";
export type CaipChainIdStruct = `${string}:${string}`;
export type CaipAccountId = `${string}:${string}:${string}`;
export type DeepWriteable<T> = {
    -readonly [P in keyof T]: DeepWriteable<T[P]>;
};
export declare enum Scope {
    MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    TESTNET = "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z"
}
export declare const scopes: Scope[];
export type WalletOptions = {
    client: MultichainApiClient;
    walletName?: string;
};
//# sourceMappingURL=types.d.mts.map