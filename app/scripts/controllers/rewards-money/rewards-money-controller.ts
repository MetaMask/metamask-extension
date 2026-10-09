import { BaseController } from '@metamask/base-controller';
import type {
  GetReferralMeDto,
  PerpsRebateTrade,
  RebateQuoteBody,
  RebateQuoteResponse,
  ReferralMeDto,
  RegisterRefereeDto,
  SwapsRebateBridgeQuote,
} from '../../../../shared/types/rewards-money';
import { wrapWithCache } from '../rewards/rewards-controller';
import {
  REFERRAL_ME_CACHE_THRESHOLD_MS,
  REWARDS_MONEY_CONTROLLER_NAME,
  type RewardsMoneyControllerMessenger,
  type RewardsMoneyControllerState,
} from './rewards-money-controller-types';

const MESSENGER_EXPOSED_METHODS = [
  'getReferralMe',
  'validateReferralCode',
  'registerReferee',
  'getSwapsRebateQuote',
  'getPerpsRebateQuote',
] as const;

/**
 * A Hyperliquid perp: `BTC`, or a builder-deployed `xyz:TSLA`. Spot (`@107`)
 * never matches. `side` is already `BUY` | `SELL` by its type.
 */
const PERPS_REBATE_TRADE_COIN = /^(?:[a-z0-9]{1,16}:)?[A-Za-z0-9]{1,32}$/u;
const PERPS_REBATE_TRADE_NOTIONAL_USD = /^\d{1,15}(\.\d{1,18})?$/u;

/**
 * Whether the money service would accept this perps quote `trade`. The
 * server refuses the whole quote with a `400` otherwise, even though it drops
 * the trade.
 *
 * @param trade - The trade a caller passed.
 * @returns True when every field passes the server's checks.
 */
function isSendablePerpsRebateTrade(trade: PerpsRebateTrade): boolean {
  return (
    PERPS_REBATE_TRADE_COIN.test(trade.coin) &&
    PERPS_REBATE_TRADE_NOTIONAL_USD.test(trade.notionalUsd)
  );
}

/**
 * The Hydra profile changed while a referral-me read was in flight.
 * `data.sessionChanged` survives the background RPC boundary.
 */
export class RewardsMoneySessionChangedError extends Error {
  readonly profileId: string | undefined;

  readonly data: { sessionChanged: true; profileId?: string };

  constructor(profileId: string | undefined) {
    super('Rewards Money session changed');
    this.name = 'RewardsMoneySessionChangedError';
    this.profileId = profileId;
    this.data = { sessionChanged: true, profileId };
  }
}

const metadata = {
  excludedRegions: {
    includeInStateLogs: false,
    persist: false,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
};

type ReferralMeCacheEntry = {
  payload: ReferralMeDto;
  lastFetched: number;
};

/**
 * Returns a fresh default state. `excludedRegions` stays null until the first
 * settled referral-me read so callers fail open.
 *
 * @returns The default RewardsMoneyController state.
 */
export function getDefaultRewardsMoneyControllerState(): RewardsMoneyControllerState {
  return {
    excludedRegions: null,
  };
}

/**
 * Referral accept for Rewards Money: referral me, code validation, and
 * referee registration. The full payload stays in memory. Only
 * `excludedRegions` is published for the geo selector.
 */
export class RewardsMoneyController extends BaseController<
  typeof REWARDS_MONEY_CONTROLLER_NAME,
  RewardsMoneyControllerState,
  RewardsMoneyControllerMessenger
> {
  readonly #isDisabled: () => boolean;

  readonly #referralMeCache = new Map<string, ReferralMeCacheEntry>();

  readonly #referralMeGeneration = new Map<string, number>();

  constructor({
    messenger,
    state,
    isDisabled,
  }: {
    messenger: RewardsMoneyControllerMessenger;
    state?: Partial<RewardsMoneyControllerState>;
    isDisabled: () => boolean;
  }) {
    super({
      name: REWARDS_MONEY_CONTROLLER_NAME,
      metadata,
      messenger,
      state: {
        ...getDefaultRewardsMoneyControllerState(),
        ...state,
      },
    });

    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
    this.#isDisabled = isDisabled;
  }

  /**
   * Loads referral me for the current Hydra profile.
   *
   * @param params - Pass `forceFresh` to skip the in-memory cache.
   * @returns The referral-me payload.
   */
  async getReferralMe(params: GetReferralMeDto = {}): Promise<ReferralMeDto> {
    if (this.#isDisabled()) {
      throw new Error('Rewards Money is disabled');
    }

    const profileId = await this.#getProfileId();
    let requestGeneration = 0;
    const fetchFresh = async () => {
      requestGeneration = this.#startReferralMeRequest(profileId);
      const payload = await this.messenger.call(
        'RewardsMoneyDataService:getReferralMe',
      );
      const currentProfileId = await this.#readProfileId();
      if (currentProfileId !== profileId) {
        throw new RewardsMoneySessionChangedError(currentProfileId);
      }
      return payload;
    };

    if (params.forceFresh) {
      const fresh = await fetchFresh();
      this.#writeReferralMeIfLatest(profileId, fresh, requestGeneration);
      return fresh;
    }

    return wrapWithCache<ReferralMeDto>({
      key: profileId,
      ttl: REFERRAL_ME_CACHE_THRESHOLD_MS,
      readCache: (key) => this.#referralMeCache.get(key),
      fetchFresh,
      writeCache: (key, payload) => {
        this.#writeReferralMeIfLatest(key, payload, requestGeneration);
      },
    });
  }

  /**
   * Checks a referral code without authenticating.
   *
   * @param code - The referral code to validate.
   * @returns Whether the server accepts the code.
   */
  async validateReferralCode(code: string): Promise<{ success: boolean }> {
    if (this.#isDisabled()) {
      throw new Error('Rewards Money is disabled');
    }
    return await this.messenger.call(
      'RewardsMoneyDataService:validateReferralCode',
      code,
    );
  }

  /**
   * Registers the session profile as a referee for `code`.
   *
   * @param params - The referral code.
   */
  async registerReferee(params: RegisterRefereeDto): Promise<void> {
    if (this.#isDisabled()) {
      throw new Error('Rewards Money is disabled');
    }
    await this.messenger.call(
      'RewardsMoneyDataService:registerReferee',
      params,
    );
  }

  /**
   * Rebate a swaps confirmation screen should show. The bridge quote decides
   * fee-token eligibility. Not cached: the rate has to disappear the moment
   * an operator ends the window, and a different quote can name a different
   * fee token.
   *
   * Pass the `quote` of the bridge `QuoteResponse`, not the response. Only
   * its `feeData.metabridge` is sent.
   *
   * A refusal rejects with `RewardsMoneyRebateQuoteError`, a `401` with
   * `RewardsMoneyAuthorizationError`. A timeout or a network failure rejects
   * with a plain `Error`. A `401` is not retried.
   *
   * The confirm button may wait for this first request, for at most 2 to 3
   * seconds. If the quote has not arrived by then, or the request fails,
   * unblock the confirm button and let the user continue with no rebate tag.
   * One quiet retry may run while the screen stays open. Wait
   * `retryAfterSeconds` when the error has one, then add a small random
   * delay: a `503` sends a fixed `Retry-After: 2`, and without that jitter
   * every client retries in the same second. When the header is missing,
   * `retryAfterSeconds` is `undefined` and the caller chooses the wait. Stop
   * after that second attempt, or when the user leaves the screen. A success
   * on the retry shows the rebate tag. The retry does not hold the confirm
   * button. A `429` (`RATE_LIMITED`) shares the profile read budget, 60
   * requests per 30 seconds, with the Earnings reads, so this screen sends
   * the first quote plus that one retry. A `503` (`UNAVAILABLE`) means the
   * server is unavailable, whether the body reason is `SERVER_BUSY` or
   * `JWKS_UNAVAILABLE`.
   *
   * @param quote - The bridge quote the confirmation screen holds.
   * @returns The rebate to show; `eligible: false` means no rebate row.
   */
  getSwapsRebateQuote(
    quote: SwapsRebateBridgeQuote,
  ): Promise<RebateQuoteResponse> {
    return this.#getRebateQuote({
      product: 'swaps',
      quote: { feeData: { metabridge: quote.feeData.metabridge } },
    });
  }

  /**
   * Rebate a perps confirmation screen should show. `trade` is optional and
   * the server drops it today; the answer does not depend on it. A trade the
   * server would refuse (see {@link PerpsRebateTrade}) is left out rather
   * than sent, so it cannot turn the quote into a `400`.
   *
   * A refusal rejects with `RewardsMoneyRebateQuoteError`, a `401` with
   * `RewardsMoneyAuthorizationError`. A timeout or a network failure rejects
   * with a plain `Error`. A `401` is not retried.
   *
   * The confirm button may wait for this first request, for at most 2 to 3
   * seconds. If the quote has not arrived by then, or the request fails,
   * unblock the confirm button and let the user continue with no rebate tag.
   * One quiet retry may run while the screen stays open. Wait
   * `retryAfterSeconds` when the error has one, then add a small random
   * delay: a `503` sends a fixed `Retry-After: 2`, and without that jitter
   * every client retries in the same second. When the header is missing,
   * `retryAfterSeconds` is `undefined` and the caller chooses the wait. Stop
   * after that second attempt, or when the user leaves the screen. A success
   * on the retry shows the rebate tag. The retry does not hold the confirm
   * button. A `429` (`RATE_LIMITED`) shares the profile read budget, 60
   * requests per 30 seconds, with the Earnings reads, so this screen sends
   * the first quote plus that one retry. A `503` (`UNAVAILABLE`) means the
   * server is unavailable, whether the body reason is `SERVER_BUSY` or
   * `JWKS_UNAVAILABLE`.
   *
   * @param trade - What the user is about to trade, when known.
   * @returns The rebate to show; `eligible: false` means no rebate row.
   */
  getPerpsRebateQuote(trade?: PerpsRebateTrade): Promise<RebateQuoteResponse> {
    if (trade === undefined || !isSendablePerpsRebateTrade(trade)) {
      return this.#getRebateQuote({ product: 'perps' });
    }
    return this.#getRebateQuote({
      product: 'perps',
      trade: {
        coin: trade.coin,
        side: trade.side,
        notionalUsd: trade.notionalUsd,
      },
    });
  }

  async #getRebateQuote(body: RebateQuoteBody): Promise<RebateQuoteResponse> {
    if (this.#isDisabled()) {
      throw new Error('Rewards Money is disabled');
    }

    return await this.messenger.call(
      'RewardsMoneyDataService:getRebateQuote',
      body,
    );
  }

  async #getProfileId(): Promise<string> {
    const profileId = await this.#readProfileId();
    if (!profileId) {
      throw new Error('No Hydra profile available for Rewards Money');
    }
    return profileId;
  }

  async #readProfileId(): Promise<string | undefined> {
    const profile = await this.messenger.call(
      'AuthenticationController:getSessionProfile',
    );
    return profile?.profileId;
  }

  #startReferralMeRequest(profileId: string): number {
    const generation = (this.#referralMeGeneration.get(profileId) ?? 0) + 1;
    this.#referralMeGeneration.set(profileId, generation);
    return generation;
  }

  #writeReferralMeIfLatest(
    profileId: string,
    payload: ReferralMeDto,
    requestGeneration: number,
  ): void {
    if (this.#referralMeGeneration.get(profileId) !== requestGeneration) {
      return;
    }
    this.#referralMeCache.set(profileId, {
      payload,
      lastFetched: Date.now(),
    });
    this.update((draft) => {
      draft.excludedRegions = payload.excluded_regions ?? [];
    });
  }
}
