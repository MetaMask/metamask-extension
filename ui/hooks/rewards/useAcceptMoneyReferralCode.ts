import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { useMessenger } from '../useMessenger';
import { MONEY_REFERRAL_CODE_UNKNOWN_ERROR } from './useValidateMoneyReferralCode';
import type { RewardsMoneyInviteMessenger } from './rewards-money-messenger';
import { readRewardsMoneyHttpFailure } from './read-rewards-money-http-failure';
import {
  refreshReferralMeWithRetries,
  type FetchReferralMeResult,
} from './useReferralMe';

type Translate = (key: string) => string;

/**
 * Stable reason a refused Accept was turned away. Sent as Segment
 * `refusal_reason`. Not the localized sheet copy.
 */
export type ReferralRefusalReason =
  | 'invalid_code'
  | 'already_referred'
  | 'own_code'
  | 'kol_cannot_register'
  | 'active_trader'
  | 'restricted_country'
  | 'rate_limited'
  | 'registration_failed';

export type AcceptMoneyReferralCodeResult =
  | { accepted: true }
  | { accepted: false; refusalReason?: ReferralRefusalReason };

/**
 * Maps a refused registration onto the analytics reason for that failure.
 *
 * @param error - The thrown register or validate error, including RPC `data`.
 * @returns The stable reason. A `503` is `registration_failed`.
 */
export function getRegisterRefereeRefusalReason(
  error: unknown,
): ReferralRefusalReason {
  const { status, bodyText } = readRewardsMoneyHttpFailure(error);
  const body = (bodyText ?? '').toLowerCase();

  if (status === 422) {
    return 'invalid_code';
  }
  if (status === 409) {
    return 'already_referred';
  }
  if (status === 403) {
    if (body.includes('own referral code')) {
      return 'own_code';
    }
    if (body.includes('kol cannot register as a referee')) {
      return 'kol_cannot_register';
    }
    if (body.includes('recent trading activity')) {
      return 'active_trader';
    }
    if (
      body.includes('restrictedcountrycode') ||
      body.includes('not available in your country')
    ) {
      return 'restricted_country';
    }
  }
  if (status === 429) {
    return 'rate_limited';
  }
  return 'registration_failed';
}

/**
 * Maps a register-referee failure onto the string the sheet shows.
 *
 * @param error - The thrown register error, including RPC `data`.
 * @param t - Locale lookup.
 * @returns A user-facing refusal, or the generic failure string.
 */
function getRegisterRefereeErrorMessage(error: unknown, t: Translate): string {
  switch (getRegisterRefereeRefusalReason(error)) {
    case 'invalid_code':
      return t('rewardsMoneyReferralCodeError');
    case 'already_referred':
      return t('rewardsMoneyReferralAlreadyReferred');
    case 'own_code':
      return t('rewardsMoneyReferralOwnCode');
    case 'kol_cannot_register':
      return t('rewardsMoneyReferralReferrerCannotBeReferred');
    case 'active_trader':
      return t('rewardsMoneyReferralActiveTrader');
    case 'restricted_country':
      return t('rewardsOnboardingIntroUnsupportedRegionDescription');
    case 'rate_limited':
      return t('rewardsMoneyReferralTooManyTries');
    case 'registration_failed':
      return t('rewardsMoneyReferralSomethingWentWrong');
    default:
      return t('rewardsMoneyReferralSomethingWentWrong');
  }
}

type UseAcceptMoneyReferralCodeOptions = {
  validateCode: (code: string) => Promise<string>;
  fetchReferralMe: (options?: {
    forceFresh?: boolean;
  }) => Promise<FetchReferralMeResult>;
  onAccepted: () => void;
};

type UseAcceptMoneyReferralCodeResult = {
  isAccepting: boolean;
  /** True while a 429 `Retry-After` is still running. Accept stays disabled. */
  isAcceptCoolingDown: boolean;
  errorMessage: string;
  accept: (code: string) => Promise<AcceptMoneyReferralCodeResult>;
};

/**
 * Validates, registers the referee, then refreshes referral me on the sheet's
 * hook instance. A failed read-back still counts as accepted.
 *
 * @param options - Validation, the sheet's referral-me fetch, and success.
 * @param options.validateCode - Immediate validation used before register.
 * @param options.fetchReferralMe - The sheet's referral-me fetch.
 * @param options.onAccepted - Called after registration succeeds.
 * @returns Accept state and the accept function.
 */
export function useAcceptMoneyReferralCode({
  validateCode,
  fetchReferralMe,
  onAccepted,
}: UseAcceptMoneyReferralCodeOptions): UseAcceptMoneyReferralCodeResult {
  const messenger = useMessenger<RewardsMoneyInviteMessenger>();
  const t = useI18nContext();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAcceptCoolingDown, setIsAcceptCoolingDown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isAcceptCoolingDownRef = useRef(false);
  const acceptCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (acceptCooldownRef.current !== null) {
        clearTimeout(acceptCooldownRef.current);
      }
    },
    [],
  );

  const startAcceptCooldown = useCallback((seconds: number) => {
    if (acceptCooldownRef.current !== null) {
      clearTimeout(acceptCooldownRef.current);
    }
    isAcceptCoolingDownRef.current = true;
    setIsAcceptCoolingDown(true);
    acceptCooldownRef.current = setTimeout(() => {
      acceptCooldownRef.current = null;
      isAcceptCoolingDownRef.current = false;
      setIsAcceptCoolingDown(false);
    }, seconds * 1000);
  }, []);

  const noteRefusal = useCallback(
    (error: unknown): ReferralRefusalReason => {
      const failure = readRewardsMoneyHttpFailure(error);
      setErrorMessage(getRegisterRefereeErrorMessage(error, t as Translate));
      if (failure.status === 429 && failure.retryAfterSeconds !== undefined) {
        startAcceptCooldown(failure.retryAfterSeconds);
      }
      return getRegisterRefereeRefusalReason(error);
    },
    [startAcceptCooldown, t],
  );

  const accept = useCallback(
    async (code: string): Promise<AcceptMoneyReferralCodeResult> => {
      if (isAcceptCoolingDownRef.current) {
        return { accepted: false };
      }
      setErrorMessage('');
      let validationError: string;
      try {
        validationError = await validateCode(code);
      } catch (error) {
        return { accepted: false, refusalReason: noteRefusal(error) };
      }
      if (
        validationError &&
        validationError !== MONEY_REFERRAL_CODE_UNKNOWN_ERROR
      ) {
        setErrorMessage(validationError);
        return { accepted: false, refusalReason: 'invalid_code' };
      }

      setIsAccepting(true);
      try {
        await messenger.call('RewardsMoneyController:registerReferee', {
          code,
        });
        await refreshReferralMeWithRetries(fetchReferralMe);
        onAccepted();
        return { accepted: true };
      } catch (error) {
        return { accepted: false, refusalReason: noteRefusal(error) };
      } finally {
        setIsAccepting(false);
      }
    },
    [fetchReferralMe, messenger, noteRefusal, onAccepted, validateCode],
  );

  return { isAccepting, isAcceptCoolingDown, errorMessage, accept };
}
