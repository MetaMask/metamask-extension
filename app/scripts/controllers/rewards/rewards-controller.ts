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
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import { RewardsControllerMessenger } from '../../controller-init/messengers/rewards-controller-messenger';
import { isHardwareAccount } from '../../../../shared/lib/accounts';
import {
  EstimatedPointsDto,
  EstimatePointsDto,
  SeasonDtoState,
  SeasonStatusState,
  SeasonTierState,
  RewardsGeoMetadata,
  OptInStatusInputDto,
  OptInStatusDto,
} from '../../../../shared/types/rewards';
import {
  type RewardsControllerState,
  type RewardsAccountState,
  type LoginResponseDto,
  type SeasonTierDto,
  type SeasonStatusDto,
  type SubscriptionDto,
  SeasonStateDto,
  SeasonMetadataDto,
  DiscoverSeasonsDto,
} from './rewards-controller.types';
import {
  AccountAlreadyRegisteredError,
  AuthorizationFailedError,
  InvalidTimestampError,
  SeasonNotFoundError,
} from './rewards-data-service';
import { signSolanaRewardsMessage } from './utils/solana-snap';
import { sortAccounts } from './utils/sortAccounts';

export const DEFAULT_BLOCKED_REGIONS = ['UK'];

const controllerName = 'RewardsController';

// Season status cache threshold
const SEASON_STATUS_CACHE_THRESHOLD_MS = 1000 * 60 * 1; // 1 minute

// Season metadata cache threshold
const SEASON_METADATA_CACHE_THRESHOLD_MS = 1000 * 60 * 10; // 10 minutes

// Opt-in status stale threshold for not opted-in accounts to force a fresh check (less strict than in mobile for now)
const NOT_OPTED_IN_OIS_STALE_CACHE_THRESHOLD_MS = 1000 * 60 * 60; // 1 hour

/**
 * State metadata for the RewardsController
 */
const metadata = {
  rewardsActiveAccount: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  rewardsAccounts: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  rewardsSubscriptions: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  rewardsSeasons: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  rewardsSeasonStatuses: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  rewardsSubscriptionTokens: {
    includeInStateLogs: false,
    persist: true,
    includeInDebugSnapshot: true,
    usedInUi: false,
  },
  rewardsEnabled: {
    includeInStateLogs: true,
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
};

/**
 * Get the default state for the RewardsController
 */
export const getRewardsControllerDefaultState = (): RewardsControllerState => ({
  rewardsActiveAccount: null,
  rewardsAccounts: {},
  rewardsSubscriptions: {},
  rewardsSeasons: {},
  rewardsSeasonStatuses: {},
  rewardsSubscriptionTokens: {},
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
  #geoLocation: RewardsGeoMetadata | null = null;

  #isDisabled: () => boolean;

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
   * Combine season metadata and season state into a SeasonStatusDto
   */
  convertToSeasonStatusDto(
    seasonMetadata: SeasonDtoState,
    seasonState: SeasonStateDto,
  ): SeasonStatusDto {
    return {
      season: {
        id: seasonMetadata.id,
        name: seasonMetadata.name,
        startDate: new Date(seasonMetadata.startDate),
        endDate: new Date(seasonMetadata.endDate),
        tiers: seasonMetadata.tiers,
      },
      balance: {
        total: seasonState.balance,
        updatedAt: seasonState.updatedAt,
      },
      currentTierId: seasonState.currentTierId,
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
        updatedAt: seasonStatus.balance.updatedAt?.getTime(),
      },
      tier: tierState,
      lastFetched: Date.now(),
    };
  }

  constructor({
    messenger,
    state,
    isDisabled,
  }: {
    messenger: RewardsControllerMessenger;
    state?: Partial<RewardsControllerState>;
    isDisabled: () => boolean;
  }) {
    super({
      name: controllerName,
      metadata,
      messenger,
      state: {
        ...defaultRewardsControllerState,
        ...state,
      },
    });

    this.#registerActionHandlers();
    this.#initializeEventSubscriptions();
    this.#isDisabled = isDisabled;
  }

  /**
   * Register action handlers for this controller
   */
  #registerActionHandlers(): void {
    this.messenger.registerActionHandler(
      'RewardsController:getHasAccountOptedIn',
      this.getHasAccountOptedIn.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:estimatePoints',
      this.estimatePoints.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:isRewardsFeatureEnabled',
      this.isRewardsFeatureEnabled.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getSeasonMetadata',
      this.getSeasonMetadata.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getSeasonStatus',
      this.getSeasonStatus.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:optIn',
      this.optIn.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getGeoRewardsMetadata',
      this.getRewardsGeoMetadata.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:validateReferralCode',
      this.validateReferralCode.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:linkAccountToSubscriptionCandidate',
      this.linkAccountToSubscriptionCandidate.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:linkAccountsToSubscriptionCandidate',
      this.linkAccountsToSubscriptionCandidate.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getCandidateSubscriptionId',
      this.getCandidateSubscriptionId.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getOptInStatus',
      this.getOptInStatus.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:isOptInSupported',
      this.isOptInSupported.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getActualSubscriptionId',
      this.getActualSubscriptionId.bind(this),
    );
    this.messenger.registerActionHandler(
      'RewardsController:getFirstSubscriptionId',
      this.getFirstSubscriptionId.bind(this),
    );
  }

  /**
   * Initialize event subscriptions based on feature flag state
   */
  #initializeEventSubscriptions(): void {
    // Subscribe to account changes for silent authentication
    this.messenger.subscribe(
      'AccountTreeController:selectedAccountGroupChange',
      () => this.handleAuthenticationTrigger('Account Group changed'),
    );

    // Subscribe to KeyringController unlock events to retry silent auth
    this.messenger.subscribe('KeyringController:unlock', () =>
      this.handleAuthenticationTrigger('KeyringController unlocked'),
    );
  }

  /**
   * Reset controller state to default
   */
  resetState(): void {
    this.update(() => getRewardsControllerDefaultState());
  }

  /**
   * Get account state for a given CAIP-10 address
   */
  #getAccountState(account: CaipAccountId): RewardsAccountState | null {
    let accState = null;
    if (account?.startsWith('eip155')) {
      accState =
        this.state.rewardsAccounts[
          `eip155:0:${account.split(':')[2]?.toLowerCase()}`
        ] || this.state.rewardsAccounts[`eip155:0:${account.split(':')[2]}`];
    }
    if (!accState) {
      accState = this.state.rewardsAccounts[account];
    }
    return accState || null;
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
    if (!this.state.rewardsSubscriptions) {
      return null;
    }
    const subscriptionIds = Object.keys(this.state.rewardsSubscriptions);
    return subscriptionIds.length > 0 ? subscriptionIds[0] : null;
  }

  /**
   * Create composite key for state storage
   */
  #createSeasonSubscriptionCompositeKey(
    seasonId: string,
    subscriptionId: string,
  ): string {
    return `${seasonId}:${subscriptionId}`;
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
        this.messenger.call.bind(
          this.messenger,
          'SnapController:handleRequest',
        ) as unknown as HandleSnapRequest['handler'],
        account.id,
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
    const signature = await this.messenger.call(
      'KeyringController:signPersonalMessage',
      {
        data: hexMessage,
        from: account.address,
      },
    );
    return signature;
  }

  /**
   * Handle authentication triggers (account changes, keyring unlock)
   */
  async handleAuthenticationTrigger(_reason?: string): Promise<void> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();

    if (!rewardsEnabled) {
      await this.performSilentAuth(null, true, true);
      return;
    }

    try {
      const accounts = this.messenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
      );

      if (!accounts || accounts.length === 0) {
        await this.performSilentAuth(null, true, true);
      } else {
        const sortedAccounts = sortAccounts(accounts);

        try {
          // Prefer to get opt in status in bulk for sorted accounts.
          await this.getOptInStatus({
            addresses: sortedAccounts.map((account) => account.address),
          });
        } catch {
          // Failed to get opt in status in bulk for sorted accounts, let silent auth do it individually
        }

        // Try silent auth on each account until one succeeds
        let successAccount: InternalAccount | null = null;
        for (const account of sortedAccounts) {
          try {
            const subscriptionId = await this.performSilentAuth(
              account,
              false,
              true,
            );
            if (subscriptionId && !successAccount) {
              successAccount = account;
            }
          } catch {
            // Continue to next account
          }
        }

        // Set the active account to the first successful account or the first account in the sorted accounts array
        const activeAccountCandidate: InternalAccount =
          successAccount || sortedAccounts[0];
        if (activeAccountCandidate) {
          const caipAccount = this.convertInternalAccountToCaipAccountId(
            activeAccountCandidate,
          );
          if (caipAccount) {
            const accountState = this.#getAccountState(caipAccount);
            if (accountState) {
              this.update((state: RewardsControllerState) => {
                state.rewardsActiveAccount = accountState;
              });
            }
          }
        }
      }
    } catch {
      // Silent authentication failed
    }
  }

  /**
   * Check if silent authentication should be skipped
   */
  shouldSkipSilentAuth(
    account: CaipAccountId,
    internalAccount: InternalAccount,
  ): boolean {
    // Skip if opt-in is not supported (e.g., hardware wallets, unsupported account types)
    if (!this.isOptInSupported(internalAccount)) {
      return true;
    }

    const accountState = this.#getAccountState(account);
    if (accountState) {
      if (accountState.hasOptedIn === false) {
        if (!accountState.lastFreshOptInStatusCheck) {
          return false;
        }

        return (
          Date.now() - accountState.lastFreshOptInStatusCheck <=
          NOT_OPTED_IN_OIS_STALE_CACHE_THRESHOLD_MS
        );
      }

      return (
        Boolean(accountState.subscriptionId) &&
        Boolean(
          this.#getSubscriptionToken(accountState.subscriptionId as string),
        )
      );
    }

    return false;
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

  #storeSubscriptionToken(subscriptionId: string, token: string): void {
    this.update((state: RewardsControllerState) => {
      state.rewardsSubscriptionTokens[subscriptionId] = token;
    });
  }

  #getSubscriptionToken(subscriptionId: string): string | undefined {
    return this.state.rewardsSubscriptionTokens[subscriptionId];
  }

  /**
   * Perform silent authentication for the given address
   */
  async performSilentAuth(
    internalAccount?: InternalAccount | null,
    shouldBecomeActiveAccount = true,
    respectSkipSilentAuth = true,
  ): Promise<string | null> {
    if (!internalAccount) {
      if (shouldBecomeActiveAccount) {
        this.update((state: RewardsControllerState) => {
          state.rewardsActiveAccount = null;
        });
      }
      return null;
    }

    const account: CaipAccountId | null =
      this.convertInternalAccountToCaipAccountId(internalAccount);

    const shouldSkip = account
      ? this.shouldSkipSilentAuth(account, internalAccount)
      : false;

    if (shouldSkip && respectSkipSilentAuth) {
      // This means that we'll have a record for this account
      let accountState = this.#getAccountState(account as CaipAccountId);
      if (accountState) {
        // Update last authenticated account
        this.update((state: RewardsControllerState) => {
          if (shouldBecomeActiveAccount) {
            state.rewardsActiveAccount = accountState;
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
          state.rewardsAccounts[account as CaipAccountId] =
            accountState as RewardsAccountState;
          if (shouldBecomeActiveAccount) {
            state.rewardsActiveAccount = accountState;
          }
        });
      }
      return accountState?.subscriptionId || null;
    }

    let subscription: SubscriptionDto | null = null;
    let authUnexpectedError = false;

    if (respectSkipSilentAuth && !shouldSkip) {
      // First, check opt-in status before attempting login
      try {
        const optInStatusResult = await this.getOptInStatus({
          addresses: [internalAccount.address],
        });

        // Check if the account has not opted in (result is false)
        if (optInStatusResult.ois && optInStatusResult.ois[0] === false) {
          // Account hasn't opted in, don't proceed with login
          subscription = null;
          // Update state to reflect not opted in
          this.update((state: RewardsControllerState) => {
            if (!account) {
              return;
            }
            const accountState: RewardsAccountState = {
              account,
              hasOptedIn: false,
              subscriptionId: null,
              perpsFeeDiscount: null,
              lastPerpsDiscountRateFetched: null,
              lastFreshOptInStatusCheck: Date.now(),
            };
            state.rewardsAccounts[account] = accountState;
            if (shouldBecomeActiveAccount) {
              state.rewardsActiveAccount = accountState;
            }
          });

          return null;
        }
      } catch {
        // Continue with silent login attempt
      }
    }

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
          return await this.messenger.call('RewardsDataService:login', {
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

      // Store the session token for this subscription
      this.#storeSubscriptionToken(subscription.id, loginResponse.sessionId);
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
        state.rewardsAccounts[account] = accountState;
        if (shouldBecomeActiveAccount) {
          state.rewardsActiveAccount = accountState;
        }

        if (subscription) {
          state.rewardsSubscriptions[subscription.id] = subscription;
        }
      });
    }

    return subscription?.id || null;
  }

  /**
   * Check if the given account (caip-10 format) has opted in to rewards
   *
   * @param account - The account address in CAIP-10 format
   * @returns Promise<boolean> - True if the account has opted in, false otherwise
   */
  async getHasAccountOptedIn(account: CaipAccountId): Promise<boolean> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return false;
    }
    return this.#getAccountState(account)?.hasOptedIn ?? false;
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
            // Check if account is not opted in and needs a recheck
            const shouldRecheckFreshIfNotOptedIn =
              !accountState.lastFreshOptInStatusCheck ||
              Date.now() - accountState.lastFreshOptInStatusCheck >
                NOT_OPTED_IN_OIS_STALE_CACHE_THRESHOLD_MS;
            if (
              accountState.hasOptedIn === false &&
              shouldRecheckFreshIfNotOptedIn
            ) {
              // Force a fresh check for this not-opted-in account
              addressesNeedingFresh.push(address);
              continue;
            }

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
    if (!this.isRewardsFeatureEnabled()) {
      // Return empty arrays when feature flag is disabled
      return {
        ois: params.addresses.map(() => false),
        sids: params.addresses.map(() => null),
      };
    }

    try {
      // Get all internal accounts to convert addresses to CAIP format
      const allAccounts = this.messenger.call(
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
        const freshResponse = await this.messenger.call(
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
              const lastFreshOptInStatusCheck = Date.now();
              this.update((state: RewardsControllerState) => {
                // Update or create account state with fresh opt-in status and subscription ID
                if (state.rewardsAccounts[caipAccount]) {
                  state.rewardsAccounts[caipAccount].hasOptedIn = hasOptedIn;
                  state.rewardsAccounts[caipAccount].subscriptionId =
                    subscriptionId;
                  state.rewardsAccounts[caipAccount].lastFreshOptInStatusCheck =
                    lastFreshOptInStatusCheck;
                } else {
                  state.rewardsAccounts[caipAccount] = {
                    account: caipAccount,
                    hasOptedIn,
                    subscriptionId,
                    perpsFeeDiscount: null,
                    lastPerpsDiscountRateFetched: null,
                    lastFreshOptInStatusCheck,
                  };
                }

                if (state.rewardsActiveAccount?.account === caipAccount) {
                  state.rewardsActiveAccount.hasOptedIn = hasOptedIn;
                  state.rewardsActiveAccount.subscriptionId = subscriptionId;
                  state.rewardsActiveAccount.lastFreshOptInStatusCheck =
                    lastFreshOptInStatusCheck;
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
    if (!this.isRewardsFeatureEnabled()) {
      return { pointsEstimate: 0, bonusBips: 0 };
    }
    try {
      const estimatedPoints = await this.messenger.call(
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
    return !this.#isDisabled();
  }

  /**
   * Get season metadata with caching. This fetches and caches the season metadata including id, name, dates, and tiers.
   *
   * @param type - The type of season to get
   * @returns Promise<SeasonDtoState> - The season metadata
   */
  async getSeasonMetadata(
    type: 'current' | 'next' = 'current',
  ): Promise<SeasonDtoState> {
    const result = await wrapWithCache<SeasonDtoState>({
      key: type,
      ttl: SEASON_METADATA_CACHE_THRESHOLD_MS,
      readCache: (key) => {
        const cached = this.state.rewardsSeasons[key] || undefined;
        if (!cached) {
          return undefined;
        }
        return {
          payload: cached,
          lastFetched: cached.lastFetched,
        };
      },

      fetchFresh: async () => {
        // Get discover seasons to find if this season has a valid start date
        const discoverSeasons = (await this.messenger.call(
          'RewardsDataService:getDiscoverSeasons',
        )) as DiscoverSeasonsDto;

        // Check if the requested season is either current or next
        let seasonInfo = null;
        if (type === 'current') {
          seasonInfo = discoverSeasons.current;
        } else if (type === 'next') {
          seasonInfo = discoverSeasons.next;
        }

        // If found with valid start date, fetch metadata and populate cache
        if (seasonInfo?.startDate) {
          // Fetch season metadata
          const seasonMetadata = (await this.messenger.call(
            'RewardsDataService:getSeasonMetadata',
            seasonInfo.id,
          )) as SeasonMetadataDto;

          // Convert to state format
          const seasonStateFromMetadata = this.#convertSeasonToState({
            id: seasonMetadata.id,
            name: seasonMetadata.name,
            startDate: seasonMetadata.startDate,
            endDate: seasonMetadata.endDate,
            tiers: seasonMetadata.tiers,
          });

          // Add lastFetched timestamp

          const seasonStateWithTimestamp = {
            ...seasonStateFromMetadata,
            lastFetched: Date.now(),
          };

          return seasonStateWithTimestamp;
        }

        throw new Error(
          `No valid season metadata could be found for type: ${type}`,
        );
      },

      writeCache: (key, value) => {
        this.update((state: RewardsControllerState) => {
          state.rewardsSeasons[key] = value;

          state.rewardsSeasons[value.id] = value;
        });
      },
    });

    return result;
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
    seasonId: string,
  ): Promise<SeasonStatusState | null> {
    if (!this.isRewardsFeatureEnabled()) {
      return null;
    }

    const season = this.state.rewardsSeasons[seasonId];
    if (!season) {
      throw new Error(
        `Failed to get season status: season not found for seasonId: ${seasonId}`,
      );
    }

    const result = await wrapWithCache<SeasonStatusState>({
      key: this.#createSeasonSubscriptionCompositeKey(seasonId, subscriptionId),
      ttl: SEASON_STATUS_CACHE_THRESHOLD_MS,
      readCache: (key) => {
        const cached = this.state.rewardsSeasonStatuses[key] || undefined;
        if (!cached) {
          return undefined;
        }
        return { payload: cached, lastFetched: cached.lastFetched };
      },
      fetchFresh: async () => {
        try {
          const subscriptionToken = this.#getSubscriptionToken(subscriptionId);
          if (!subscriptionToken) {
            throw new AuthorizationFailedError(
              `No subscription token found for subscription ID: ${subscriptionId}`,
            );
          }
          // Now fetch season status (balance, currentTierId, etc.)
          const seasonState = await this.messenger.call(
            'RewardsDataService:getSeasonStatus',
            seasonId,
            subscriptionToken,
          );
          // Combine all data into SeasonStatusDto
          const seasonStatus = this.convertToSeasonStatusDto(
            season,
            seasonState,
          );
          return this.#convertSeasonStatusToSubscriptionState(seasonStatus);
        } catch (error) {
          if (error instanceof AuthorizationFailedError) {
            // Attempt to reauth with a valid account.
            try {
              if (
                this.state.rewardsActiveAccount?.subscriptionId ===
                subscriptionId
              ) {
                const account = await this.messenger.call(
                  'AccountsController:getSelectedMultichainAccount',
                );
                await this.performSilentAuth(account, false, false); // try and auth.
              } else if (
                this.state.rewardsAccounts &&
                Object.values(this.state.rewardsAccounts).length > 0
              ) {
                const accountForSub = Object.values(
                  this.state.rewardsAccounts,
                ).find((acc) => acc.subscriptionId === subscriptionId);
                if (accountForSub) {
                  const accounts = await this.messenger.call(
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
                    await this.performSilentAuth(
                      intAccountForSub as InternalAccount,
                      false,
                      false,
                    );
                  }
                }
              }
              // Fetch season status again
              const subscriptionToken =
                this.#getSubscriptionToken(subscriptionId);
              if (!subscriptionToken) {
                throw new Error(
                  `No subscription token found for subscription ID: ${subscriptionId}`,
                );
              }
              // Now fetch season status (balance, currentTierId, etc.)
              const seasonState = await this.messenger.call(
                'RewardsDataService:getSeasonStatus',
                season.id,
                subscriptionToken,
              );
              // Combine all data into SeasonStatusDto
              const seasonStatus = this.convertToSeasonStatusDto(
                season,
                seasonState,
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
          } else if (error instanceof SeasonNotFoundError) {
            this.update((state: RewardsControllerState) => {
              state.rewardsSeasons = {};
            });
            throw error;
          }
          log.error(
            'RewardsController: Failed to get season status:',
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
      },
      writeCache: (key, subscriptionSeasonStatus) => {
        this.update((state: RewardsControllerState) => {
          // Update season status with composite key
          state.rewardsSeasonStatuses[key] = subscriptionSeasonStatus;
        });
      },
    });

    return result;
  }

  invalidateAccountsAndSubscriptions() {
    this.update((state: RewardsControllerState) => {
      if (state.rewardsActiveAccount) {
        state.rewardsActiveAccount = {
          ...state.rewardsActiveAccount,
          hasOptedIn: false,
          subscriptionId: null,
          lastFreshOptInStatusCheck: null,
          account: state.rewardsActiveAccount.account, // Ensure account is always present (never undefined)
        };
      }
      state.rewardsAccounts = {};
      state.rewardsSubscriptions = {};
      state.rewardsSubscriptionTokens = {};
    });
  }

  /**
   * Perform the complete opt-in process for rewards
   *
   * @param accounts - The accounts to opt in
   * @param referralCode - Optional referral code
   */
  async optIn(
    accounts: InternalAccount[],
    referralCode?: string,
  ): Promise<string | null> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return null;
    }

    if (!accounts || accounts.length === 0) {
      return null;
    }

    // Sort accounts using utility function
    const sortedAccounts = sortAccounts(accounts);

    // Try to opt in iteratively
    let successfulAccount: InternalAccount | null = null;
    let optinResult: {
      subscription: SubscriptionDto;
      sessionId: string;
    } | null = null;

    for (const accountToTry of sortedAccounts) {
      try {
        optinResult = await this.#optIn(accountToTry, referralCode);
      } catch {
        // Allow one failure to pass through
      }

      if (optinResult) {
        successfulAccount = accountToTry;
        break;
      }
    }

    if (!successfulAccount || !optinResult) {
      throw new Error('Failed to opt in any account from the account group');
    }

    // Link all other accounts to the successful subscription
    const remainingAccounts = sortedAccounts.filter(
      (accountToFilter: InternalAccount) =>
        accountToFilter.address !== successfulAccount?.address,
    );

    if (remainingAccounts.length > 0) {
      await this.linkAccountsToSubscriptionCandidate(remainingAccounts);
    }

    return optinResult?.subscription.id || null;
  }

  /**
   * Private method to perform opt-in for a single internal account (using mobile opt-in logic)
   *
   * @param account - The internal account to opt in
   * @param referralCode - Optional referral code
   * @returns Promise with subscription data or null if failed
   */
  async #optIn(
    account: InternalAccount,
    referralCode?: string,
  ): Promise<{ subscription: SubscriptionDto; sessionId: string } | null> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return null;
    }
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
        return await this.messenger.call('RewardsDataService:mobileOptin', {
          account: account.address,
          timestamp: ts,
          signature: sig as `0x${string}`,
          referralCode,
        });
      } catch (error) {
        // Check if it's an InvalidTimestampError and we haven't exceeded retry attempts
        if (
          error instanceof InvalidTimestampError &&
          retryAttempt < MAX_RETRY_ATTEMPTS
        ) {
          retryAttempt += 1;
          // Use the timestamp from the error for retry
          timestamp = error.timestamp;
          signature = await this.#signRewardsMessage(account, timestamp);
          return await executeMobileOptin(timestamp, signature);
        }
        // Check if it's an AccountAlreadyRegisteredError
        if (error instanceof AccountAlreadyRegisteredError) {
          // Try to perform silent auth for this account
          const subscriptionId = await this.performSilentAuth(
            account,
            false,
            false,
          );

          // If silent auth returned a subscription ID, recover with login response
          if (
            subscriptionId &&
            this.state.rewardsSubscriptions[subscriptionId]
          ) {
            const subscription =
              this.state.rewardsSubscriptions[subscriptionId];
            const subscriptionToken =
              this.#getSubscriptionToken(subscriptionId);
            if (subscriptionToken) {
              return {
                sessionId: subscriptionToken,
                subscription,
              };
            }
          }
        }
        throw error;
      }
    };

    const optinResponse = await executeMobileOptin(timestamp, signature);
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
      const accountState: RewardsAccountState = {
        account: caipAccount,
        hasOptedIn: true,
        subscriptionId: optinResponse.subscription.id,
        perpsFeeDiscount: null,
        lastPerpsDiscountRateFetched: null,
      };
      if (
        state.rewardsActiveAccount &&
        state.rewardsActiveAccount.account === caipAccount
      ) {
        state.rewardsActiveAccount = accountState;
      }

      state.rewardsAccounts[caipAccount] = accountState;
      state.rewardsSubscriptions[optinResponse.subscription.id] =
        optinResponse.subscription;
    });
    return {
      subscription: optinResponse.subscription,
      sessionId: optinResponse.sessionId,
    };
  }

  /**
   * Get geo rewards metadata including location and opt-in support status
   *
   * @returns Promise<GeoRewardsMetadata> - The geo rewards metadata
   */
  async getRewardsGeoMetadata(): Promise<RewardsGeoMetadata> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return {
        geoLocation: 'UNKNOWN',
        optinAllowedForGeo: false,
      };
    }

    if (this.#geoLocation) {
      return this.#geoLocation;
    }

    try {
      // Get geo location from data service
      const geoLocation = await this.messenger.call(
        'RewardsDataService:fetchGeoLocation',
      );

      // Check if the location is supported (not in blocked regions)
      const optinAllowedForGeo = !DEFAULT_BLOCKED_REGIONS.some(
        (blockedRegion) => geoLocation.startsWith(blockedRegion),
      );

      const result: RewardsGeoMetadata = {
        geoLocation,
        optinAllowedForGeo,
      };

      this.#geoLocation = result;
      return result;
    } catch (error) {
      // Return fallback metadata on error
      return {
        geoLocation: 'UNKNOWN',
        optinAllowedForGeo: true,
      };
    }
  }

  /**
   * Validate a referral code
   *
   * @param code - The referral code to validate
   * @returns Promise<boolean> - True if the code is valid, false otherwise
   */
  async validateReferralCode(code: string): Promise<boolean> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return false;
    }

    if (!code.trim()) {
      return false;
    }

    if (code.length !== 6) {
      return false;
    }

    const response = await this.messenger.call(
      'RewardsDataService:validateReferralCode',
      code,
    );
    return response.valid;
  }

  /**
   * Get candidate subscription ID with fallback logic
   *
   * @returns Promise<string | null> - The subscription ID or null if none found
   */
  async getCandidateSubscriptionId(): Promise<string | null> {
    if (!this.isRewardsFeatureEnabled()) {
      return null;
    }

    // First, check if there's an active account with a subscription
    if (this.state.rewardsActiveAccount?.subscriptionId) {
      return this.state.rewardsActiveAccount.subscriptionId;
    }

    // Fallback to the first subscription ID from the subscriptions map
    const subscriptionIds = Object.keys(this.state.rewardsSubscriptions);
    if (subscriptionIds.length > 0) {
      return subscriptionIds[0];
    }

    // If no subscriptions found, call optinstatus for all internal accounts
    try {
      const allAccounts = this.messenger.call(
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
        return null;
      }

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
          ? this.state.rewardsSubscriptionTokens[subscriptionId]
          : undefined;
        if (
          subscriptionId &&
          Boolean(sessionToken) &&
          this.state.rewardsSubscriptions[subscriptionId]
        ) {
          return subscriptionId;
        }
        try {
          silentAuthAttempts += 1;
          subscriptionId = await this.performSilentAuth(
            account,
            false, // shouldBecomeActiveAccount = false
            false, // respectSkipSilentAuth = false
          );
          if (subscriptionId) {
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
    invalidateRelatedData: boolean = true,
  ): Promise<boolean> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
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
      const existingSubscription =
        this.state.rewardsSubscriptions[existingAccountState.subscriptionId];
      if (existingSubscription) {
        return true;
      }
    }

    // Get candidate subscription ID using the new method
    const candidateSubscriptionId = await this.getCandidateSubscriptionId();
    if (!candidateSubscriptionId) {
      throw new Error('No valid subscription found to link account to');
    }

    if (!this.isOptInSupported(account)) {
      return false;
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
          const subscriptionToken = this.#getSubscriptionToken(
            candidateSubscriptionId,
          );
          if (!subscriptionToken) {
            throw new Error(
              `No subscription token found for subscription ID: ${candidateSubscriptionId}`,
            );
          }
          return await this.messenger.call(
            'RewardsDataService:mobileJoin',
            {
              account: account.address,
              timestamp: ts,
              signature: sig as `0x${string}`,
            },
            subscriptionToken,
          );
        } catch (error) {
          // Check if it's an InvalidTimestampError and we haven't exceeded retry attempts
          if (
            error instanceof InvalidTimestampError &&
            retryAttempt < MAX_RETRY_ATTEMPTS
          ) {
            retryAttempt += 1;
            // Use the timestamp from the error for retry
            timestamp = error.timestamp;
            signature = await this.#signRewardsMessage(account, timestamp);
            return await executeMobileJoin(timestamp, signature);
          }
          if (error instanceof AccountAlreadyRegisteredError) {
            // Try to perform silent auth for this account
            const subscriptionId = await this.performSilentAuth(
              account,
              false,
              false,
            );

            // If silent auth returned a subscription ID, return the subscription from cache
            if (
              subscriptionId &&
              this.state.rewardsSubscriptions[subscriptionId]
            ) {
              return this.state.rewardsSubscriptions[subscriptionId];
            }
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
        state.rewardsAccounts[caipAccount] = {
          account: caipAccount,
          hasOptedIn: true, // via linking this is now opted in.
          subscriptionId: updatedSubscription.id,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        };
        if (state.rewardsActiveAccount?.account === caipAccount) {
          state.rewardsActiveAccount = state.rewardsAccounts[caipAccount];
        }
      });

      // Only invalidate related data if requested
      if (invalidateRelatedData) {
        // Invalidate cache for the linked account
        this.invalidateSubscriptionCache(updatedSubscription.id);

        // Emit event to trigger UI refresh
        this.messenger.publish('RewardsController:accountLinked', {
          subscriptionId: updatedSubscription.id,
          account: caipAccount,
        });
      }

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
   * Link multiple accounts to a subscription candidate
   *
   * @param accounts - Array of accounts to link to the subscription
   */
  async linkAccountsToSubscriptionCandidate(
    accounts: InternalAccount[],
  ): Promise<{ account: InternalAccount; success: boolean }[]> {
    const rewardsEnabled = this.isRewardsFeatureEnabled();
    if (!rewardsEnabled) {
      return accounts.map((account) => ({ account, success: false }));
    }

    if (accounts.length === 0) {
      return [];
    }

    let lastSuccessfullyLinked: RewardsAccountState | null = null;
    const results: { account: InternalAccount; success: boolean }[] = [];

    for (const accountToLink of accounts) {
      try {
        const caipAccountAccountToLink =
          this.convertInternalAccountToCaipAccountId(accountToLink);
        const existingAccountState = this.#getAccountState(
          caipAccountAccountToLink as CaipAccountId,
        );
        if (existingAccountState?.subscriptionId) {
          continue;
        }

        const success = await this.linkAccountToSubscriptionCandidate(
          accountToLink,
          false, // we will invalidate at the end of the loop
        );

        if (success) {
          const accountStateForLinked = this.#getAccountState(
            caipAccountAccountToLink as CaipAccountId,
          );
          if (accountStateForLinked) {
            lastSuccessfullyLinked = accountStateForLinked;
          }
          results.push({ account: accountToLink, success });
        } else {
          results.push({ account: accountToLink, success: false });
        }
      } catch {
        // Continue with other accounts even if one fails
        results.push({ account: accountToLink, success: false });
      }
    }

    // Invalidate cache and emit event if at least one account was successfully linked
    if (lastSuccessfullyLinked?.subscriptionId) {
      // Invalidate cache for the linked account
      this.invalidateSubscriptionCache(lastSuccessfullyLinked.subscriptionId);

      // Emit event to trigger UI refresh
      this.messenger.publish('RewardsController:accountLinked', {
        subscriptionId: lastSuccessfullyLinked.subscriptionId,
        account: lastSuccessfullyLinked.account,
      });
    }

    return results;
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
        delete state.rewardsSeasonStatuses[compositeKey];
      });
    } else {
      // Invalidate all seasons for this subscription
      this.update((state: RewardsControllerState) => {
        Object.keys(state.rewardsSeasonStatuses).forEach((key) => {
          if (key.includes(subscriptionId)) {
            delete state.rewardsSeasonStatuses[key];
          }
        });
      });
    }
  }
}
