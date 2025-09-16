import { AddressResolution } from '@metamask/snaps-sdk';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useCallback, useRef } from 'react';

import { isSolanaAddress } from '../../../../../shared/lib/multichain/accounts';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../helpers/utils/util';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useSnapNameResolution } from '../../../../hooks/snaps/useSnapNameResolution';
import { RecipientValidationResult } from '../../types/send';
import {
  findConfusablesInRecipient,
  validateEvmHexAddress,
  validateSolanaAddress,
} from '../../utils/sendValidations';
import { useSendContext } from '../../context/send';
import { useSendType } from './useSendType';

export const useRecipientValidation = () => {
  const t = useI18nContext();
  const { chainId, to } = useSendContext();
  const { isEvmSendType, isSolanaSendType } = useSendType();
  const { results, loading } = useSnapNameResolution({
    chainId: chainId ? formatChainIdToCaip(chainId) : '',
    domain: to ?? '',
  });
  const prevResolved = useRef<AddressResolution | undefined>();

  const validateRecipient =
    useCallback(async (): Promise<RecipientValidationResult> => {
      if (!to) {
        return {};
      }

      if (isEvmSendType && isValidHexAddress(to)) {
        return {
          ...(await validateEvmHexAddress(to, chainId)),
          toAddressValidated: to,
        };
      }

      if (isSolanaSendType && isSolanaAddress(to)) {
        return { ...validateSolanaAddress(to), toAddressValidated: to };
      }

      if (isValidDomainName(to)) {
        const resolvedLookup = results?.[0]?.resolvedAddress;
        if (loading) {
          if (prevResolved.current?.domainName === to) {
            return {
              resolvedLookup: prevResolved.current.resolvedAddress,
              ...findConfusablesInRecipient(to),
              toAddressValidated: to,
            };
          }
          return { loading: true };
        }
        if (results?.length) {
          prevResolved.current = results?.[0];
          return {
            resolvedLookup,
            ...findConfusablesInRecipient(to),
            toAddressValidated: to,
          };
        }
        return {
          error: 'ensUnknownError',
          toAddressValidated: to,
        };
      }

      return {
        error: 'invalidAddress',
        toAddressValidated: to,
      };
    }, [chainId, isEvmSendType, isSolanaSendType, loading, results, to]);

  const { value: result, pending } = useAsyncResult<RecipientValidationResult>(
    async () => validateRecipient(),
    [validateRecipient],
  );

  return {
    recipientConfusableCharacters: result?.confusableCharacters,
    recipientError: result?.error ? t(result?.error) : undefined,
    recipientResolvedLookup: result?.resolvedLookup,
    toAddressValidated: result?.toAddressValidated,
    recipientValidationLoading: result?.loading ?? pending,
    recipientWarning: result?.warning ? t(result?.warning) : undefined,
  };
};
