import { AddressResolution } from '@metamask/snaps-sdk';
import { useCallback, useRef } from 'react';

import { isSolanaAddress } from '../../../../../../shared/lib/multichain/accounts';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../../types/send';
import { useSendContext } from '../../../context/send';
import { findConfusablesInRecipient } from '../../../utils/sendValidations';

// Common Solana burn addresses - addresses commonly used as burn destinations
const SOLANA_BURN_ADDRESSES = [
  '1nc1nerator11111111111111111111111111111111',
  'So11111111111111111111111111111111111111112',
];

const validateSolanaAddress = (address: string) => {
  if (SOLANA_BURN_ADDRESSES.includes(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  if (!isSolanaAddress(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  return {};
};

export const useSolanaRecipientValidation = () => {
  const t = useI18nContext();
  const { chainId, to } = useSendContext();
  const prevResolved = useRef<string>();

  const validateSolanaRecipient = useCallback(
    async (
      results: AddressResolution[],
      loading: boolean,
    ): Promise<RecipientValidationResult> => {
      if (!to) {
        return {};
      }

      if (isSolanaAddress(to)) {
        return validateSolanaAddress(to);
      }

      if (isValidDomainName(to)) {
        const resolvedLookup = results?.[0]?.resolvedAddress;
        if (loading && prevResolved.current !== to) {
          return { recipientValidationLoading: true };
        }
        if (results?.length) {
          prevResolved.current = to;
          return {
            resolvedLookup,
            ...findConfusablesInRecipient(to, t),
          };
        }
        return {
          error: t('ensUnknownError'),
        };
      }

      return {
        error: t('invalidAddress'),
      };
    },
    [chainId, t, to],
  );

  return {
    validateSolanaRecipient,
  };
};
