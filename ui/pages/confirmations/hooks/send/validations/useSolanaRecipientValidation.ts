import { useCallback, useState } from 'react';

import { isSolanaAddress } from '../../../../../../shared/lib/multichain/accounts';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import { useSnapNameResolution } from '../../../../../hooks/snaps/useSnapNameResolution';
import { validateDomainWithConfusables } from '../../../utils/sendValidations';
import { RecipientValidationResult } from '../../../types/send';

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

  return {
    error: null,
    resolvedLookup: null,
    warning: null,
  };
};

export const useSolanaRecipientValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { lookupDomainAddresses } = useSnapNameResolution();

  const validateSolanaRecipient = useCallback(
    async (
      address: string,
      passedChainId?: string,
    ): Promise<RecipientValidationResult> => {
      const effectiveChainId =
        passedChainId || 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

      if (isSolanaAddress(address)) {
        const result = validateSolanaAddress(address);
        return { ...result, isLookupLoading: false };
      }

      if (isValidDomainName(address)) {
        setIsLoading(true);

        try {
          const result = await validateDomainWithConfusables(address, {
            chainId: effectiveChainId,
            lookupDomainAddresses,
            errorMessages: {
              unknownError: 'solanaUnknownError',
              confusingDomain: 'confusingSolanaDomain',
            },
          });
          setIsLoading(false);
          return result;
        } catch (error) {
          setIsLoading(false);
          return { error: 'solanaUnknownError', isLookupLoading: false };
        }
      }

      return {
        error: 'invalidAddress',
        isLookupLoading: false,
      };
    },
    [lookupDomainAddresses],
  );

  return {
    validateSolanaRecipient,
    isLookupLoading: isLoading,
  };
};
