import { useCallback } from 'react';

import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import {
  findNetworkClientIdByChainId,
  getERC721AssetSymbol,
} from '../../../../../store/actions';
import { useSnapNameResolution } from '../../../../../hooks/snaps/useSnapNameResolution';
import { validateDomainWithConfusables } from '../../../utils/sendValidations';
import { RecipientValidationResult } from '../../../types/send';

const LOWER_CASED_BURN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
];

const validateHexAddress = async (address: string, chainId?: string) => {
  if (LOWER_CASED_BURN_ADDRESSES.includes(address.toLowerCase())) {
    return {
      error: 'invalidAddress',
    };
  }

  if (chainId) {
    const networkClientId = await findNetworkClientIdByChainId(chainId);
    if (networkClientId) {
      const symbol = await getERC721AssetSymbol(address, networkClientId);
      if (symbol) {
        // Contract address detected
        return {
          error: 'invalidAddress',
        };
      }
    }
  }

  return {
    error: null,
    resolvedLookup: null,
    warning: null,
  };
};

export const useEvmRecipientValidation = () => {
  const { lookupDomainAddresses } = useSnapNameResolution();

  const validateEvmRecipient = useCallback(
    async (
      address: string,
      passedChainId?: string,
    ): Promise<RecipientValidationResult> => {
      const effectiveChainId = passedChainId || '0x1';

      if (isValidHexAddress(address)) {
        return await validateHexAddress(address, effectiveChainId);
      }

      if (isValidDomainName(address)) {
        try {
          const result = await validateDomainWithConfusables(address, {
            chainId: effectiveChainId,
            lookupDomainAddresses,
            formatChainId: (chainId: string) => {
              const chainIdInt = chainId ? parseInt(chainId, 16) : 1;
              return `eip155:${chainIdInt}`;
            },
            errorMessages: {
              unknownError: 'ensUnknownError',
              confusingDomain: 'confusingEnsDomain',
            },
          });
          return result;
        } catch (error) {
          return { error: 'ensUnknownError' };
        }
      }

      return {
        error: 'invalidAddress',
      };
    },
    [lookupDomainAddresses],
  );

  return {
    validateEvmRecipient,
  };
};
