import type { CaipAssetType, Hex } from '@metamask/utils';
import { isStrictHexString, parseCaipAssetType } from '@metamask/utils';
import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type { NetworkControllerFindNetworkClientIdByChainIdAction } from '@metamask/network-controller';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import type {
  TokensControllerAddTokensAction,
  TokensControllerGetStateAction,
  Token,
} from '@metamask/assets-controllers';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';

import fetchWithCache from '../../../shared/lib/fetch-with-cache';

const CONTROLLER = 'StaticAssetsController' as const;

export const DEFAULT_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hour

export const DEFAULT_CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000; // 1 hour

export const DEFAULT_TOP_X = 10;

const STATIC_ASSETS_URL = 'https://static.cx.metamask.io';

const TOKEN_API_BASE_URL = 'https://token.api.cx.metamask.io';

export type StaticAssetsPollingFeatureFlagOptions = {
  /** The supported chains for the controller. */
  supportedChains?: Hex[];
  /** The cache expiration time for the top assets API in milliseconds. */
  cacheExpirationTime?: number;
  /** The top X assets to fetch. */
  topX?: number;
  /** The occurrence floor for the top assets. */
  occurrenceFloor?: Record<string, number>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type StaticAssetsControllerState = {};

export type StaticAssetsControllerGetStateAction = ControllerGetStateAction<
  typeof CONTROLLER,
  StaticAssetsControllerState
>;

export type StaticAssetsControllerActions =
  StaticAssetsControllerGetStateAction;

export type StaticAssetsControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof CONTROLLER,
  StaticAssetsControllerState
>;

export type StaticAssetsControllerEvents =
  StaticAssetsControllerStateChangeEvent;

export type AllowedActions =
  | TokensControllerAddTokensAction
  | TokensControllerGetStateAction
  | NetworkControllerFindNetworkClientIdByChainIdAction;

export type StaticAssetsControllerMessenger = Messenger<
  typeof CONTROLLER,
  StaticAssetsControllerActions | AllowedActions,
  StaticAssetsControllerEvents
>;

export type StaticAssetsControllerOptions = {
  messenger: StaticAssetsControllerMessenger;
  /** The interval for the polling. */
  interval?: number;
  /** The supported chains for the controller. */
  getSupportedChains: () => Set<Hex>;
  /** The cache expiration time for the top assets API in milliseconds. */
  getCacheExpirationTime: () => number;
  /** The top X assets to fetch. */
  getTopX: () => number;
};

/**
 * The top asset type.
 *
 * @see https://token.api.cx.metamask.io/v3/tokens/trending?chainIds=eip155%3A56&minVolume24hUsd=1&minLiquidity=1&minMarketCap=1
 *
 * This is the type of the top assets that are fetched from the API.
 * It is used to transform the top assets to tokens.
 */
type TopAsset = {
  assetId: CaipAssetType;
  symbol: string;
  decimals: number;
  name: string;
};

/**
 * Fetch top assets for a chain from the API.
 *
 * @param params - The parameters for the fetch.
 * @param params.chainId - The chain ID.
 * @param params.cacheExpirationTime - The cache expiration time in milliseconds.
 * @returns The top assets.
 */
async function fetchTopAssets({
  chainId,
  cacheExpirationTime,
}: {
  chainId: string;
  cacheExpirationTime: number;
}): Promise<TopAsset[]> {
  try {
    if (!isStrictHexString(chainId)) {
      return [];
    }
    const caip2ChainId = toEvmCaipChainId(chainId);
    const url = new URL(`${TOKEN_API_BASE_URL}/v3/tokens/trending`);
    url.searchParams.set('chainIds', caip2ChainId);
    // Set the minimum volume, liquidity and market cap to 1 to fetch all tokens.
    url.searchParams.set('minVolume24hUsd', '1');
    url.searchParams.set('minLiquidity', '1');
    url.searchParams.set('minMarketCap', '1');

    const response = await fetchWithCache({
      url: url.toString(),
      fetchOptions: { method: 'GET' },
      cacheOptions: { cacheRefreshTime: cacheExpirationTime },
      functionName: 'fetchTopAssets',
    });
    return response;
  } catch (error) {
    // we return an empty array if the fetch top assets fails
    return [];
  }
}

function buildImageUrl(assetId: CaipAssetType, extension: string): string {
  const caipAssetType = parseCaipAssetType(assetId);
  // Most of the token has migrated to v2, hence, we use v2 instead of v1.
  return `${STATIC_ASSETS_URL}/api/v2/tokenIcons/assets/${caipAssetType.chain.namespace}/${caipAssetType.chain.reference}/${caipAssetType.assetNamespace}/${caipAssetType.assetReference.toLowerCase()}.${extension}`;
}

/**
 * The static assets controller.
 * This controller is responsible for fetching the top assets for a chain and adding them to the TokensController.
 * It is also responsible for filtering out tokens that are in the ignored tokens set.
 */
export class StaticAssetsController extends StaticIntervalPollingController<{
  chainIds: string[];
  selectedAccountAddress: string;
}>()<
  typeof CONTROLLER,
  StaticAssetsControllerState,
  StaticAssetsControllerMessenger
> {
  /** The supported chains for the controller. */
  readonly #getSupportedChains: () => Set<Hex>;

  /** The cache expiration time for the top assets API in milliseconds. */
  readonly #getCacheExpirationTime: () => number;

  /** The top X assets to fetch. */
  readonly #getTopX: () => number;

  constructor({
    messenger,
    interval = DEFAULT_INTERVAL_MS,
    getSupportedChains,
    getCacheExpirationTime,
    getTopX,
  }: StaticAssetsControllerOptions) {
    super({
      name: CONTROLLER,
      messenger,
      metadata: {},
      state: {},
    });
    this.#getSupportedChains = getSupportedChains;

    this.setIntervalLength(interval);

    this.#getCacheExpirationTime = getCacheExpirationTime;

    this.#getTopX = getTopX;
  }

  /**
   * Execute the poll.
   *
   * @param params - The parameters for the poll.
   * @param params.chainIds - The chain IDs to poll.
   * @param params.selectedAccountAddress - The selected account address.
   */
  async _executePoll({
    chainIds,
    selectedAccountAddress,
  }: {
    chainIds: string[];
    selectedAccountAddress: string;
  }): Promise<void> {
    if (!selectedAccountAddress) {
      return;
    }
    // Use Promise.allSettled to wait for all the promises to settle,
    // even if some of chains are rejected.
    await Promise.allSettled(
      chainIds.map((chainId) =>
        this.#addTokensByChainId(chainId, selectedAccountAddress),
      ),
    );
  }

  /**
   * Transform a top asset to a token.
   *
   * @param topAsset - The top asset to transform.
   * @returns The transformed token.
   */
  #transformTopAsset(topAsset: TopAsset): Token {
    return {
      address: parseCaipAssetType(topAsset.assetId).assetReference,
      decimals: topAsset.decimals,
      symbol: topAsset.symbol,
      aggregators: [],
      // Backend Token Processor will always convert the image extension to png.
      // We can assume that the token icon is always using .png extension.
      image: buildImageUrl(topAsset.assetId, 'png'),
      name: topAsset.name,
    };
  }

  /**
   * Fetch top assets for a chain and add them to the TokensController.
   *
   * @param chainId - The chain ID.
   * @param selectedAccountAddress - The selected account address.
   */
  async #addTokensByChainId(
    chainId: string,
    selectedAccountAddress: string,
  ): Promise<void> {
    if (!(await this.#isValidChainId(chainId))) {
      return;
    }

    const tokens = await this.#fetchTopAssets(chainId);
    if (tokens.length > 0) {
      await this.#addTokensToTokensController(
        tokens,
        chainId,
        selectedAccountAddress,
      );
    }
  }

  /**
   * Add the tokens to the TokensController after filtering out tokens that are already in the ignore state.
   *
   * @param tokens - The tokens to add.
   * @param chainId - The chain ID.
   * @param selectedAccountAddress - The selected account address.
   */
  async #addTokensToTokensController(
    tokens: Token[],
    chainId: string,
    selectedAccountAddress: string,
  ): Promise<void> {
    try {
      if (!isStrictHexString(chainId)) {
        return;
      }

      const [networkClientId, filteredTokens] = await Promise.all([
        this.messenger.call(
          'NetworkController:findNetworkClientIdByChainId',
          chainId,
        ),
        this.#filterIgnoredTokens(tokens, chainId, selectedAccountAddress),
      ]);

      // Since we only support EVM chains,
      // we can safely expect the selectedAccountAddress will not change,
      // even user switches account / switches network.
      // Hence, even TokensController:addTokens internally will get the selected account address again,
      // it will be the same address.
      await this.messenger.call(
        'TokensController:addTokens',
        filteredTokens,
        networkClientId,
      );
    } catch (error) {
      console.error(
        `[StaticAssetsController] Error adding tokens to TokensController for chainId ${chainId}`,
        error,
      );
    }
  }

  /**
   * Filter out tokens that are in the ignored tokens set.
   *
   * @param tokens - The tokens to filter.
   * @param chainId - The chain ID.
   * @param selectedAccountAddress - The selected account address.
   * @returns A promise that resolves to the filtered tokens.
   */
  async #filterIgnoredTokens(
    tokens: Token[],
    chainId: Hex,
    selectedAccountAddress: string,
  ): Promise<Token[]> {
    const tokensControllerState = await this.messenger.call(
      'TokensController:getState',
    );

    if (
      !tokensControllerState.allIgnoredTokens ||
      !(chainId in tokensControllerState.allIgnoredTokens)
    ) {
      return tokens;
    }

    const ignoredTokens =
      tokensControllerState.allIgnoredTokens[chainId]?.[
        selectedAccountAddress
      ] ?? [];

    if (ignoredTokens.length === 0) {
      return tokens;
    }

    // convert the ignored tokens to a set of lowercase addresses for lookup.
    const ignoredTokensSet = new Set(
      ignoredTokens.map((token) => token.toLowerCase()),
    );

    // filter out the tokens that are in the ignored tokens set.
    return tokens.filter(
      (token) => !ignoredTokensSet.has(token.address.toLowerCase()),
    );
  }

  /**
   * Fetch top assets for a chain and return the formatted tokens.
   * If the cache is hit, return the cached tokens.
   * If the cache is missed, fetch the top assets from the API.
   *
   * @param chainId - The chain ID.
   * @returns A promise that resolves to the tokens.
   */
  async #fetchTopAssets(chainId: string): Promise<Token[]> {
    const tokens: Token[] = [];
    const topX = this.#getTopX();
    const topAssets = await fetchTopAssets({
      chainId,
      cacheExpirationTime:
        this.#getCacheExpirationTime() ?? DEFAULT_CACHE_EXPIRATION_MS,
    });

    if (topAssets.length > 0) {
      for (const topAsset of topAssets) {
        try {
          const asset = parseCaipAssetType(topAsset.assetId);
          if (
            // skip slip44 tokens.
            asset.assetNamespace === 'slip44' ||
            // skip zero address tokens.
            asset.assetReference ===
              '0x0000000000000000000000000000000000000000' ||
            topAsset.decimals === null // skip tokens with no decimals
          ) {
            continue;
          }
          const formattedToken = this.#transformTopAsset(topAsset);
          // in case of error, the token is not added to the tokens array.
          tokens.push(formattedToken);

          if (tokens.length >= topX) {
            break;
          }
        } catch (error) {
          // we skip the token if the transformTopAsset function fails
        }
      }
    }

    return tokens;
  }

  /**
   * Check if the chain ID is supported and if it has added to the network controller.
   *
   * @param chainId - The chain ID.
   * @returns A promise that resolves to whether the chain ID is valid.
   */
  async #isValidChainId(chainId: string): Promise<boolean> {
    try {
      if (
        !isStrictHexString(chainId) ||
        !this.#getSupportedChains().has(chainId) ||
        // findNetworkClientIdByChainId will throw an error if the chainId is not supported.
        !(await this.messenger.call(
          'NetworkController:findNetworkClientIdByChainId',
          chainId,
        ))
      ) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
