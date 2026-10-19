import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { useMessenger } from '../useMessenger';
import { isBusyRewardsMoneyRead } from './read-rewards-money-http-failure';
import type { RewardsMoneyInviteMessenger } from './rewards-money-messenger';

const MONEY_REFERRAL_CODE_MIN_LENGTH = 3;

const MONEY_REFERRAL_VALIDATE_DEBOUNCE_MS = 1000;

export const MONEY_REFERRAL_CODE_UNKNOWN_ERROR = 'unknown';

type UseValidateMoneyReferralCodeResult = {
  isValidating: boolean;
  isValid: boolean;
  isUnknownError: boolean;
  isRejectedCode: boolean;
  validateCode: (code: string) => Promise<string>;
};

/**
 * Debounces `GET /referral/validate` while the code is edited.
 * A network failure is unknown, which still allows accept. The register call
 * is the authority. `validateCode` rethrows a `429` or `503` so Accept can
 * ask the user to try again instead of treating the code as invalid.
 *
 * @param code - The normalized code currently in the field.
 * @returns Validation state and a function that validates immediately.
 */
export function useValidateMoneyReferralCode(
  code: string,
): UseValidateMoneyReferralCodeResult {
  const messenger = useMessenger<RewardsMoneyInviteMessenger>();
  const t = useI18nContext();
  const [error, setError] = useState('');
  const [resolvedCode, setResolvedCode] = useState('');
  const requestIdRef = useRef(0);
  const codeIsShort = code.length < MONEY_REFERRAL_CODE_MIN_LENGTH;
  const displayedError = codeIsShort ? '' : error;
  const isValidating = !codeIsShort && resolvedCode !== code;

  const requestValidation = useCallback(
    async (nextCode: string): Promise<string> => {
      if (nextCode.length < MONEY_REFERRAL_CODE_MIN_LENGTH) {
        return '';
      }
      const result = await messenger.call(
        'RewardsMoneyController:validateReferralCode',
        nextCode,
      );
      if (result?.success) {
        return '';
      }
      return t('rewardsMoneyReferralCodeError');
    },
    [messenger, t],
  );

  useEffect(() => {
    if (code.length < MONEY_REFERRAL_CODE_MIN_LENGTH) {
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const timer = setTimeout(() => {
      requestValidation(code)
        .then((nextError) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setError(nextError);
          setResolvedCode(code);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setError(MONEY_REFERRAL_CODE_UNKNOWN_ERROR);
          setResolvedCode(code);
        });
    }, MONEY_REFERRAL_VALIDATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [code, requestValidation]);

  const validateCode = useCallback(
    async (nextCode: string): Promise<string> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setResolvedCode('');
      try {
        const nextError = await requestValidation(nextCode);
        if (requestId === requestIdRef.current) {
          setError(nextError);
          setResolvedCode(nextCode);
        }
        return nextError;
      } catch (caught) {
        if (isBusyRewardsMoneyRead(caught)) {
          throw caught;
        }
        if (requestId === requestIdRef.current) {
          setError(MONEY_REFERRAL_CODE_UNKNOWN_ERROR);
          setResolvedCode(nextCode);
        }
        return MONEY_REFERRAL_CODE_UNKNOWN_ERROR;
      }
    },
    [requestValidation],
  );

  const isUnknownError = displayedError === MONEY_REFERRAL_CODE_UNKNOWN_ERROR;
  const isRejectedCode = Boolean(displayedError) && !isUnknownError;
  const isValid =
    code.length >= MONEY_REFERRAL_CODE_MIN_LENGTH &&
    !isValidating &&
    !isRejectedCode;

  return {
    isValidating,
    isValid,
    isUnknownError,
    isRejectedCode,
    validateCode,
  };
}
