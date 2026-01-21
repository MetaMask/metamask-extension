import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';

import {
  isSolanaAddress,
  isBtcMainnetAddress,
  isTronAddress,
} from '../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';
import {
  isValidDomainName,
  isDomainReadyForResolution,
} from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../types/send';
import {
  validateBtcAddress,
  validateEvmHexAddress,
  validateSolanaAddress,
  validateTronAddress,
} from '../../utils/sendValidations';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { useNameValidation } from './useNameValidation';

const VALIDATION_DEBOUNCE_MS = 500;

export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { asset, chainId, to } = useSendContext();
  const { isBitcoinSendType, isEvmSendType, isSolanaSendType, isTronSendType } =
    useSendType();
  const { validateName } = useNameValidation();
  const [result, setResult] = useState<RecipientValidationResult>({});
  const prevAddressValidated = useRef<string>();
  const unmountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);

  const validateRecipient = useCallback(
    async (
      toAddress: string,
      signal?: AbortSignal,
    ): Promise<RecipientValidationResult> => {
      if (!toAddress || !chainId) {
        return {};
      }

      if (signal?.aborted) {
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

      if (isTronSendType && isTronAddress(toAddress)) {
        return validateTronAddress(toAddress);
      }

      if (isValidDomainName(toAddress)) {
        if (!isDomainReadyForResolution(toAddress)) {
          return {};
        }
        return await validateName(chainId, toAddress, signal);
      }

      return {
        error: 'invalidAddress',
      };
    },
    [
      asset,
      chainId,
      isBitcoinSendType,
      isEvmSendType,
      isSolanaSendType,
      isTronSendType,
      validateName,
    ],
  );

  const debouncedValidateRecipient = useMemo(
    () =>
      debounce(async (toAddress: string) => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const validationResult = await validateRecipient(
          toAddress,
          abortControllerRef.current.signal,
        );

        if (
          !unmountedRef.current &&
          prevAddressValidated.current === toAddress
        ) {
          setResult({
            ...validationResult,
            toAddressValidated: toAddress,
          });
        }
      }, VALIDATION_DEBOUNCE_MS),
    [validateRecipient],
  );

  useEffect(() => {
    if (prevAddressValidated.current === to) {
      return;
    }

    prevAddressValidated.current = to;
    debouncedValidateRecipient(to);
  }, [to, debouncedValidateRecipient]);

  useEffect(() => {
    return () => {
      debouncedValidateRecipient.cancel();
    };
  }, [debouncedValidateRecipient]);

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error ? t(result?.error) : undefined,
    recipientResolvedLookup: result?.resolvedLookup,
    recipientWarning: result?.warning ? t(result?.warning) : undefined,
    resolutionProtocol: result?.protocol,
    toAddressValidated: result?.toAddressValidated,
  };
};
