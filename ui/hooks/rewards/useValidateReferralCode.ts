import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { validateRewardsReferralCode } from '../../store/actions';

export const REFERRAL_CODE_DEBOUNCE_MS = 1000;
const REFERRAL_CODE_UNKNOWN_ERROR = 'Unknown error';

const normalizeReferralCode = (code: string) => code.trim().toUpperCase();

export type UseValidateReferralCodeResult = {
  /**
   * Current referral code value
   */
  referralCode: string;
  /**
   * Function to update the referral code and trigger validation
   */
  setReferralCode: (code: string) => void;
  /**
   * Function to validate a referral code without setting it
   */
  validateCode: (code: string) => Promise<string>;
  /**
   * Whether validation is currently in progress (during debounce period)
   */
  isValidating: boolean;
  /**
   * Whether the current referral code is valid
   */
  isValid: boolean;

  /**
   * Whether an unknown error occurred while validating the referral code
   */
  isUnknownError: boolean;
};

/**
 * Custom hook for validating referral codes with debounced validation.
 * Any non-empty input is forwarded to the backend, which is the source of
 * truth for whether a referral code exists.
 *
 * @param initialValue - Initial referral code value (default: '')
 * @param debounceMs - Debounce delay in milliseconds
 * @returns UseValidateReferralCodeResult object with validation state and methods
 */
export const useValidateReferralCode = (
  initialValue: string = '',
  debounceMs: number = REFERRAL_CODE_DEBOUNCE_MS,
): UseValidateReferralCodeResult => {
  const initialReferralCode = normalizeReferralCode(initialValue);
  const [referralCode, setReferralCodeState] = useState(initialReferralCode);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(
    initialReferralCode.length >= 1,
  );
  const hasInitialized = useRef(false);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatch = useDispatch();

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const validateCode = useCallback(
    async (code: string): Promise<string> => {
      try {
        const valid = await dispatch(validateRewardsReferralCode(code));

        if (!valid) {
          return 'Invalid code';
        }
        return '';
      } catch {
        return REFERRAL_CODE_UNKNOWN_ERROR;
      }
    },
    [dispatch],
  );

  const triggerValidation = useCallback(
    (code: string) => {
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      clearDebounceTimer();
      setError('');
      setIsValidating(true);

      debounceTimerRef.current = setTimeout(async () => {
        const validationError = await validateCode(code);

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setError(validationError);
        setIsValidating(false);
      }, debounceMs);
    },
    [clearDebounceTimer, debounceMs, validateCode],
  );

  // Function to update referral code and trigger validation
  const setReferralCode = useCallback(
    (code: string) => {
      const refinedCode = normalizeReferralCode(code);
      setReferralCodeState(refinedCode);
      // If empty, do NOT validate; clear error/validating state
      if (refinedCode.length < 1) {
        requestIdRef.current += 1;
        clearDebounceTimer();
        setIsValidating(false);
        setError('');
        return;
      }
      triggerValidation(refinedCode);
    },
    [clearDebounceTimer, triggerValidation],
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      setReferralCode(initialValue);
      hasInitialized.current = true;
    } else if (initialValue !== referralCode) {
      // Only update if initialValue actually changed from current referralCode
      setReferralCode(initialValue);
    }
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      clearDebounceTimer();
    },
    [clearDebounceTimer],
  );

  const isValid = Boolean(referralCode) && !error && !isValidating;
  const isUnknownError = error === REFERRAL_CODE_UNKNOWN_ERROR;

  return {
    referralCode,
    setReferralCode,
    validateCode,
    isValidating,
    isValid,
    isUnknownError,
  };
};
