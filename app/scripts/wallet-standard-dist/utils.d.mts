import { type CaipAccountId, type CaipChainIdStruct, Scope } from "./types.mjs";
export declare const CAIP_ACCOUNT_ID_REGEX: RegExp;
/**
 * Validates and parses a CAIP-10 account ID.
 *
 * @param caipAccountId - The CAIP-10 account ID to validate and parse.
 * @returns The CAIP-10 address.
 */
export declare function getAddressFromCaipAccountId(caipAccountId: CaipAccountId): string;
export declare function getScopeFromWalletStandardChain(chainId: CaipChainIdStruct | undefined): Scope;
export declare function isAccountChangedEvent(event: any): boolean;
//# sourceMappingURL=utils.d.mts.map