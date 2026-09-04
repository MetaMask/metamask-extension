import { useCallback, useEffect, useRef, useState } from 'react';

import {
  isSolanaAddress,
  isBtcMainnetAddress,
  isStellarAddress,
  isTronAddress,
} from '../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../shared/lib/hexstring-utils';
import { isResolvableName } from '../../../../helpers/utils/util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../types/send';
import {
  validateBtcAddress,
  validateEvmHexAddress,
  validateSolanaAddress,
  validateStellarAddress,
  validateTronAddress,
} from '../../utils/sendValidations';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';
import { useNameValidation } from './useNameValidation';
import { useSendAlerts } from './alerts/useSendAlerts';

const VALIDATION_DEBOUNCE_MS = 500;

export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { asset, chainId, to } = useSendContext();
  const {
    isBitcoinSendType,
    isEvmSendType,
    isSolanaSendType,
    isStellarSendType,
    isTronSendType,
  } = useSendType();
  const { validateName } = useNameValidation();
  const [result, setResult] = useState<RecipientValidationResult>({});
  const validationRequestIdRef = useRef(0);
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
        return validateEvmHexAddress(toAddress, asset?.address);
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

      if (isStellarSendType && isStellarAddress(toAddress)) {
        return validateStellarAddress(toAddress);
      }

      if (isResolvableName(toAddress)) {
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
      isStellarSendType,
      isTronSendType,
      validateName,
    ],
  );

  useEffect(() => {
    if (!to || !chainId) {
      return undefined;
    }

    validationRequestIdRef.current += 1;
    const requestId = validationRequestIdRef.current;

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      validateRecipient(to, abortControllerRef.current.signal)
        .then((validationResult) => {
          if (
            unmountedRef.current ||
            validationRequestIdRef.current !== requestId
          ) {
            return;
          }

          setResult({
            ...validationResult,
            toAddressValidated: to,
          });
        })
        .catch(() => undefined);
    }, VALIDATION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [to, chainId, validateRecipient]);

  const { alerts, hasUnacknowledgedAlerts, acknowledgeAlerts } =
    useSendAlerts();

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error ? t(result?.error) : undefined,
    recipientResolvedLookup: result?.resolvedLookup,
    recipientWarning: result?.warning ? t(result?.warning) : undefined,
    resolutionProtocol: result?.protocol,
    toAddressValidated: result?.toAddressValidated,
    alerts,
    hasUnacknowledgedAlerts,
    acknowledgeAlerts,
  };
};
