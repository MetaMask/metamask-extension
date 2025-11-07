import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isSolanaAddress,
  isBtcMainnetAddress,
} from '../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../types/send';
import {
  validateEvmHexAddress,
  validateSolanaAddress,
  validateBtcAddress,
} from '../../utils/sendValidations';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { useNameValidation } from './useNameValidation';

// Avoid creating multiple instance of this hook in send flow,
// as ens validation is very expensive operation. And result can slow-down
// and result in bugs if multiple instances are created.
export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { asset, chainId, to } = useSendContext();
  const { isEvmSendType, isSolanaSendType, isBitcoinSendType } = useSendType();
  const { validateName } = useNameValidation();
  const [result, setResult] = useState<RecipientValidationResult>({});
  const prevAddressValidated = useRef<string>();
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  const validateRecipient = useCallback(
    async (toAddress): Promise<RecipientValidationResult> => {
      if (!toAddress || !chainId) {
        return {};
      }

      if (isEvmSendType && isValidHexAddress(toAddress)) {
        return await validateEvmHexAddress(toAddress, chainId, asset?.address);
      }

      if (isSolanaSendType && isSolanaAddress(toAddress)) {
        return validateSolanaAddress(toAddress);
      }

      if (isBitcoinSendType && isBtcMainnetAddress(toAddress)) {
        return validateBtcAddress(toAddress);
      }

      if (isValidDomainName(toAddress)) {
        return await validateName(chainId, toAddress);
      }

      return {
        error: 'invalidAddress',
      };
    },
    [
      asset,
      chainId,
      isEvmSendType,
      isSolanaSendType,
      isBitcoinSendType,
      validateName,
    ],
  );

  useEffect(() => {
    if (prevAddressValidated.current === to) {
      return;
    }

    (async () => {
      prevAddressValidated.current = to;
      const validationResult = await validateRecipient(to);

      if (!unmountedRef.current && prevAddressValidated.current === to) {
        setResult({
          ...validationResult,
          toAddressValidated: to,
        });
      }
    })();
  }, [setResult, to, validateRecipient]);

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error ? t(result?.error) : undefined,
    recipientResolvedLookup: result?.resolvedLookup,
    recipientWarning: result?.warning ? t(result?.warning) : undefined,
    resolutionProtocol: result?.protocol,
    toAddressValidated: result?.toAddressValidated,
  };
};
