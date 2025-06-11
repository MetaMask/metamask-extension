import type { SessionData } from "@metamask/multichain-api-client";
import { type CaipAccountId, type CaipChainIdStruct, Scope } from "./types.cjs";
export declare const CAIP_ACCOUNT_ID_REGEX: RegExp;
/**
 * Validates and parses a CAIP-10 account ID.
 *
 * @param caipAccountId - The CAIP-10 account ID to validate and parse.
 * @returns The CAIP-10 address.
 */
export declare function getAddressFromCaipAccountId(caipAccountId: CaipAccountId): string;
export declare function getScopeFromWalletStandardChain(chainId: CaipChainIdStruct | undefined): Scope;
/**
 * Get the non-Solana session scopes from a session.
 *
 * @param session - The existing session.
 * @returns The non-Solana session scopes.
 */
export declare function getNonSolanaSessionScopes(session: SessionData | undefined): Record<string, any>;
export declare function isAccountChangedEvent(event: any): boolean;
//# sourceMappingURL=utils.d.cts.map