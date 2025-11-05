import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import { isValidDomainName } from '../../../../helpers/utils/util';
import { useSnapNameResolution } from '../../../../hooks/snaps/useSnapNameResolution';
import { findConfusablesInRecipient } from '../../utils/sendValidations';
import { lookupDomainName } from '../../../../ducks/domains';
import { useSendType } from './useSendType';

export const useNameValidation = () => {
  const { fetchResolutions } = useSnapNameResolution();
  const dispatch = useDispatch();
  const { isEvmSendType } = useSendType();

  const validateName = useCallback(
    async (chainId: string, to: string) => {
      if (isValidDomainName(to)) {
        const resolutions = await fetchResolutions(
          formatChainIdToCaip(chainId),
          to,
        );

        if (resolutions.length === 0) {
          return {
            error: 'nameResolutionFailedError',
          };
        }

        const resolvedLookup = resolutions[0]?.resolvedAddress;
        const protocol = resolutions[0]?.protocol;

        // In order to display the ENS name component we need to initiate reverse lookup by calling lookupDomainName
        // so the domain resolution will be available in the store then Name component will use it in the confirmation
        if (isEvmSendType) {
          dispatch(lookupDomainName(to, chainId));
        }

        return {
          resolvedLookup,
          protocol,
          ...findConfusablesInRecipient(to),
        };
      }

      return {
        error: 'nameResolutionFailedError',
      };
    },
    [dispatch, fetchResolutions],
  );

  return {
    validateName,
  };
};
