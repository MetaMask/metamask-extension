import type { CaipAssetType, Hex } from '@metamask/utils';
import { isStrictHexString, parseCaipAssetType } from '@metamask/utils';
import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
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

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hour

const CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000; // 1 hour

const TOP_X = 10;

const OCCURRENCE_FLOOR = 2;

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
  | AccountsControllerGetSelectedAccountAction
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
  /** Default interval for chains not specified in chainPollingIntervals */
  interval?: number;
  /** The supported chains for the controller. */
  supportedChains?: string[];
};

/**
 * The top asset type.
 *
 * @see https://tokens.api.cx.metamask.io/v3/chains/eip155:999/assets
 *
 * This is the type of the top assets that are fetched from the API.
 * It is used to transform the top assets to tokens.
 */
type TopAsset = {
  iconUrl: string;
  assetId: CaipAssetType;
  symbol: string;
  decimals: number;
  name: string;
  aggregators: string[];
  occurrences: number;
  metadata: Record<string, unknown>;
};

/**
 * Fetch top assets for a chain from the API.
 *
 * @param params - The parameters for the fetch.
 * @param params.chainId - The chain ID.
 * @param params.topX - The number of top assets to fetch.
 * @param params.occurrenceFloor - The occurrence floor.
 * @returns The top assets.
 */
async function fetchTopAssets({
  chainId,
  topX,
  occurrenceFloor,
}: {
  chainId: string;
  topX: number;
  occurrenceFloor: number;
}): Promise<TopAsset[]> {
  try {
    if (!isStrictHexString(chainId)) {
      return [];
    }

    const caip2ChainId = toEvmCaipChainId(chainId);
    const url = new URL(
      `https://tokens.api.cx.metamask.io/v3/chains/${caip2ChainId}/assets`,
    );
    url.searchParams.set('first', topX.toString());
    url.searchParams.set('occurrenceFloor', occurrenceFloor.toString());
    url.searchParams.set('includeAggregators', 'true');
    url.searchParams.set('includeCoingeckoId', 'true');
    url.searchParams.set('includeIconUrl', 'true');
    url.searchParams.set('includeMetadata', 'true');
    url.searchParams.set('includeOccurrences', 'true');

    const response = await fetchWithCache({
      url: url.toString(),
      fetchOptions: { method: 'GET' },
      cacheOptions: { cacheRefreshTime: CACHE_EXPIRATION_MS },
      functionName: 'fetchTopAssets',
    });
    return response.data;
  } catch (error) {
    // we return an empty array if the fetch top assets fails
    return [];
  }
}

function buildImageUrl(assetId: CaipAssetType, extension: string): string {
  const caipAssetType = parseCaipAssetType(assetId);
  // Most of the token has migtated to v2, hence, we use v2 instead of v1.
  return `https://static.cx.metamask.io/api/v2/tokenIcons/assets/${caipAssetType.chain.namespace}/${caipAssetType.chain.reference}/${caipAssetType.assetNamespace}/${caipAssetType.assetReference.toLowerCase()}.${extension}`;
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
  /**
   * The supported chains for the controller.
   */
  readonly #supportedChains: Set<string>;

  constructor({
    messenger,
    interval = DEFAULT_INTERVAL_MS,
    supportedChains = [],
  }: StaticAssetsControllerOptions) {
    super({
      name: CONTROLLER,
      messenger,
      metadata: {},
      state: {},
    });
    this.#supportedChains = new Set(supportedChains);
    this.setIntervalLength(interval);
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
    let { iconUrl } = topAsset;
    if (iconUrl) {
      const imgExtension = iconUrl.split('.').pop();
      iconUrl = buildImageUrl(topAsset.assetId, imgExtension ?? 'png');
    }

    return {
      address: parseCaipAssetType(topAsset.assetId).assetReference,
      decimals: topAsset.decimals,
      symbol: topAsset.symbol,
      aggregators: topAsset.aggregators ?? [],
      image: iconUrl,
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
      // findNetworkClientIdByChainId will throw an error if the chainId is not supported.
      // quit early if the network client id is not found
      const networkClientId = await this.messenger.call(
        'NetworkController:findNetworkClientIdByChainId',
        chainId,
      );

      const filteredTokens = await this.#filterIgnoredTokens(
        tokens,
        chainId,
        selectedAccountAddress,
      );

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

    const topAssets = await fetchTopAssets({
      chainId,
      topX: TOP_X,
      occurrenceFloor: OCCURRENCE_FLOOR,
    });

    topAssets.forEach((topAsset) => {
      try {
        const formattedToken = this.#transformTopAsset(topAsset);
        // in case of error, the token is not added to the tokens array.
        tokens.push(formattedToken);
      } catch (error) {
        // we skip the token if the transformTopAsset function fails
      }
    });

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
        !this.#supportedChains.has(chainId) ||
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
