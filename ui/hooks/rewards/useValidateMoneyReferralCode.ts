import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18nContext } from '../useI18nContext';
import { validateRewardsMoneyReferralCode } from '../../store/actions';
import { useDispatch } from '../../store/hooks';

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
  const dispatch = useDispatch();
  const t = useI18nContext();
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const requestIdRef = useRef(0);

  const runValidation = useCallback(
    async (nextCode: string): Promise<string> => {
      if (nextCode.length < MONEY_REFERRAL_CODE_MIN_LENGTH) {
        return '';
      }
      try {
        const result = (await dispatch(
          validateRewardsMoneyReferralCode(nextCode),
        )) as { success?: boolean };
        if (result?.success) {
          return '';
        }
        return t('rewardsMoneyReferralCodeError');
      } catch {
        return MONEY_REFERRAL_CODE_UNKNOWN_ERROR;
      }
    },
    [dispatch, t],
  );

  useEffect(() => {
    if (code.length < MONEY_REFERRAL_CODE_MIN_LENGTH) {
      setError('');
      setIsValidating(false);
      return undefined;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsValidating(true);
    let active = true;

    const timer = setTimeout(() => {
      void runValidation(code).then((nextError) => {
        if (!active || requestId !== requestIdRef.current) {
          return;
        }
        setError(nextError);
        setIsValidating(false);
      });
    }, MONEY_REFERRAL_VALIDATE_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [code, runValidation]);

  const validateCode = useCallback(
    async (nextCode: string): Promise<string> => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsValidating(true);
      const nextError = await runValidation(nextCode);
      if (requestId === requestIdRef.current) {
        setError(nextError);
        setIsValidating(false);
      }
      return nextError;
    },
    [runValidation],
  );

  const isUnknownError = error === MONEY_REFERRAL_CODE_UNKNOWN_ERROR;
  const isRejectedCode = Boolean(error) && !isUnknownError;
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
