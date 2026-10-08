import { useCallback, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { registerRewardsMoneyReferee } from '../../store/actions';
import { useDispatch } from '../../store/hooks';
import { MONEY_REFERRAL_CODE_UNKNOWN_ERROR } from './useValidateMoneyReferralCode';
import {
  refreshReferralMeWithRetries,
  type FetchReferralMeResult,
} from './useReferralMe';

type Translate = (key: string) => string;

/**
 * Reads the status and body that `RewardsMoneyHttpError` copies onto
 * `error.data` so they survive the background RPC boundary.
 *
 * @param error - The thrown register error.
 * @returns The HTTP status and body text, when present.
 */
function readRewardsMoneyHttpFailure(error: unknown): {
  status?: number;
  bodyText?: string;
} {
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return {};
  }
  const data = (error as { data?: { status?: number; bodyText?: string } })
    .data;
  if (!data || typeof data.status !== 'number') {
    return {};
  }
  return { status: data.status, bodyText: data.bodyText };
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
    return t('rewardsOnboardingReferralCodeError');
  }
  if (status === 409) {
    return t('rewardsMoneyReferralAlreadyReferred');
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
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const accept = useCallback(
    async (code: string): Promise<boolean> => {
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
        await dispatch(registerRewardsMoneyReferee({ code }));
        await refreshReferralMeWithRetries(fetchReferralMe);
        onAccepted();
        return true;
      } catch (error) {
        setErrorMessage(getRegisterRefereeErrorMessage(error, t));
        return false;
      } finally {
        setIsAccepting(false);
      }
    },
    [dispatch, fetchReferralMe, onAccepted, t, validateCode],
  );

  return { isAccepting, errorMessage, accept };
}
