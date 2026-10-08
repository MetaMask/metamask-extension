import { BaseController } from '@metamask/base-controller';
import type {
  GetReferralMeDto,
  ReferralMeDto,
  RegisterRefereeDto,
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
] as const;

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
    return this.messenger.call(
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
