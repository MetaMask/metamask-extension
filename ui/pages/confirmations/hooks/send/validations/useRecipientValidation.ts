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
  const [isValidationLoading, setIsValidationLoading] = useState(false);
  const t = useI18nContext();
  const { to, chainId } = useSendContext();
  const sendType = useSendType();
  const { validateEvmRecipient } = useEvmRecipientValidation();
  const { validateSolanaRecipient } = useSolanaRecipientValidation();

  const [debouncedTo, setDebouncedTo] = useState(to);
  const debouncedSetTo = useCallback(
    debounce((value: string) => {
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
    debouncedSetTo(to || '');
  }, [to, debouncedSetTo]);

  const isEvmSendType = sendType.isEvmSendType;
  const isSolanaSendType = sendType.isSolanaSendType;

  const validateRecipient = useCallback(
    async (address?: string): Promise<RecipientValidationResult> => {
      setIsValidationLoading(true);
      const emptyResult: RecipientValidationResult = {
        error: null,
        resolvedLookup: null,
        warning: null,
        confusableCharacters: [],
      };
      if (!address) {
        return emptyResult;
      }

      let result: Partial<RecipientValidationResult> = {};
      if (isEvmSendType) {
        result = await validateEvmRecipient(address, chainId);
      } else if (isSolanaSendType) {
        result = await validateSolanaRecipient(address, chainId);
      } else {
        return emptyResult;
      }

      setIsValidationLoading(false);

      return {
        confusableCharacters: result.confusableCharacters ?? [],
        error: result.error ?? null,
        resolvedLookup: result.resolvedLookup ?? null,
        warning: result.warning ?? null,
      };
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

  // Persist last known result to avoid "resetting"
  const [lastResult, setLastResult] = useState<RecipientValidationResult>({
    error: null,
    resolvedLookup: null,
    warning: null,
    confusableCharacters: [],
  });

  useEffect(() => {
    if (value) {
      setLastResult(value);
    }
  }, [value]);

  const translatedError = useMemo(() => {
    return lastResult.error ? t(lastResult.error) : null;
  }, [lastResult.error, t]);

  const translatedWarning = useMemo(() => {
    return lastResult.warning ? t(lastResult.warning) : null;
  }, [lastResult.warning, t]);

  return {
    recipientError: translatedError,
    recipientWarning: translatedWarning,
    recipientResolvedLookup: lastResult.resolvedLookup,
    recipientConfusableCharacters: lastResult.confusableCharacters,
    recipientValidationLoading: isValidationLoading,
    validateRecipient,
  };
};
