import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { useDispatch } from 'react-redux';
import { useCallback } from 'react';

import { isValidDomainName } from '../../../../helpers/utils/util';
import { useSnapNameResolution } from '../../../../hooks/snaps/useSnapNameResolution';
import { findConfusablesInRecipient } from '../../utils/sendValidations';
import { lookupDomainName } from '../../../../ducks/domains';
import { useSendType } from './useSendType';

type Resolution = {
  resolvedAddress?: string;
  protocol?: string;
};

export const useNameValidation = () => {
  const { fetchResolutions } = useSnapNameResolution();
  const dispatch = useDispatch();
  const { isEvmSendType } = useSendType();

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
    async (chainId: string, to: string) => {
      console.log(
        `[ENS Debug] useNameValidation.validateName called: to="${to}", chainId="${chainId}", isEvmSendType=${isEvmSendType}`,
      );

      if (!isValidDomainName(to)) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      if (isEvmSendType) {
        console.log(
          `[ENS Debug] Calling lookupDomainName for EVM chain: ${to}`,
        );
      } else {
        console.log(
          `[ENS Debug] Calling fetchResolutions for non-EVM chain: ${to}`,
        );
      }

      const resolutions = isEvmSendType
        ? await dispatch(lookupDomainName(to, chainId))
        : await fetchResolutions(formatChainIdToCaip(chainId), to);

      return processResolutions(resolutions, to);
    },
    [dispatch, fetchResolutions, isEvmSendType, processResolutions],
  );

  return {
    validateName,
  };
};
