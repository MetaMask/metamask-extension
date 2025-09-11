import { AddressResolution } from '@metamask/snaps-sdk';
import { useCallback, useEffect, useRef } from 'react';

import { isValidHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import { isValidDomainName } from '../../../../../helpers/utils/util';
import {
  findNetworkClientIdByChainId,
  getERC721AssetSymbol,
} from '../../../../../store/actions';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { RecipientValidationResult } from '../../../types/send';
import { useSendContext } from '../../../context/send';
import { validateDomainWithConfusables } from '../../../utils/sendValidations';

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

  return {};
};

export const useEvmRecipientValidation = () => {
  const t = useI18nContext();
  const { chainId, to } = useSendContext();
  const prevResolved = useRef<string>();

  const validateEvmRecipient = useCallback(
    async (
      results: AddressResolution[],
      loading: boolean,
    ): Promise<RecipientValidationResult> => {
      if (!to) {
        return {};
      }
      if (isValidHexAddress(to)) {
        return await validateHexAddress(to, chainId);
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
            ...validateDomainWithConfusables(to, t),
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
    validateEvmRecipient,
  };
};
