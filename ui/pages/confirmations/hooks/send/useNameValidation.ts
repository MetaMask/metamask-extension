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
      if (!isValidDomainName(to)) {
        return {
          error: 'nameResolutionFailedError',
        };
      }

      let resolutions: Resolution[];

      if (isEvmSendType) {
        resolutions = (await dispatch(
          lookupDomainName(to, chainId),
        )) as unknown as Resolution[];
      } else {
        resolutions = await fetchResolutions(formatChainIdToCaip(chainId), to);
      }

      return processResolutions(resolutions, to);
    },
    [dispatch, fetchResolutions, isEvmSendType, processResolutions],
  );

  return {
    validateName,
  };
};
