import { useCallback, useMemo, useEffect, useState } from 'react';
import { debounce } from 'lodash';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useSendContext } from '../../../context/send';
import { useSendType } from '../useSendType';
import { RecipientValidationResult } from '../../../types/send';
import { useEvmRecipientValidation } from './useEvmRecipientValidation';
import { useSolanaRecipientValidation } from './useSolanaRecipientValidation';

export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { to, chainId } = useSendContext();
  const sendType = useSendType();
  const { validateEvmRecipient } = useEvmRecipientValidation();
  const { validateSolanaRecipient } = useSolanaRecipientValidation();

  const [debouncedTo, setDebouncedTo] = useState(to);
  const debouncedSetTo = useCallback(
    debounce((value) => {
      setDebouncedTo(value);
    }, 300),
    [],
  );

  useEffect(() => {
    return () => {
      debouncedSetTo.cancel();
    };
  }, [debouncedSetTo]);

  useEffect(() => {
    debouncedSetTo(to);
  }, [to, debouncedSetTo]);

  const isEvmSendType = useMemo(
    () => sendType.isEvmSendType,
    [sendType.isEvmSendType],
  );
  const isSolanaSendType = useMemo(
    () => sendType.isSolanaSendType,
    [sendType.isSolanaSendType],
  );

  const validateRecipient = useCallback(
    async (address?: string) => {
      const emptyResult = {
        error: null,
        resolvedLookup: null,
        warning: null,
      };
      if (!address) {
        return emptyResult;
      }

      let result;
      if (isEvmSendType) {
        result = await validateEvmRecipient(address, chainId);
      } else if (isSolanaSendType) {
        result = await validateSolanaRecipient(address, chainId);
      } else {
        result = emptyResult;
      }

      const finalResult = {
        confusableCharacters:
          'confusableCharacters' in result
            ? (result.confusableCharacters ?? [])
            : [],
        error: result.error ?? null,
        resolvedLookup:
          'resolvedLookup' in result ? (result.resolvedLookup ?? null) : null,
        warning: result.warning ?? null,
      };

      return finalResult;
    },
    [
      isEvmSendType,
      isSolanaSendType,
      validateEvmRecipient,
      validateSolanaRecipient,
      chainId,
    ],
  );

  const { value } = useAsyncResult<RecipientValidationResult>(
    async () => validateRecipient(debouncedTo),
    [debouncedTo],
  );

  const translatedError = useMemo(() => {
    return value?.error ? t(value.error) : null;
  }, [value?.error, t]);

  const translatedWarning = useMemo(() => {
    return value?.warning ? t(value.warning) : null;
  }, [value?.warning, t]);

  return {
    recipientError: translatedError,
    recipientWarning: translatedWarning,
    recipientResolvedLookup: value?.resolvedLookup,
    recipientConfusableCharacters: value?.confusableCharacters ?? [],
    validateRecipient,
  };
};
