import { useState, useEffect, useCallback } from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isValidPositiveNumericString } from '../../utils/send';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { useSnapAmountOnInput } from './useSnapAmountOnInput';

type ValidationResult = {
  valid: boolean;
  errors: { code: string }[];
};

export const useAmountValidation = () => {
  const t = useI18nContext();
  const { isNonEvmSendType } = useSendType();
  const { value } = useSendContext();
  const { validateAmountWithSnap } = useSnapAmountOnInput();
  const [amountError, setAmountError] = useState<string | undefined>(undefined);

  const validateNonEvmAmountAsync = useCallback(async () => {
    if (isNonEvmSendType) {
      try {
        const result = (await validateAmountWithSnap(
          value || ('0' as string),
        )) as ValidationResult;

        if (result.errors && result.errors.length > 0) {
          console.log(
            'OGP - using error from "onAmountInput" response: ',
            result,
          );
          const errorCode = result.errors[0].code;
          setAmountError(mapErrorCodeToMessage(errorCode, t));
          return { isValid: false };
        }

        setAmountError(undefined);
        return { isValid: true };
      } catch (error) {
        setAmountError(t('invalidValue'));

        return { isValid: false };
      }
    }

    return { isValid: true };
  }, [t, value, validateAmountWithSnap, isNonEvmSendType]);

  const validateAmountAsync = useCallback(async () => {
    if (value === undefined || value === null || value === '') {
      setAmountError(undefined);
      return { isValid: true };
    }

    if (!isValidPositiveNumericString(value)) {
      setAmountError(t('invalidValue'));
      return { isValid: false };
    }

    return (await validateNonEvmAmountAsync()) as { isValid: boolean };
  }, [t, value, validateNonEvmAmountAsync]);

  useEffect(() => {
    validateAmountAsync();
  }, [validateAmountAsync]);

  return { amountError, validateAmountAsync, validateNonEvmAmountAsync };
};

function mapErrorCodeToMessage(
  errorCode: string,
  t: ReturnType<typeof useI18nContext>,
) {
  switch (errorCode) {
    case 'InsufficientBalance':
      return t('insufficientFundsSend');
    case 'Invalid':
    default:
      return t('invalidValue');
  }
}
