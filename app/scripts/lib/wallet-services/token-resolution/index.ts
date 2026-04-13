/**
 * token-resolution
 *
 * Contract standard detection and token metadata resolution via
 * AssetsContractController. No chrome.* / browser.* imports.
 *
 * Smallest cross-client module (277 lines, 3 methods). Recommended as the
 * pilot extraction to validate the wallet-services pattern and ESLint
 * import constraint before tackling larger modules.
 *
 * Methods (3 total):
 *   getERC20TokenInfo, getTokenStandardAndDetails, getBalancesInSingleCall
 */

import type { RootMessenger } from '../../messenger';

export type TokenResolutionDependencies = {
  messenger: RootMessenger;
};

/**
 * Detects the ERC standard (ERC-20, ERC-721, ERC-1155) for a contract
 * address and returns token metadata.
 *
 * Extracted from MetamaskController.getTokenStandardAndDetails.
 *
 * TODO: Requires messenger action:
 *   - AssetsContractController:getTokenStandardAndDetails
 */
export async function getTokenStandardAndDetails(
  deps: TokenResolutionDependencies,
  tokenAddress: string,
  userAddress: string,
  tokenId?: string,
): Promise<{
  standard: string;
  symbol?: string;
  decimals?: string;
  balance?: string;
}> {
  return deps.messenger.call(
    'AssetsContractController:getTokenStandardAndDetails',
    tokenAddress,
    userAddress,
    tokenId,
  );
}

/**
 * Returns ERC-20 token balances for multiple tokens in a single RPC call
 * using the batch balance checker contract.
 *
 * Extracted from MetamaskController.getBalancesInSingleCall.
 *
 * TODO: Requires messenger action:
 *   - AssetsContractController:getBalancesInSingleCall
 */
export async function getBalancesInSingleCall(
  deps: TokenResolutionDependencies,
  tokenAddresses: string[],
  userAddress: string,
): Promise<Record<string, string>> {
  return deps.messenger.call(
    'AssetsContractController:getBalancesInSingleCall',
    tokenAddresses,
    userAddress,
  );
}

/**
 * Returns basic ERC-20 token metadata (symbol, decimals, name).
 *
 * Extracted from MetamaskController.getERC20TokenInfo.
 *
 * TODO: Requires messenger action:
 *   - AssetsContractController:getERC20TokenInfo
 */
export async function getERC20TokenInfo(
  deps: TokenResolutionDependencies,
  tokenAddress: string,
): Promise<{ symbol: string; decimals: number; name: string }> {
  return deps.messenger.call(
    'AssetsContractController:getERC20TokenInfo',
    tokenAddress,
  );
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for token-resolution messenger actions. */
export const TOKEN_RESOLUTION_ACTIONS = {
  getTokenStandardAndDetails: 'TokenResolution:getTokenStandardAndDetails',
  getBalancesInSingleCall: 'TokenResolution:getBalancesInSingleCall',
  getERC20TokenInfo: 'TokenResolution:getERC20TokenInfo',
} as const;

/**
 * Registers all token-resolution functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: TokenResolutionDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add TokenResolutionActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getTokenStandardAndDetails,
    (tokenAddress: string, userAddress: string, tokenId?: string) =>
      getTokenStandardAndDetails(deps, tokenAddress, userAddress, tokenId),
  );
  (messenger as never).registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getBalancesInSingleCall,
    (tokenAddresses: string[], userAddress: string) =>
      getBalancesInSingleCall(deps, tokenAddresses, userAddress),
  );
  (messenger as never).registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getERC20TokenInfo,
    (tokenAddress: string) => getERC20TokenInfo(deps, tokenAddress),
  );
}
