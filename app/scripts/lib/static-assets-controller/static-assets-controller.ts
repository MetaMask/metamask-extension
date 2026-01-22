import type { CaipAssetType, Hex } from '@metamask/utils';
import { isStrictHexString, parseCaipAssetType } from '@metamask/utils';
import type {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerNetworkAddedEvent,
} from '@metamask/network-controller';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import {
  TokensControllerAddTokensAction,
  TokensControllerGetStateAction,
  Token,
} from '@metamask/assets-controllers';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';

const CONTROLLER = 'StaticAssetsController' as const;

const DEFAULT_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hour

const CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000; // 1 hour

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

export type AllowedEvents =
  | NetworkControllerNetworkAddedEvent
  | AccountsControllerSelectedEvmAccountChangeEvent;

export type StaticAssetsControllerMessenger = Messenger<
  typeof CONTROLLER,
  StaticAssetsControllerActions | AllowedActions,
  StaticAssetsControllerEvents | AllowedEvents
>;

export type StaticAssetsControllerOptions = {
  messenger: StaticAssetsControllerMessenger;
  /** Default interval for chains not specified in chainPollingIntervals */
  interval?: number;
  /** The supported chains for the controller. */
  supportedChains?: string[];
};

/**
 * The tokens cache type.
 *
 * This is the cache of the tokens for each chain.
 * The cache is stored in-memory and is not persisted to the state.
 */
type TokensCache = {
  [chainId: string]: {
    data: Token[];
    expiresAt: number;
  };
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
 * @param chainId - The chain ID.
 * @returns The top assets.
 */
async function fetchTopAssets(chainId: string): Promise<TopAsset[]> {
  try {
    if (!isStrictHexString(chainId)) {
      return [];
    }

    const caip2ChainId = toEvmCaipChainId(chainId);
    const url = new URL(
      `https://tokens.api.cx.metamask.io/v3/chains/${caip2ChainId}/assets`,
    );
    url.searchParams.set('first', '10');
    url.searchParams.set('occurrenceFloor', '2');
    url.searchParams.set('includeAggregators', 'true');
    url.searchParams.set('includeCoingeckoId', 'true');
    url.searchParams.set('includeIconUrl', 'true');
    url.searchParams.set('includeMetadata', 'true');
    url.searchParams.set('includeOccurrences', 'true');
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching top assets:', error);
    return [];
  }
}

/**
 * The static assets controller.
 * This controller is responsible for fetching the top assets for a chain and adding them to the TokensController.
 * It is also responsible for filtering out tokens that are in the ignored tokens set.
 */
export class StaticAssetsController extends StaticIntervalPollingController<{
  chainIds: string[];
}>()<
  typeof CONTROLLER,
  StaticAssetsControllerState,
  StaticAssetsControllerMessenger
> {
  /**
   * The supported chains for the controller.
   */
  readonly #supportedChains: Set<string>;

  /**
   * The selected account ID to determine if the selected account has changed.
   */
  #selectedAccountId: string = '';

  /**
   * Cache of tokens for each chain.
   * The cache is stored in-memory and is not persisted to the state.
   */
  #tokensCache: TokensCache = {};

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
    this.#registerEventListeners();
  }

  /**
   * Constructor helper for registering this controller's messenger subscriptions to controller events.
   * This controller will be polled when:
   * - AccountsController:selectedEvmAccountChange event.
   */
  #registerEventListeners(): void {
    // We need this event, as user can add a new account or change the selected account.
    this.messenger.subscribe(
      'AccountsController:selectedEvmAccountChange',
      (selectedAccount) => {
        const isSelectedAccountIdChanged =
          this.#selectedAccountId !== selectedAccount.id;
        if (isSelectedAccountIdChanged) {
          this.#selectedAccountId = selectedAccount.id;
          this._executePoll({
            chainIds: Array.from(this.#supportedChains.values()),
          }).catch((error) => {
            console.error(
              `[StaticAssetsController] Error executing poll via selectedEvmAccountChange event`,
              error,
            );
          });
        }
      },
    );
  }

  /**
   * Execute the poll.
   *
   * @param params - The parameters for the poll.
   * @param params.chainIds - The chain IDs to poll.
   */
  override async _executePoll({
    chainIds,
  }: {
    chainIds: string[];
  }): Promise<void> {
    chainIds.forEach((chainId) => {
      this.#addTokensByChainId(chainId).catch((error) => {
        console.error(
          `[StaticAssetsController] Error adding tokens by chainId ${chainId}`,
          error,
        );
      });
    });
  }

  /**
   * Transform a top asset to a token.
   *
   * @param topAsset - The top asset to transform.
   * @returns The transformed token.
   */
  #transformTopAssets(topAsset: TopAsset): Token {
    return {
      address: parseCaipAssetType(topAsset.assetId).assetReference,
      decimals: topAsset.decimals,
      symbol: topAsset.symbol,
      aggregators: topAsset.aggregators ?? [],
      image: topAsset.iconUrl,
      isERC721: false,
      name: topAsset.name,
    };
  }

  /**
   * Fetch top assets for a chain and add them to the TokensController.
   *
   * @param chainId - The chain ID.
   */
  async #addTokensByChainId(chainId: string): Promise<void> {
    if (!(await this.#isValidChainId(chainId))) {
      return;
    }

    console.log('[StaticAssetsController] addTokensByChainId:', chainId);

    const tokens = await this.#fetchTopAssets(chainId);

    try {
      if (tokens.length > 0) {
        await this.#addTokensToTokensController(tokens, chainId);
      }
    } catch (error) {
      console.error(
        `[StaticAssetsController] Error adding tokens for chainId ${chainId}`,
        error,
      );
    }
  }

  /**
   * Add the tokens to the TokensController after filtering out tokens that are already in the ignore state.
   *
   * @param tokens - The tokens to add.
   * @param chainId - The chain ID.
   */
  async #addTokensToTokensController(
    tokens: Token[],
    chainId: string,
  ): Promise<void> {
    if (!isStrictHexString(chainId)) {
      return;
    }

    const filteredTokens = await this.#filterIgnoredTokens(tokens, chainId);

    const networkClientId = await this.messenger.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );

    // filter out tokens that are already in the ignore
    await this.messenger.call(
      'TokensController:addTokens',
      filteredTokens,
      networkClientId,
    );
  }

  /**
   * Filter out tokens that are in the ignored tokens set.
   *
   * @param tokens - The tokens to filter.
   * @param chainId - The chain ID.
   * @returns The filtered tokens.
   */
  async #filterIgnoredTokens(tokens: Token[], chainId: Hex): Promise<Token[]> {
    const tokensControllerState = await this.messenger.call(
      'TokensController:getState',
    );

    if (
      !tokensControllerState.allIgnoredTokens ||
      !(chainId in tokensControllerState.allIgnoredTokens)
    ) {
      return tokens;
    }

    const selectedAccount = this.messenger.call(
      'AccountsController:getSelectedAccount',
    );

    if (
      !selectedAccount?.address ||
      !(
        selectedAccount.address in
        tokensControllerState.allIgnoredTokens[chainId]
      )
    ) {
      return tokens;
    }

    const ignoredTokens =
      tokensControllerState.allIgnoredTokens[chainId]?.[
        selectedAccount.address
      ] ?? [];

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
   * @returns The tokens.
   */
  async #fetchTopAssets(chainId: string): Promise<Token[]> {
    try {
      if (!this.#isCacheExpired(chainId)) {
        return this.#tokensCache[chainId].data ?? [];
      }
      const tokens: Token[] = [];

      const topAssets = await fetchTopAssets(chainId);

      topAssets.forEach((topAsset) => {
        try {
          tokens.push(this.#transformTopAssets(topAsset));
        } catch (error) {
          console.error(
            `[StaticAssetsController] Error transforming top asset ${topAsset.assetId} for chainId ${chainId}`,
            error,
          );
        }
      });

      // store the tokens to in-memory cache.
      this.#tokensCache[chainId] = {
        data: tokens ?? [],
        // The cache expiration time is the minimum of the cache expiration time and the interval length.
        // Although there is a chance that when the next interval is triggered, the cache is not expired yet,
        // but since the polling will be triggered if the user changes the selected account or the chains,
        // hence the cache will be refreshed eventually.
        expiresAt:
          Date.now() +
          Math.min(
            CACHE_EXPIRATION_MS,
            this.getIntervalLength() ?? DEFAULT_INTERVAL_MS,
          ),
      };
      return tokens;
    } catch (error) {
      console.error(
        `[StaticAssetsController] Error fetching top assets for chainId ${chainId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Check if the cache is expired.
   *
   * @param chainId - The chain ID.
   * @returns Whether the cache is expired.
   */
  #isCacheExpired(chainId: string): boolean {
    if (chainId in this.#tokensCache) {
      return Date.now() > this.#tokensCache[chainId].expiresAt;
    }
    return true;
  }

  /**
   * Check if the chain ID is supported and if it has added to the network controller.
   *
   * @param chainId - The chain ID.
   * @returns Whether the chain ID is valid.
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
