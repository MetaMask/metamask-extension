import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { useMessenger } from '../useMessenger';
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
 * is the authority.
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

  const runValidation = useCallback(
    async (nextCode: string): Promise<string> => {
      if (nextCode.length < MONEY_REFERRAL_CODE_MIN_LENGTH) {
        return '';
      }
      try {
        const result = await messenger.call(
          'RewardsMoneyController:validateReferralCode',
          nextCode,
        );
        if (result?.success) {
          return '';
        }
        return t('rewardsMoneyReferralCodeError');
      } catch {
        return MONEY_REFERRAL_CODE_UNKNOWN_ERROR;
      }
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
      runValidation(code)
        .then((nextError) => {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setError(nextError);
          setResolvedCode(code);
        })
        .catch(() => undefined);
    }, MONEY_REFERRAL_VALIDATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [code, runValidation]);

  const validateCode = useCallback(
    async (nextCode: string): Promise<string> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setResolvedCode('');
      const nextError = await runValidation(nextCode);
      if (requestId === requestIdRef.current) {
        setError(nextError);
        setResolvedCode(nextCode);
      }
      return nextError;
    },
    [runValidation],
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
