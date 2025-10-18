/* eslint-disable jsdoc/require-param */
import { BaseController } from '@metamask/base-controller';
import log from 'loglevel';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { isAddress as isSolanaAddress } from '@solana/addresses';
import {
  CaipAccountId,
  parseCaipChainId,
  toCaipAccountId,
} from '@metamask/utils';
import { base58, isAddress as isEvmAddress } from 'ethers/lib/utils';

import { RewardsControllerMessenger } from '../../controller-init/messengers/rewards-controller-messenger';
import { isHardwareAccount } from '../../../../shared/lib/accounts';
import {
  type RewardsControllerState,
  type RewardsAccountState,
  type LoginResponseDto,
  type EstimatePointsDto,
  type EstimatedPointsDto,
  type SeasonDtoState,
  type SeasonStatusState,
  type SeasonTierState,
  type SeasonTierDto,
  type SeasonStatusDto,
  type SubscriptionDto,
  type OptInStatusInputDto,
  type OptInStatusDto,
  CURRENT_SEASON_ID,
} from './rewards-controller.types';
import {
  AuthorizationFailedError,
  InvalidTimestampError,
} from './rewards-data-service';
import { signSolanaRewardsMessage } from './utils/solana-snap';

// Re-export the messenger type for convenience
export type { RewardsControllerMessenger };

export const DEFAULT_BLOCKED_REGIONS = ['UK'];

const controllerName = 'RewardsController';

// Season status cache threshold
const SEASON_STATUS_CACHE_THRESHOLD_MS = 1000 * 60 * 1; // 1 minute

/**
 * State metadata for the RewardsController
 */
const metadata = {
  activeAccount: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  accounts: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  subscriptions: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  seasons: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  subscriptionReferralDetails: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  seasonStatuses: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  activeBoosts: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  unlockedRewards: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  pointsEvents: {
    includeInStateLogs: true,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  subscriptionTokens: {
    includeInStateLogs: false,
    persist: true,
    anonymous: true,
    usedInUi: false,
  },
  rewardsEnabled: {
    includeInStateLogs: true,
    persist: false,
    anonymous: false,
    usedInUi: true,
  },
};

/**
 * Get the default state for the RewardsController
 */
export const getRewardsControllerDefaultState = (): RewardsControllerState => ({
  activeAccount: null,
  accounts: {},
  subscriptions: {},
  seasons: {},
  subscriptionReferralDetails: {},
  seasonStatuses: {},
  activeBoosts: {},
  unlockedRewards: {},
  pointsEvents: {},
  subscriptionTokens: {},
  rewardsEnabled: false,
});

export const defaultRewardsControllerState = getRewardsControllerDefaultState();

// eslint-disable-next-line @typescript-eslint/naming-convention
type CacheReader<T> = (
  key: string,
) => { payload: T; lastFetched?: number } | undefined;

// eslint-disable-next-line @typescript-eslint/naming-convention
type CacheWriter<T> = (key: string, payload: T) => void;

// eslint-disable-next-line @typescript-eslint/naming-convention
type CacheOptions<T> = {
  key: string;
  ttl: number;
  readCache: CacheReader<T>;
  fetchFresh: () => Promise<T>;
  writeCache: CacheWriter<T>;
  swrCallback?: (old: T, fresh: T) => void; // Callback triggered after SWR refresh, to invalidate cache
};

// eslint-disable-next-line jsdoc/require-param
/**
 * Get a value, from cache if exist
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function wrapWithCache<T>({
  key,
  ttl,
  readCache,
  fetchFresh,
  writeCache,
  swrCallback,
}: CacheOptions<T>): Promise<T> {
  // Try cache
  try {
    const cached = readCache(key);

    if (cached) {
      const isStale =
        !cached.lastFetched || Date.now() - cached.lastFetched > ttl;

      // If cache is fresh, return it immediately and do NOT trigger SWR
      if (!isStale) {
        return cached.payload;
      }

      // If stale and SWR enabled → return stale data + background refresh
      if (swrCallback) {
        (async () => {
          try {
            const fresh = await fetchFresh();
            writeCache(key, fresh);
            swrCallback(cached.payload, fresh);
          } catch (err) {
            log.error(
              'SWR revalidation failed:',
              err instanceof Error ? err.message : String(err),
            );
          }
        })();
        return cached.payload;
      }
    }
  } catch (error) {
    log.error(
      'RewardsController: wrapWithCache cache read failed, fetching fresh',
      error instanceof Error ? error.message : String(error),
    );
  }

  // Fetch fresh
  const freshValue = await fetchFresh();

  // Write cache
  try {
    writeCache(key, freshValue);
  } catch (error) {
    log.error(
      'RewardsController: wrapWithCache writeCache failed',
      error instanceof Error ? error.message : String(error),
    );
  }

  return freshValue;
}

/**
 * Controller for managing user rewards and campaigns
 * Handles reward claiming, campaign fetching, and reward history
 */
export class RewardsController extends BaseController<
  typeof controllerName,
  RewardsControllerState,
  RewardsControllerMessenger
> {
  #currentSeasonIdMap: Record<string, string> = {};

  constructor({
    messenger,
    state,
    rewardsEnabled,
  }: {
    messenger: RewardsControllerMessenger;
    state?: Partial<RewardsControllerState>;
    rewardsEnabled: boolean;
  }) {
    super({
      name: controllerName,
      metadata,
      messenger,
      state: {
        ...defaultRewardsControllerState,
        ...state,
        rewardsEnabled,
      },
    });

    this.#registerActionHandlers();
    this.#initializeEventSubscriptions();
  }

  /**
   * Register action handlers for this controller
   */
  #registerActionHandlers(): void {
    this.messagingSystem.registerActionHandler(
      'RewardsController:estimatePoints',
      this.estimatePoints.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:isRewardsFeatureEnabled',
      this.isRewardsFeatureEnabled.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:optIn',
      this.optIn.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:validateReferralCode',
      this.validateReferralCode.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:linkAccountToSubscriptionCandidate',
      this.linkAccountToSubscriptionCandidate.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:getCandidateSubscriptionId',
      this.getCandidateSubscriptionId.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:getOptInStatus',
      this.getOptInStatus.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      'RewardsController:isOptInSupported',
      this.isOptInSupported.bind(this),
    );
  }

  /**
   * Initialize event subscriptions based on feature flag state
   */
  #initializeEventSubscriptions(): void {
    // Subscribe to account changes for silent authentication
    this.messagingSystem.subscribe(
      'AccountsController:selectedAccountChange',
      () => this.#handleAuthenticationTrigger('Account changed'),
    );

    // Subscribe to KeyringController unlock events to retry silent auth
    this.messagingSystem.subscribe('KeyringController:unlock', () =>
      this.#handleAuthenticationTrigger('KeyringController unlocked'),
    );

    // Initialize silent authentication on startup
    this.#handleAuthenticationTrigger('Controller initialized');
  }

  /**
   * Create composite key for state storage
   */
  #createSeasonSubscriptionCompositeKey(
    seasonId: string,
    subscriptionId: string,
  ): string {
    if (
      seasonId === CURRENT_SEASON_ID &&
      this.#currentSeasonIdMap[CURRENT_SEASON_ID]
    ) {
      // eslint-disable-next-line no-param-reassign
      seasonId = this.#currentSeasonIdMap[CURRENT_SEASON_ID];
    }
    return `${seasonId}:${subscriptionId}`;
  }

  /**
   * Convert SeasonDto to SeasonDtoState for storage
   */
  #convertSeasonToState(season: SeasonStatusDto['season']): SeasonDtoState {
    return {
      id: season.id,
      name: season.name,
      startDate: season.startDate.getTime(),
      endDate: season.endDate.getTime(),
      tiers: season.tiers,
    };
  }

  /**
   * Convert SeasonStatusDto to SeasonStatusState and update seasons map
   */
  #convertSeasonStatusToSubscriptionState(
    seasonStatus: SeasonStatusDto,
  ): SeasonStatusState {
    const tierState = this.calculateTierStatus(
      seasonStatus.season.tiers,
      seasonStatus.currentTierId,
      seasonStatus.balance.total,
    );

    return {
      season: this.#convertSeasonToState(seasonStatus.season),
      balance: {
        total: seasonStatus.balance.total,
        refereePortion: seasonStatus.balance.refereePortion,
        updatedAt: seasonStatus.balance.updatedAt?.getTime(),
      },
      tier: tierState,
      lastFetched: Date.now(),
    };
  }

  /**
   * Get account state for a given CAIP-10 address
   */
  #getAccountState(account: CaipAccountId): RewardsAccountState | null {
    return this.state.accounts[account] || null;
  }

  /**
   * Sign a message for rewards authentication
   */
  async #signRewardsMessage(
    account: InternalAccount,
    timestamp: number,
  ): Promise<string> {
    const message = `rewards,${account.address},${timestamp}`;

    if (isSolanaAddress(account.address)) {
      const result = await signSolanaRewardsMessage(
        account.address,
        Buffer.from(message, 'utf8').toString('base64'),
      );
      return `0x${Buffer.from(base58.decode(result.signature)).toString(
        'hex',
      )}`;
    } else if (isEvmAddress(account.address)) {
      const result = await this.#signEvmMessage(account, message);
      return result;
    }

    throw new Error('Unsupported account type for signing rewards message');
  }

  async #signEvmMessage(
    account: InternalAccount,
    message: string,
  ): Promise<string> {
    // Convert message to hex format for signing
    const hexMessage = `0x${Buffer.from(message, 'utf8').toString('hex')}`;

    // Use KeyringController to sign the message
    const signature = await this.messagingSystem.call(
      'KeyringController:signPersonalMessage',
      {
        data: hexMessage,
        from: account.address,
      },
    );
    log.info(
      'RewardsController: EVM message signed for account',
      account.address,
    );
    return signature;
  }

  /**
   * Handle authentication triggers (account changes, keyring unlock)
   */
  async #handleAuthenticationTrigger(reason?: string): Promise<void> {
    const { rewardsEnabled } = this.state;

    if (!rewardsEnabled) {
      return;
    }
    log.info('RewardsController: handleAuthenticationTrigger', reason);

    try {
      const selectedAccount = this.messagingSystem.call(
        'AccountsController:getSelectedMultichainAccount',
      );
      await this.#performSilentAuth(selectedAccount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage && !errorMessage?.includes('Engine does not exist')) {
        log.error(
          'RewardsController: Silent authentication failed:',
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * Check if silent authentication should be skipped
   */
  #shouldSkipSilentAuth(
    account: CaipAccountId,
    internalAccount: InternalAccount,
  ): boolean {
    // Skip if opt-in is not supported (e.g., hardware wallets, unsupported account types)
    if (!this.isOptInSupported(internalAccount)) {
      return true;
    }

    const accountState = this.#getAccountState(account);
    if (accountState) {
      return true;
    }

    return false;
  }

  #storeSubscriptionToken(subscriptionId: string, token: string): void {
    this.update((state: RewardsControllerState) => {
      state.subscriptionTokens[subscriptionId] = token;
    });
  }

  /**
   * Perform silent authentication for the given address
   */
  async #performSilentAuth(
    internalAccount?: InternalAccount | null,
    shouldBecomeActiveAccount = true,
    respectSkipSilentAuth = true,
  ): Promise<string | null> {
    if (!internalAccount) {
      if (shouldBecomeActiveAccount) {
        this.update((state: RewardsControllerState) => {
          state.activeAccount = null;
        });
      }
      return null;
    }

    const account: CaipAccountId | null =
      this.convertInternalAccountToCaipAccountId(internalAccount);

    const shouldSkip = account
      ? this.#shouldSkipSilentAuth(account, internalAccount)
      : false;

    if (shouldSkip && respectSkipSilentAuth) {
      // This means that we'll have a record for this account
      let accountState = this.#getAccountState(account as CaipAccountId);
      if (accountState) {
        // Update last authenticated account
        this.update((state: RewardsControllerState) => {
          if (shouldBecomeActiveAccount) {
            state.activeAccount = accountState;
          }
        });
      } else {
        // Update accounts map && last authenticated account
        accountState = {
          account: account as CaipAccountId,
          hasOptedIn: false,
          subscriptionId: null,
          perpsFeeDiscount: null, // Default value, will be updated when fetched
          lastPerpsDiscountRateFetched: null,
        };
        this.update((state: RewardsControllerState) => {
          state.accounts[account as CaipAccountId] =
            accountState as RewardsAccountState;
          if (shouldBecomeActiveAccount) {
            state.activeAccount = accountState;
          }
        });
      }
      log.info(
        'RewardsController: Skipping for account (likely authenticated & within grace period)',
        account,
      );
      return accountState?.subscriptionId || null;
    }

    let subscription: SubscriptionDto | null = null;
    let authUnexpectedError = false;

    try {
      // Generate timestamp and sign the message
      let timestamp = Math.floor(Date.now() / 1000);
      let signature;
      let retryAttempt = 0;
      const MAX_RETRY_ATTEMPTS = 1;

      try {
        signature = await this.#signRewardsMessage(internalAccount, timestamp);
      } catch (signError) {
        log.error(
          'RewardsController: Failed to generate signature:',
          signError,
        );

        // Check if the error is due to locked keyring
        if (
          signError &&
          typeof signError === 'object' &&
          'message' in signError
        ) {
          const errorMessage = (signError as Error).message;
          if (errorMessage.includes('controller is locked')) {
            log.info(
              'RewardsController: Keyring is locked, skipping silent auth',
            );
            return null; // Exit silently when keyring is locked
          }
        }

        throw signError;
      }

      // Function to execute the login call with retry logic
      const executeLogin = async (
        ts: number,
        sig: string,
      ): Promise<LoginResponseDto> => {
        try {
          return await this.messagingSystem.call('RewardsDataService:login', {
            account: internalAccount.address,
            timestamp: ts,
            signature: sig,
          });
        } catch (error) {
          // Check if it's an InvalidTimestampError and we haven't exceeded retry attempts
          if (
            error instanceof InvalidTimestampError &&
            retryAttempt < MAX_RETRY_ATTEMPTS
          ) {
            retryAttempt += 1;
            log.info(
              'RewardsController: Retrying silent auth with server timestamp',
              { originalTimestamp: ts, newTimestamp: error.timestamp },
            );
            // Use the timestamp from the error for retry
            timestamp = error.timestamp;
            signature = await this.#signRewardsMessage(
              internalAccount,
              timestamp,
            );
            return await executeLogin(timestamp, signature);
          }
          throw error;
        }
      };

      const loginResponse: LoginResponseDto = await executeLogin(
        timestamp,
        signature,
      );

      // Update state with successful authentication
      subscription = loginResponse.subscription;

      // TODO: Re-enable multi-subscription token vault when implemented
      // Store the session token for this subscription
      this.#storeSubscriptionToken(subscription.id, loginResponse.sessionId);

      log.info('RewardsController: Silent auth successful', account);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('401')) {
        // Not opted in
        log.error('RewardsController: Account not opt-in', account);
      } else {
        // Unknown error
        subscription = null;
        authUnexpectedError = true;
      }
    } finally {
      // Update state
      this.update((state: RewardsControllerState) => {
        if (!account) {
          return;
        }

        // Update accounts map && last authenticated account
        const accountState: RewardsAccountState = {
          account,
          hasOptedIn: authUnexpectedError ? undefined : Boolean(subscription),
          subscriptionId: subscription?.id || null,
          perpsFeeDiscount: null, // Default value, will be updated when fetched
          lastPerpsDiscountRateFetched: null,
        };
        state.accounts[account] = accountState;
        if (shouldBecomeActiveAccount) {
          state.activeAccount = accountState;
        }

        if (subscription) {
          state.subscriptions[subscription.id] = subscription;
        }
      });
    }

    return subscription?.id || null;
  }

  /**
   * Reset controller state to default
   */
  resetState(): void {
    this.update(() => getRewardsControllerDefaultState());
  }

  /**
   * Calculate tier status and next tier information
   */
  calculateTierStatus(
    seasonTiers: SeasonTierDto[],
    currentTierId: string,
    currentPoints: number,
  ): SeasonTierState {
    // Sort tiers by points needed (ascending)
    const sortedTiers = [...seasonTiers].sort(
      (a, b) => a.pointsNeeded - b.pointsNeeded,
    );

    // Find current tier
    const currentTier = sortedTiers.find((tier) => tier.id === currentTierId);
    if (!currentTier) {
      throw new Error(
        `Current tier ${currentTierId} not found in season tiers`,
      );
    }

    // Find next tier (first tier with more points needed than current tier)
    const currentTierIndex = sortedTiers.findIndex(
      (tier) => tier.id === currentTierId,
    );
    const nextTier =
      currentTierIndex < sortedTiers.length - 1
        ? sortedTiers[currentTierIndex + 1]
        : null;

    // Calculate points needed for next tier
    const nextTierPointsNeeded = nextTier
      ? Math.max(0, nextTier.pointsNeeded - currentPoints)
      : null;

    return {
      currentTier,
      nextTier,
      nextTierPointsNeeded,
    };
  }

  /**
   * Get the actual subscription ID for a given CAIP account ID
   *
   * @param account - The CAIP account ID to check
   * @returns The subscription ID or null if not found
   */
  getActualSubscriptionId(account: CaipAccountId): string | null {
    const accountState = this.#getAccountState(account);
    return accountState?.subscriptionId || null;
  }

  /**
   * Get the first subscription ID from the subscriptions map
   *
   * @returns The first subscription ID or null if no subscriptions exist
   */
  getFirstSubscriptionId(): string | null {
    if (!this.state.subscriptions) {
      return null;
    }
    const subscriptionIds = Object.keys(this.state.subscriptions);
    return subscriptionIds.length > 0 ? subscriptionIds[0] : null;
  }

  /**
   * Check if an internal account supports opt-in for rewards
   *
   * @param account - The internal account to check
   * @returns boolean - True if the account supports opt-in, false otherwise
   */
  isOptInSupported(account: InternalAccount): boolean {
    try {
      // Try to check if it's a hardware wallet
      const isHardware = isHardwareAccount(account);
      // If it's a hardware wallet, opt-in is not supported
      if (isHardware) {
        return false;
      }

      // Check if it's an EVM address (not non-EVM)
      if (isEvmAddress(account.address)) {
        return true;
      }

      // Check if it's a Solana address
      if (isSolanaAddress(account.address)) {
        return true;
      }

      // If it's neither Solana nor EVM, opt-in is not supported
      return false;
    } catch (error) {
      // If there's an exception (e.g., checking hardware wallet status fails),
      // assume opt-in is not supported
      log.error(
        'RewardsController: Exception checking opt-in support, assuming not supported:',
        error,
      );
      return false;
    }
  }

  convertInternalAccountToCaipAccountId(
    account: InternalAccount,
  ): CaipAccountId | null {
    try {
      const [scope] = account.scopes;
      const { namespace, reference } = parseCaipChainId(scope);
      return toCaipAccountId(namespace, reference, account.address);
    } catch (error) {
      log.error(
        'RewardsController: Failed to convert address to CAIP-10 format:',
        error,
      );
      return null;
    }
  }

  checkOptInStatusAgainstCache(
    addresses: string[],
    addressToAccountMap: Map<string, InternalAccount>,
  ): {
    cachedOptInResults: (boolean | null)[];
    cachedSubscriptionIds: (string | null)[];
    addressesNeedingFresh: string[];
  } {
    // Arrays to track cached vs fresh data needed
    const cachedOptInResults: (boolean | null)[] = new Array(
      addresses.length,
    ).fill(null);
    const cachedSubscriptionIds: (string | null)[] = new Array(
      addresses.length,
    ).fill(null);
    const addressesNeedingFresh: string[] = [];

    // Check storage state for each address
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const internalAccount = addressToAccountMap.get(address.toLowerCase());

      if (internalAccount) {
        const caipAccount =
          this.convertInternalAccountToCaipAccountId(internalAccount);
        if (caipAccount) {
          const accountState = this.#getAccountState(caipAccount);
          if (accountState?.hasOptedIn !== undefined) {
            // Use cached data
            cachedOptInResults[i] = accountState.hasOptedIn;
            cachedSubscriptionIds[i] = accountState.subscriptionId || null;
            continue;
          }
        }
      }

      // No cached data found, need fresh API call
      addressesNeedingFresh.push(address);
    }

    return {
      cachedOptInResults,
      cachedSubscriptionIds,
      addressesNeedingFresh,
    };
  }

  /**
   * Get opt-in status for multiple addresses with feature flag check
   *
   * @param params - The request parameters containing addresses
   * @returns Promise<OptInStatusDto> - The opt-in status response
   */
  async getOptInStatus(params: OptInStatusInputDto): Promise<OptInStatusDto> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      // Return empty arrays when feature flag is disabled
      return {
        ois: params.addresses.map(() => false),
        sids: params.addresses.map(() => null),
      };
    }

    try {
      // Get all internal accounts to convert addresses to CAIP format
      const allAccounts = this.messagingSystem.call(
        'AccountsController:listMultichainAccounts',
      );

      // Create a map of address to internal account for quick lookup
      const addressToAccountMap = new Map<string, InternalAccount>();
      for (const account of allAccounts) {
        addressToAccountMap.set(account.address.toLowerCase(), account);
      }

      const {
        cachedOptInResults,
        cachedSubscriptionIds,
        addressesNeedingFresh,
      } = this.checkOptInStatusAgainstCache(
        params.addresses,
        addressToAccountMap,
      );

      // Make fresh API call only for addresses without cached data
      let freshOptInResults: boolean[] = [];
      let freshSubscriptionIds: (string | null)[] = [];
      if (addressesNeedingFresh.length > 0) {
        log.info(
          'RewardsController: Making fresh opt-in status API call for addresses without cached data',
          {
            cachedCount: cachedOptInResults.filter((result) => result !== null)
              .length,
            needFreshCount: addressesNeedingFresh.length,
          },
        );

        const freshResponse = await this.messagingSystem.call(
          'RewardsDataService:getOptInStatus',
          { addresses: addressesNeedingFresh },
        );
        freshOptInResults = freshResponse.ois;
        freshSubscriptionIds = freshResponse.sids;

        // Update state with fresh results for future caching
        for (let i = 0; i < addressesNeedingFresh.length; i++) {
          const address = addressesNeedingFresh[i];
          const hasOptedIn = freshOptInResults[i];
          const subscriptionId =
            Array.isArray(freshSubscriptionIds) &&
            i < freshSubscriptionIds.length
              ? freshSubscriptionIds[i]
              : null;
          const internalAccount = addressToAccountMap.get(
            address.toLowerCase(),
          );

          if (internalAccount) {
            const caipAccount =
              this.convertInternalAccountToCaipAccountId(internalAccount);
            if (caipAccount) {
              this.update((state: RewardsControllerState) => {
                // Update or create account state with fresh opt-in status and subscription ID
                if (state.accounts[caipAccount]) {
                  state.accounts[caipAccount].hasOptedIn = hasOptedIn;
                  state.accounts[caipAccount].subscriptionId = subscriptionId;
                } else {
                  state.accounts[caipAccount] = {
                    account: caipAccount,
                    hasOptedIn,
                    subscriptionId,
                    perpsFeeDiscount: null,
                    lastPerpsDiscountRateFetched: null,
                  };
                }

                if (state.activeAccount?.account === caipAccount) {
                  state.activeAccount.hasOptedIn = hasOptedIn;
                  state.activeAccount.subscriptionId = subscriptionId;
                }
              });
            }
          }
        }
      }

      // Combine cached and fresh results in the correct order
      const finalOptInResults: boolean[] = [];
      const finalSubscriptionIds: (string | null)[] = [];
      let freshIndex = 0;

      for (let i = 0; i < params.addresses.length; i++) {
        if (cachedOptInResults[i] === null) {
          // Use fresh result
          finalOptInResults[i] = freshOptInResults[freshIndex];
          finalSubscriptionIds[i] = freshSubscriptionIds[freshIndex];
          freshIndex += 1;
        } else {
          // Use cached result
          finalOptInResults[i] = cachedOptInResults[i] as boolean;
          finalSubscriptionIds[i] = cachedSubscriptionIds[i];
        }
      }

      return { ois: finalOptInResults, sids: finalSubscriptionIds };
    } catch (error) {
      log.error(
        'RewardsController: Failed to get opt-in status:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Estimate points for a given activity
   *
   * @param request - The estimate points request containing activity type and context
   * @returns Promise<EstimatedPointsDto> - The estimated points and bonus information
   */
  async estimatePoints(
    request: EstimatePointsDto,
  ): Promise<EstimatedPointsDto> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      return { pointsEstimate: 0, bonusBips: 0 };
    }
    try {
      const estimatedPoints = await this.messagingSystem.call(
        'RewardsDataService:estimatePoints',
        request,
      );

      return estimatedPoints;
    } catch (error) {
      log.error(
        'RewardsController: Failed to estimate points:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Check if the rewards feature is enabled via feature flag
   *
   * @returns boolean - True if rewards feature is enabled, false otherwise
   */
  isRewardsFeatureEnabled(): boolean {
    return this.state.rewardsEnabled;
  }

  /**
   * Get season status with caching
   *
   * @param subscriptionId - The subscription ID for authentication
   * @param seasonId - The ID of the season to get status for
   * @returns Promise<SeasonStatusState> - The season status data
   */
  async getSeasonStatus(
    subscriptionId: string,
    seasonId: string = CURRENT_SEASON_ID,
  ): Promise<SeasonStatusState | null> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      return null;
    }
    const result = await wrapWithCache<SeasonStatusState>({
      key: this.#createSeasonSubscriptionCompositeKey(seasonId, subscriptionId),
      ttl: SEASON_STATUS_CACHE_THRESHOLD_MS,
      readCache: (key) => {
        const cached = this.state.seasonStatuses[key] || undefined;
        if (!cached) {
          return undefined;
        }
        log.info(
          'RewardsController: Using cached season status data for',
          subscriptionId,
          seasonId,
        );
        return { payload: cached, lastFetched: cached.lastFetched };
      },
      fetchFresh: async () => {
        try {
          log.info(
            'RewardsController: Fetching fresh season status data via API call for subscriptionId & seasonId',
            subscriptionId,
            seasonId,
          );
          const seasonStatus = await this.messagingSystem.call(
            'RewardsDataService:getSeasonStatus',
            seasonId,
            subscriptionId,
          );
          return this.#convertSeasonStatusToSubscriptionState(seasonStatus);
        } catch (error) {
          if (error instanceof AuthorizationFailedError) {
            // Attempt to reauth with a valid account.
            try {
              if (this.state.activeAccount?.subscriptionId === subscriptionId) {
                const account = await this.messagingSystem.call(
                  'AccountsController:getSelectedMultichainAccount',
                );
                log.info(
                  'RewardsController: Attempting to reauth with a valid account after 403 error',
                );
                await this.#performSilentAuth(account, false, false); // try and auth.
              } else if (
                this.state.accounts &&
                Object.values(this.state.accounts).length > 0
              ) {
                const accountForSub = Object.values(this.state.accounts).find(
                  (acc) => acc.subscriptionId === subscriptionId,
                );
                if (accountForSub) {
                  const accounts = await this.messagingSystem.call(
                    'AccountsController:listMultichainAccounts',
                  );
                  const { convertInternalAccountToCaipAccountId } = this;
                  const intAccountForSub = accounts.find(
                    (acc: InternalAccount) => {
                      const accCaipId =
                        convertInternalAccountToCaipAccountId(acc);
                      return accCaipId === accountForSub.account;
                    },
                  );
                  if (intAccountForSub) {
                    log.info(
                      'RewardsController: Attempting to reauth with any valid account after 403 error',
                    );
                    await this.#performSilentAuth(
                      intAccountForSub as InternalAccount,
                      false,
                      false,
                    );
                  }
                }
              }
              // Fetch season status again
              const seasonStatus = await this.messagingSystem.call(
                'RewardsDataService:getSeasonStatus',
                seasonId,
                subscriptionId,
              );
              log.info(
                'RewardsController: Successfully fetched season status after reauth',
                seasonStatus,
              );
              return this.#convertSeasonStatusToSubscriptionState(seasonStatus);
            } catch {
              log.error(
                'RewardsController: Failed to reauth with a valid account after 403 error',
                error instanceof Error ? error.message : String(error),
              );
              this.invalidateSubscriptionCache(subscriptionId);
              this.invalidateAccountsAndSubscriptions();
              throw error;
            }
          }
          log.error(
            'RewardsController: Failed to get season status:',
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
      },
      writeCache: (key, subscriptionSeasonStatus) => {
        const { season: seasonState } = subscriptionSeasonStatus;
        this.update((state: RewardsControllerState) => {
          // Update seasons map with season data
          state.seasons[seasonId] = seasonState;

          // Update season status with composite key
          state.seasonStatuses[key] = subscriptionSeasonStatus;

          if (
            seasonId === CURRENT_SEASON_ID &&
            seasonState.id !== CURRENT_SEASON_ID &&
            seasonState.id
          ) {
            this.#currentSeasonIdMap[CURRENT_SEASON_ID] = seasonState.id;
            state.seasons[seasonState.id] = seasonState;
            state.seasonStatuses[
              this.#createSeasonSubscriptionCompositeKey(
                seasonState.id,
                subscriptionId,
              )
            ] = subscriptionSeasonStatus;
          }
        });
      },
    });

    return result;
  }

  invalidateAccountsAndSubscriptions() {
    this.update((state: RewardsControllerState) => {
      if (state.activeAccount) {
        state.activeAccount = {
          ...state.activeAccount,
          hasOptedIn: false,
          subscriptionId: null,
          account: state.activeAccount.account, // Ensure account is always present (never undefined)
        };
      }
      state.accounts = {};
      state.subscriptions = {};
    });
    log.info('RewardsController: Invalidated accounts and subscriptions');
  }

  /**
   * Perform the complete opt-in process for rewards
   *
   * @param account - The account to opt in
   * @param referralCode - Optional referral code
   */
  async optIn(
    account: InternalAccount,
    referralCode?: string,
  ): Promise<string | null> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      log.info(
        'RewardsController: Rewards feature is disabled, skipping optin',
        {
          account: account.address,
        },
      );
      return null;
    }

    log.info('RewardsController: Starting optin process', {
      account: account.address,
    });

    // Generate timestamp and sign the message for mobile optin
    let timestamp = Math.floor(Date.now() / 1000);
    let signature = await this.#signRewardsMessage(account, timestamp);
    let retryAttempt = 0;
    const MAX_RETRY_ATTEMPTS = 1;

    const executeMobileOptin = async (
      ts: number,
      sig: string,
    ): Promise<LoginResponseDto> => {
      try {
        return await this.messagingSystem.call(
          'RewardsDataService:mobileOptin',
          {
            account: account.address,
            timestamp: ts,
            signature: sig as `0x${string}`,
            referralCode,
          },
        );
      } catch (error) {
        // Check if it's an InvalidTimestampError and we haven't exceeded retry attempts
        if (
          error instanceof InvalidTimestampError &&
          retryAttempt < MAX_RETRY_ATTEMPTS
        ) {
          retryAttempt += 1;
          log.info('RewardsController: Retrying with server timestamp', {
            originalTimestamp: ts,
            newTimestamp: error.timestamp,
          });
          // Use the timestamp from the error for retry
          timestamp = error.timestamp;
          signature = await this.#signRewardsMessage(account, timestamp);
          return await executeMobileOptin(timestamp, signature);
        }
        throw error;
      }
    };

    const optinResponse = await executeMobileOptin(timestamp, signature);

    log.info(
      'RewardsController: Optin successful, updating controller state...',
    );

    // TODO: Re-enable multi-subscription token vault when implemented
    // Store the subscription token for authenticated requests
    if (optinResponse.subscription?.id && optinResponse.sessionId) {
      this.#storeSubscriptionToken(
        optinResponse.subscription.id,
        optinResponse.sessionId,
      );
    }

    // Update state with opt-in response data
    this.update((state) => {
      const caipAccount: CaipAccountId | null =
        this.convertInternalAccountToCaipAccountId(account);
      if (!caipAccount) {
        return;
      }
      state.activeAccount = {
        account: caipAccount,
        hasOptedIn: true,
        subscriptionId: optinResponse.subscription.id,
        perpsFeeDiscount: null,
        lastPerpsDiscountRateFetched: null,
      };
      state.accounts[caipAccount] = state.activeAccount;
      state.subscriptions[optinResponse.subscription.id] =
        optinResponse.subscription;
    });

    return optinResponse.subscription.id;
  }

  /**
   * Validate a referral code
   *
   * @param code - The referral code to validate
   * @returns Promise<boolean> - True if the code is valid, false otherwise
   */
  async validateReferralCode(code: string): Promise<boolean> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      return false;
    }

    if (!code.trim()) {
      return false;
    }

    if (code.length !== 6) {
      return false;
    }

    try {
      const response = await this.messagingSystem.call(
        'RewardsDataService:validateReferralCode',
        code,
      );
      return response.valid;
    } catch (error) {
      log.error(
        'RewardsController: Failed to validate referral code:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  /**
   * Get candidate subscription ID with fallback logic
   *
   * @returns Promise<string | null> - The subscription ID or null if none found
   */
  async getCandidateSubscriptionId(): Promise<string | null> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      return null;
    }

    // First, check if there's an active account with a subscription
    if (this.state.activeAccount?.subscriptionId) {
      return this.state.activeAccount.subscriptionId;
    }

    // Fallback to the first subscription ID from the subscriptions map
    const subscriptionIds = Object.keys(this.state.subscriptions);
    if (subscriptionIds.length > 0) {
      return subscriptionIds[0];
    }

    // If no subscriptions found, call optinstatus for all internal accounts
    try {
      const allAccounts = this.messagingSystem.call(
        'AccountsController:listMultichainAccounts',
      );

      // Extract addresses from internal accounts using isOptInSupported
      const supportedAccounts: InternalAccount[] =
        allAccounts?.filter((account: InternalAccount) =>
          this.isOptInSupported(account),
        ) || [];
      if (!supportedAccounts || supportedAccounts.length === 0) {
        return null;
      }

      const addresses = supportedAccounts.map(
        (account: InternalAccount) => account.address,
      );

      // Call opt-in status check
      const optInStatusResponse = await this.getOptInStatus({ addresses });
      if (!optInStatusResponse?.ois?.filter((ois: boolean) => ois).length) {
        log.info(
          'RewardsController: No candidate subscription ID found. No opted in accounts found via opt-in status response.',
        );
        return null;
      }

      log.info(
        'RewardsController: Found opted in account via opt-in status response. Attempting silent auth to determine candidate subscription ID.',
      );

      // Loop through all accounts that have opted in (ois[i] === true)
      // Only process the first 10 accounts with a 500ms delay between each
      const maxSilentAuthAttempts = Math.min(
        10,
        optInStatusResponse.ois.length,
      );
      let silentAuthAttempts = 0;
      for (let i = 0; i < supportedAccounts.length; i++) {
        if (silentAuthAttempts > maxSilentAuthAttempts) {
          break;
        }
        const account = supportedAccounts[i];
        if (!account || optInStatusResponse.ois[i] === false) {
          continue;
        }
        // Defensive: Ensure sids is an array and i is within bounds
        let subscriptionId =
          Array.isArray(optInStatusResponse?.sids) &&
          i < optInStatusResponse.sids.length
            ? optInStatusResponse.sids[i]
            : null;
        const sessionToken = subscriptionId
          ? this.state.subscriptionTokens[subscriptionId]
          : undefined;
        if (subscriptionId && Boolean(sessionToken)) {
          return subscriptionId;
        }
        try {
          silentAuthAttempts += 1;
          subscriptionId = await this.#performSilentAuth(
            account,
            false, // shouldBecomeActiveAccount = false
            false, // respectSkipSilentAuth = false
          );
          if (subscriptionId) {
            log.info(
              'RewardsController: Found candidate subscription ID via opt-in status response.',
              {
                subscriptionId,
              },
            );

            return subscriptionId;
          }
        } catch (error) {
          // Continue to next account if this one fails
          log.error(
            'RewardsController: Silent auth failed for account during candidate search:',
            account.address,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    } catch (error) {
      log.error(
        'RewardsController: Failed to get candidate subscription ID:',
        error instanceof Error ? error.message : String(error),
      );
    }

    throw new Error(
      'No candidate subscription ID found after all silent auth attempts. There is an opted in account but we cannot use it to fetch the season status.',
    );
  }

  /**
   * Link an account to a subscription via mobile join
   *
   * @param account - The account to link to the subscription
   * @returns Promise<boolean> - The updated subscription information
   */
  async linkAccountToSubscriptionCandidate(
    account: InternalAccount,
  ): Promise<boolean> {
    const { rewardsEnabled } = this.state;
    if (!rewardsEnabled) {
      log.warn('RewardsController: Rewards feature is disabled');
      return false;
    }

    // Convert account to CAIP format
    const caipAccount = this.convertInternalAccountToCaipAccountId(account);
    if (!caipAccount) {
      throw new Error('Failed to convert account to CAIP-10 format');
    }

    // Check if account already has a subscription (short-circuit)
    const existingAccountState = this.#getAccountState(caipAccount);
    if (existingAccountState?.subscriptionId) {
      log.info('RewardsController: Account to link already has subscription', {
        account: caipAccount,
        subscriptionId: existingAccountState.subscriptionId,
      });
      const existingSubscription =
        this.state.subscriptions[existingAccountState.subscriptionId];
      if (existingSubscription) {
        return true;
      }
    }

    // Get candidate subscription ID using the new method
    const candidateSubscriptionId = await this.getCandidateSubscriptionId();
    if (!candidateSubscriptionId) {
      throw new Error('No valid subscription found to link account to');
    }

    try {
      // Generate timestamp and sign the message for mobile join
      let timestamp = Math.floor(Date.now() / 1000);
      let signature = await this.#signRewardsMessage(account, timestamp);
      let retryAttempt = 0;
      const MAX_RETRY_ATTEMPTS = 1;

      // Function to execute the mobile join call
      const executeMobileJoin = async (
        ts: number,
        sig: string,
      ): Promise<SubscriptionDto> => {
        try {
          return await this.messagingSystem.call(
            'RewardsDataService:mobileJoin',
            {
              account: account.address,
              timestamp: ts,
              signature: sig as `0x${string}`,
            },
            candidateSubscriptionId,
          );
        } catch (error) {
          // Check if it's an InvalidTimestampError and we haven't exceeded retry attempts
          if (
            error instanceof InvalidTimestampError &&
            retryAttempt < MAX_RETRY_ATTEMPTS
          ) {
            retryAttempt += 1;
            log.info('RewardsController: Retrying with server timestamp', {
              originalTimestamp: ts,
              newTimestamp: error.timestamp,
            });
            // Use the timestamp from the error for retry
            timestamp = error.timestamp;
            signature = await this.#signRewardsMessage(account, timestamp);
            return await executeMobileJoin(timestamp, signature);
          }
          throw error;
        }
      };

      // Call mobile join via messenger with retry logic
      const updatedSubscription: SubscriptionDto = await executeMobileJoin(
        timestamp,
        signature,
      );

      // Update store with accounts and subscriptions (but not activeAccount)
      this.update((state: RewardsControllerState) => {
        // Update accounts state
        state.accounts[caipAccount] = {
          account: caipAccount,
          hasOptedIn: true, // via linking this is now opted in.
          subscriptionId: updatedSubscription.id,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        };
        if (state.activeAccount?.account === caipAccount) {
          state.activeAccount = state.accounts[caipAccount];
        }
      });

      log.info(
        'RewardsController: Successfully linked account to subscription',
        {
          account: caipAccount,
          subscriptionId: updatedSubscription.id,
        },
      );

      // Invalidate cache for the linked account
      this.invalidateSubscriptionCache(updatedSubscription.id);
      // Emit event to trigger UI refresh
      this.messagingSystem.publish('RewardsController:accountLinked', {
        subscriptionId: updatedSubscription.id,
        account: caipAccount,
      });

      return true;
    } catch (error) {
      log.error(
        'RewardsController: Failed to link account to subscription',
        caipAccount,
        candidateSubscriptionId,
        error,
      );
      return false;
    }
  }

  /**
   * Invalidate cached data for a subscription
   *
   * @param subscriptionId - The subscription ID to invalidate cache for
   * @param seasonId - The season ID (defaults to current season)
   */
  invalidateSubscriptionCache(subscriptionId: string, seasonId?: string): void {
    if (seasonId) {
      // Invalidate specific season
      const compositeKey = this.#createSeasonSubscriptionCompositeKey(
        seasonId,
        subscriptionId,
      );
      this.update((state: RewardsControllerState) => {
        delete state.seasonStatuses[compositeKey];
        delete state.unlockedRewards[compositeKey];
        delete state.activeBoosts[compositeKey];
        delete state.pointsEvents[compositeKey];
      });
    } else {
      // Invalidate all seasons for this subscription
      this.update((state: RewardsControllerState) => {
        Object.keys(state.seasonStatuses).forEach((key) => {
          if (key.includes(subscriptionId)) {
            delete state.seasonStatuses[key];
          }
        });
        Object.keys(state.unlockedRewards).forEach((key) => {
          if (key.includes(subscriptionId)) {
            delete state.unlockedRewards[key];
          }
        });
        Object.keys(state.activeBoosts).forEach((key) => {
          if (key.includes(subscriptionId)) {
            delete state.activeBoosts[key];
          }
        });
        Object.keys(state.pointsEvents).forEach((key) => {
          if (key.includes(subscriptionId)) {
            delete state.pointsEvents[key];
          }
        });
      });
    }

    log.info(
      'RewardsController: Invalidated cache for subscription',
      subscriptionId,
      seasonId || 'all seasons',
    );
  }
}
