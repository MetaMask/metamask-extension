import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { useDispatch } from 'react-redux';
import { validateRewardsReferralCode } from '../../store/actions';

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
 * Validates 6-character base32 encoded strings following RFC 4648 standard.
 *
 * @param initialValue - Initial referral code value (default: '')
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns UseValidateReferralCodeResult object with validation state and methods
 */
export const useValidateReferralCode = (
  initialValue: string = '',
  debounceMs: number = 1000,
): UseValidateReferralCodeResult => {
  const [referralCode, setReferralCodeState] = useState(initialValue);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [unknownError, setUnknownError] = useState(false);
  const hasInitialized = useRef(false);
  const dispatch = useDispatch();

  const validateCode = useCallback(
    async (code: string): Promise<string> => {
      try {
        const valid = await dispatch(validateRewardsReferralCode(code));

        if (!valid) {
          return 'Invalid code';
        }
        return '';
      } catch (err) {
        setUnknownError(true);
        return 'Unknown error';
      }
    },
    [dispatch],
  );

  // Debounced validation
  const debouncedValidation = useCallback(
    // eslint-disable-next-line react-compiler/react-compiler
    debounce(async (code: string) => {
      setUnknownError(false);
      const validationError = await validateCode(code);
      setError(validationError);
      setIsValidating(false);
    }, debounceMs),
    [debounceMs, validateCode],
  );

  // Function to update referral code and trigger validation
  const setReferralCode = useCallback(
    (code: string) => {
      const refinedCode = code.trim().toUpperCase();
      setReferralCodeState(refinedCode);
      // If not at minLength, do NOT validate; keep referral code state but clear error/validating state
      if (refinedCode.length < 6) {
        debouncedValidation.cancel();
        setIsValidating(false);
        setError('minLength 6 characters');
        return;
      }
      if (refinedCode) {
        setIsValidating(true);
      }
      debouncedValidation(refinedCode);
    },
    [debouncedValidation],
  );

  useEffect(() => {
    if (!hasInitialized.current) {
      setReferralCode(initialValue);
      hasInitialized.current = true;
    } else if (initialValue !== referralCode) {
      // Only update if initialValue actually changed from current referralCode
      setReferralCode(initialValue);
    }
    // only run on mount or when initialValue changes
  }, [initialValue]);

  // Cleanup debounced function on unmount
  useEffect(() => () => debouncedValidation.cancel(), [debouncedValidation]);

  const isValid = Boolean(referralCode) && !error && !isValidating;

  return {
    referralCode,
    setReferralCode,
    validateCode,
    isValidating,
    isValid,
    isUnknownError: unknownError,
  };
};
