import { useCallback, useEffect, useRef, useState } from 'react';

import { isSolanaAddress } from '../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../types/send';
import {
  validateEvmHexAddress,
  validateSolanaAddress,
} from '../../utils/sendValidations';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { useNameValidation } from './useNameValidation';

export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { chainId, to } = useSendContext();
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const { validateName } = useNameValidation();
  const [result, setResult] = useState<RecipientValidationResult>({});
  const [loading, setLoading] = useState(false);
  const prevAddressValidated = useRef<string>();

  const validateRecipient = useCallback(
    async (toAddress): Promise<RecipientValidationResult> => {
      if (!toAddress || !chainId) {
        return {};
      }

      if (isEvmSendType && isValidHexAddress(toAddress)) {
        return await validateEvmHexAddress(toAddress, chainId);
      }

      if (isSolanaSendType && isSolanaAddress(toAddress)) {
        return validateSolanaAddress(toAddress);
      }

      if (isValidDomainName(toAddress)) {
        return await validateName(chainId, toAddress);
      }

      return {
        error: 'invalidAddress',
      };
    },
    [chainId, isEvmSendType, isSolanaSendType, validateName],
  );

  useEffect(() => {
    if (prevAddressValidated.current === to) {
      return undefined;
    }
    let cancel = false;

    (async () => {
      setLoading(true);
      const validationResult = await validateRecipient(to);

      if (!cancel) {
        prevAddressValidated.current = to;
        setResult({ ...validationResult, toAddressValidated: to });
        setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [setLoading, to, validateRecipient]);

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error ? t(result?.error) : undefined,
    recipientResolvedLookup: result?.resolvedLookup,
    toAddressValidated: result?.toAddressValidated,
    recipientValidationLoading: loading,
    recipientWarning: result?.warning ? t(result?.warning) : undefined,
  };
};
