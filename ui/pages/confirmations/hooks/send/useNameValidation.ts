import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useCallback } from 'react';

import { isValidDomainName } from '../../../../helpers/utils/util';
import { useSnapNameResolution } from '../../../../hooks/snaps/useSnapNameResolution';
import { findConfusablesInRecipient } from '../../utils/sendValidations';

export const useNameValidation = () => {
  const { fetchResolutions } = useSnapNameResolution();

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
    [fetchResolutions],
  );

  return {
    validateName,
  };
};
