import {
  formatChainIdToCaip,
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { CaipChainId, Hex, parseCaipChainId } from '@metamask/utils';
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getEnabledNetworksByNamespace } from '../../../selectors';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../shared/constants/network';
import { setEnabledAllPopularNetworks } from '../../../store/actions';

/**
 * Ensures that any missing network gets added to the NetworkEnabledMap (which handles network polling)
 *
 * @returns callback to enable a network config.
 */
export const useEnableMissingNetwork = () => {
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const dispatch = useDispatch();

  const enableMissingNetwork = useCallback(
    (chainId: Hex | CaipChainId) => {
      if (isNonEvmChainId(chainId)) {
        return;
      }

      const enabledNetworkKeys = Object.keys(enabledNetworksByNamespace ?? {});

      const caipChainId = formatChainIdToCaip(chainId);
      const { namespace } = parseCaipChainId(caipChainId);
      const hexChainId = formatChainIdToHex(chainId);

      if (namespace) {
        const isPopularNetwork =
          FEATURED_NETWORK_CHAIN_IDS.includes(hexChainId);

        if (isPopularNetwork) {
          const isNetworkEnabled = enabledNetworkKeys.includes(hexChainId);
          if (!isNetworkEnabled) {
            // Bridging between popular networks indicates we want the 'select all' enabled
            // This way users can see their full bridging tx activity
            dispatch(setEnabledAllPopularNetworks());
          }
        }
      }
    },
    [dispatch, enabledNetworksByNamespace],
  );

  return enableMissingNetwork;
};
