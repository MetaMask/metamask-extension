import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { useMessenger } from '../useMessenger';
import { MONEY_REFERRAL_CODE_UNKNOWN_ERROR } from './useValidateMoneyReferralCode';
import type { RewardsMoneyInviteMessenger } from './rewards-money-messenger';
import {
  refreshReferralMeWithRetries,
  type FetchReferralMeResult,
} from './useReferralMe';

type Translate = (key: string) => string;

/**
 * Reads the status, body, and `Retry-After` that `RewardsMoneyHttpError`
 * copies onto `error.data` so they survive the background RPC boundary.
 *
 * @param error - The thrown register error.
 * @returns The HTTP status, body text, and wait, when present.
 */
function readRewardsMoneyHttpFailure(error: unknown): {
  status?: number;
  bodyText?: string;
  retryAfterSeconds?: number;
} {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return {};
  }
  const { data } = error as {
    data?: {
      status?: number;
      bodyText?: string;
      retryAfterSeconds?: number;
    };
  };
  if (!data || typeof data.status !== 'number') {
    return {};
  }
  const retryAfterSeconds =
    typeof data.retryAfterSeconds === 'number' && data.retryAfterSeconds > 0
      ? data.retryAfterSeconds
      : undefined;
  return { status: data.status, bodyText: data.bodyText, retryAfterSeconds };
}

/**
 * Maps a register-referee failure onto the string the sheet shows.
 *
 * @param error - The thrown register error, including RPC `data`.
 * @param t - Locale lookup.
 * @returns A user-facing refusal, or the generic failure string.
 */
function getRegisterRefereeErrorMessage(error: unknown, t: Translate): string {
  const { status, bodyText } = readRewardsMoneyHttpFailure(error);
  const body = (bodyText ?? '').toLowerCase();

  if (status === 422) {
    return t('rewardsMoneyReferralCodeError');
  }
  if (status === 409) {
    return t('rewardsMoneyReferralAlreadyReferred');
  }
  if (status === 429) {
    return t('rewardsMoneyReferralTooManyTries');
  }
  if (status === 403) {
    if (body.includes('own referral code')) {
      return t('rewardsMoneyReferralOwnCode');
    }
    if (body.includes('kol cannot register as a referee')) {
      return t('rewardsMoneyReferralReferrerCannotBeReferred');
    }
    if (body.includes('recent trading activity')) {
      return t('rewardsMoneyReferralActiveTrader');
    }
    if (
      body.includes('restrictedcountrycode') ||
      body.includes('not available in your country')
    ) {
      return t('rewardsOnboardingIntroUnsupportedRegionDescription');
    }
  }
  return t('rewardsMoneyReferralSomethingWentWrong');
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
  accept: (code: string) => Promise<boolean>;
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

  const accept = useCallback(
    async (code: string): Promise<boolean> => {
      if (isAcceptCoolingDownRef.current) {
        return false;
      }
      setErrorMessage('');
      const validationError = await validateCode(code);
      if (
        validationError &&
        validationError !== MONEY_REFERRAL_CODE_UNKNOWN_ERROR
      ) {
        setErrorMessage(validationError);
        return false;
      }

      setIsAccepting(true);
      try {
        await messenger.call('RewardsMoneyController:registerReferee', {
          code,
        });
        await refreshReferralMeWithRetries(fetchReferralMe);
        onAccepted();
        return true;
      } catch (error) {
        const failure = readRewardsMoneyHttpFailure(error);
        setErrorMessage(getRegisterRefereeErrorMessage(error, t as Translate));
        if (failure.status === 429 && failure.retryAfterSeconds !== undefined) {
          startAcceptCooldown(failure.retryAfterSeconds);
        }
        return false;
      } finally {
        setIsAccepting(false);
      }
    },
    [
      fetchReferralMe,
      messenger,
      onAccepted,
      startAcceptCooldown,
      t,
      validateCode,
    ],
  );

  return { isAccepting, isAcceptCoolingDown, errorMessage, accept };
}
