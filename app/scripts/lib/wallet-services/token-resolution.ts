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
 * getERC20TokenInfo, getTokenStandardAndDetails, getBalancesInSingleCall
 */

import log from 'loglevel';
import { ERC1155, ERC20, ERC721 } from '@metamask/controller-utils';
import type { Provider } from '@metamask/network-controller';
import {
  fetchTokenBalance,
  fetchERC1155Balance,
} from '../../../../shared/lib/token-util';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';

/**
 * Subset of the Messenger interface required by token-resolution.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call overloads.
 *
 * Promotion path: replace with RestrictedMessenger from @metamask/base-controller
 * when extracting to a published package.
 */
type TokenResolutionMessenger = {
  call(
    action: 'AssetsContractController:getTokenStandardAndDetails',
    tokenAddress: string,
    userAddress?: string,
    tokenId?: string,
  ): Promise<{
    standard: string;
    symbol?: string;
    decimals?: string | number;
    balance?: string | number;
  }>;
  call(
    action: 'AssetsContractController:getBalancesInSingleCall',
    tokenAddresses: string[],
    userAddress: string,
  ): Promise<Record<string, string>>;
  call(
    action: 'AssetsContractController:getERC20TokenInfo',
    tokenAddress: string,
  ): Promise<{ symbol: string; decimals: number; name: string }>;
  call(action: 'NetworkController:getState'): {
    selectedNetworkClientId: string;
  };
  call(
    action: 'NetworkController:getNetworkClientById',
    networkClientId: string,
  ): { configuration: { chainId: string } };
  call(action: 'TokenListController:getState'): {
    tokensChainsCache?: Record<
      string,
      {
        data: Record<
          string,
          {
            symbol?: string;
            decimals?: number;
            standard?: string;
            erc20?: boolean;
            erc721?: boolean;
          }
        >;
      }
    >;
  };
  call(action: 'TokensController:getState'): {
    allTokens?: Record<
      string,
      Record<
        string,
        {
          address: string;
          symbol?: string;
          decimals?: number;
          standard?: string;
        }[]
      >
    >;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerActionHandler(name: string, handler: (...args: any[]) => any): void;
};

export type TokenResolutionDependencies = {
  messenger: TokenResolutionMessenger;
  getProvider: () => Provider;
};

/**
 * Detects the ERC standard (ERC-20, ERC-721, ERC-1155) for a contract
 * address and returns token metadata.
 *
 * Extracted from MetamaskController.getTokenStandardAndDetails.
 *
 * @param deps
 * @param address
 * @param userAddress
 * @param tokenId
 */
export async function getTokenStandardAndDetails(
  deps: TokenResolutionDependencies,
  address: string,
  userAddress: string,
  tokenId?: string,
): Promise<{
  standard?: string;
  symbol?: string;
  decimals?: string;
  balance?: string;
}> {
  const { selectedNetworkClientId } = deps.messenger.call(
    'NetworkController:getState',
  );
  const {
    configuration: { chainId: currentChainId },
  } = deps.messenger.call(
    'NetworkController:getNetworkClientById',
    selectedNetworkClientId,
  );

  const { tokensChainsCache } = deps.messenger.call(
    'TokenListController:getState',
  );
  const tokenList = tokensChainsCache?.[currentChainId]?.data || {};

  const { allTokens } = deps.messenger.call('TokensController:getState');
  const tokens = allTokens?.[currentChainId]?.[userAddress] || [];

  const staticTokenListDetails =
    (STATIC_MAINNET_TOKEN_LIST as Record<string, unknown>)[
      address?.toLowerCase()
    ] || {};
  const tokenListDetails = tokenList[address?.toLowerCase()] || {};
  const userDefinedTokenDetails =
    tokens.find(({ address: _address }) =>
      isEqualCaseInsensitive(_address, address),
    ) || {};

  const tokenDetails = {
    ...(staticTokenListDetails as Record<string, unknown>),
    ...(tokenListDetails as Record<string, unknown>),
    ...(userDefinedTokenDetails as Record<string, unknown>),
  } as {
    standard?: string;
    symbol?: string;
    decimals?: number;
    erc20?: boolean;
    erc721?: boolean;
    balance?: string | number;
  };

  const tokenDetailsStandardIsERC20 =
    isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC20) ||
    tokenDetails.erc20 === true;

  const noEvidenceThatTokenIsAnNFT =
    !tokenId &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC1155) &&
    !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC721) &&
    !tokenDetails.erc721;

  const otherDetailsAreERC20Like =
    tokenDetails.decimals !== undefined && tokenDetails.symbol;

  const tokenCanBeTreatedAsAnERC20 =
    tokenDetailsStandardIsERC20 ||
    (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

  let details:
    | {
        address?: string;
        balance?: string | number | null;
        standard?: string;
        decimals?: string | number;
        symbol?: string;
      }
    | undefined;

  if (tokenCanBeTreatedAsAnERC20) {
    try {
      const balance = userAddress
        ? await fetchTokenBalance(address, userAddress, deps.getProvider())
        : undefined;

      details = {
        address,
        balance,
        standard: ERC20,
        decimals: tokenDetails.decimals,
        symbol: tokenDetails.symbol,
      };
    } catch (e) {
      log.warn(`Failed to get token balance. Error: ${e}`);
    }
  }

  if (details === undefined) {
    try {
      details = await deps.messenger.call(
        'AssetsContractController:getTokenStandardAndDetails',
        address,
        userAddress,
        tokenId,
      );
    } catch (e) {
      log.warn(`Failed to get token standard and details. Error: ${e}`);
    }
  }

  if (details) {
    const tokenDetailsStandardIsERC1155 = isEqualCaseInsensitive(
      details.standard ?? '',
      ERC1155,
    );

    if (tokenDetailsStandardIsERC1155) {
      try {
        const balance = await fetchERC1155Balance(
          address,
          userAddress,
          tokenId ?? '',
          deps.getProvider(),
        );

        const balanceToUse = (balance as { _hex?: string })?._hex
          ? parseInt((balance as { _hex: string })._hex, 16).toString()
          : null;

        details = {
          ...details,
          balance: balanceToUse,
        };
      } catch (e) {
        log.warn('Failed to get token balance. Error:', e);
      }
    }
  }

  return {
    ...details,
    decimals: details?.decimals?.toString(10),
    balance: details?.balance?.toString(10),
  };
}

/**
 * Returns the token symbol for a contract address.
 * Falls back to null on any error.
 *
 * Extracted from MetamaskController.getTokenSymbol.
 *
 * @param deps
 * @param address
 */
export async function getTokenSymbol(
  deps: TokenResolutionDependencies,
  address: string,
): Promise<string | null> {
  try {
    const details = await deps.messenger.call(
      'AssetsContractController:getTokenStandardAndDetails',
      address,
    );
    return details?.symbol ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns ERC-20 token balances for multiple tokens in a single RPC call
 * using the batch balance checker contract.
 *
 * Extracted from MetamaskController.getBalancesInSingleCall.
 *
 * @param deps
 * @param tokenAddresses
 * @param userAddress
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
 * @param deps
 * @param tokenAddress
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
  getTokenSymbol: 'TokenResolution:getTokenSymbol',
} as const;

/**
 * Registers all token-resolution functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 * @param messenger
 * @param getProvider - Lazy getter for the current provider (defaults to no-op).
 *   In production, MC overrides these handlers with closures that supply the
 *   live provider. The default no-op is never reached in practice.
 */
export function registerActions(
  messenger: TokenResolutionMessenger,
  getProvider: () => Provider = () => null as unknown as Provider,
): void {
  const deps: TokenResolutionDependencies = { messenger, getProvider };
  messenger.registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getTokenStandardAndDetails,
    (tokenAddress: string, userAddress: string, tokenId?: string) =>
      getTokenStandardAndDetails(deps, tokenAddress, userAddress, tokenId),
  );
  messenger.registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getBalancesInSingleCall,
    (tokenAddresses: string[], userAddress: string) =>
      getBalancesInSingleCall(deps, tokenAddresses, userAddress),
  );
  messenger.registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getERC20TokenInfo,
    (tokenAddress: string) => getERC20TokenInfo(deps, tokenAddress),
  );
  messenger.registerActionHandler(
    TOKEN_RESOLUTION_ACTIONS.getTokenSymbol,
    (tokenAddress: string) => getTokenSymbol(deps, tokenAddress),
  );
}
