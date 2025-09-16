import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useCallback } from 'react';

import { useAsyncResult } from '../../../../../hooks/useAsync';
import { RecipientValidationResult } from '../../../types/send';
import { useSendContext } from '../../../context/send';
import { useSnapNameResolution } from '../../../../../hooks/snaps/useSnapNameResolution';
import { useSendType } from '../useSendType';
import { useSolanaRecipientValidation } from './useSolanaRecipientValidation';
import { useEvmRecipientValidation } from './useEvmRecipientValidation';

export const useRecipientValidation = () => {
  const { chainId, to } = useSendContext();
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const { validateEvmRecipient } = useEvmRecipientValidation();
  const { validateSolanaRecipient } = useSolanaRecipientValidation();
  const { results, loading } = useSnapNameResolution({
    chainId: chainId ? formatChainIdToCaip(chainId) : '',
    domain: to ?? '',
  });

  const validateRecipient =
    useCallback(async (): Promise<RecipientValidationResult> => {
      let result: RecipientValidationResult = {};
      if (isEvmSendType) {
        result = await validateEvmRecipient(results, loading);
      } else {
        result = await validateSolanaRecipient(results, loading);
      }
      return { ...result, toAddressValidated: to };
    }, [
      isEvmSendType,
      isSolanaSendType,
      loading,
      results,
      validateEvmRecipient,
      validateSolanaRecipient,
    ]);

  const { value: result, pending } = useAsyncResult<RecipientValidationResult>(
    async () => validateRecipient(),
    [validateRecipient],
  );

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error,
    recipientResolvedLookup: result?.resolvedLookup,
    toAddressValidated: result?.toAddressValidated,
    recipientValidationLoading: pending,
    recipientWarning: result?.warning,
  };
};
