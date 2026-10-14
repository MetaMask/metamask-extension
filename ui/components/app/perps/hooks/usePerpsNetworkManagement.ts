import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { addNetwork } from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import { useDispatch } from '../../../../store/hooks';

/**
 * Manages the EVM network required for Perps deposits.
 *
 * Hyperliquid deposits settle USDC on Arbitrum One. The perps controller's
 * `DepositService.prepareTransaction` always resolves the deposit route with
 * `isTestnet: false` (mainnet Arbitrum) and then looks up the network client
 * for that chain, throwing `Invalid chain ID` ("add the network first") when it
 * is missing — even while perps is in testnet mode. So the preflight must ensure
 * the chain the controller actually deposits to, which is always Arbitrum One.
 */
export const usePerpsNetworkManagement = () => {
  const dispatch = useDispatch();
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const ensureArbitrumNetworkExists = useCallback(async () => {
    const chainId = CHAIN_IDS.ARBITRUM;

    if (networkConfigurationsByChainId[chainId]) {
      return;
    }

    const networkConfig = FEATURED_RPCS.find((rpc) => rpc.chainId === chainId);
    if (!networkConfig) {
      return;
    }

    await dispatch(addNetwork(networkConfig));
  }, [networkConfigurationsByChainId, dispatch]);

  return { ensureArbitrumNetworkExists };
};
