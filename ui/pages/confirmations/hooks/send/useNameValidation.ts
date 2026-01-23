import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import { isResolvableName } from '../../../../helpers/utils/util';
import { findConfusablesInRecipient } from '../../utils/sendValidations';
import { lookupDomainName } from '../../../../ducks/domains';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

type Resolution = {
  resolvedAddress?: string;
  protocol?: string;
};

export const useNameValidation = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const processResolutions = useCallback(
    (resolutions: Resolution[], domain: string) => {
      if (!resolutions || resolutions.length === 0) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      return {
        resolvedLookup: resolutions[0]?.resolvedAddress,
        protocol: resolutions[0]?.protocol,
        ...findConfusablesInRecipient(domain),
      };
    },
    [],
  );

  const validateName = useCallback(
    async (chainId: string, to: string, signal?: AbortSignal) => {
      if (!isResolvableName(to)) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      if (signal?.aborted) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      const resolutions = (await dispatch(
        lookupDomainName(to, chainId, signal),
      )) as Resolution[];

      return processResolutions(resolutions, to);
    },
    [dispatch, processResolutions],
  );

  return {
    validateName,
  };
};
