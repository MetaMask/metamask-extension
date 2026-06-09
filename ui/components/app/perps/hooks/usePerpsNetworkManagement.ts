import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CHAIN_IDS, FEATURED_RPCS } from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { selectPerpsIsTestnet } from '../../../../selectors/perps-controller';
import { addNetwork } from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

/**
 * Manages the EVM network required for Perps deposits.
 *
 * Hyperliquid deposits settle USDC on Arbitrum, so the controller resolves the
 * deposit transaction against the Arbitrum network client
 * (`PerpsController.depositWithConfirmation`). When that network is not in the
 * wallet the controller throws `Invalid chain ID` ("add the network first") and
 * the deposit silently never starts. Mirror mobile's `usePerpsNetworkManagement`
 * by adding the Arbitrum network (from the curated featured list) before
 * triggering a deposit.
 */
export const usePerpsNetworkManagement = () => {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const ensureArbitrumNetworkExists = useCallback(async () => {
    const chainId = isTestnet
      ? CHAIN_IDS.ARBITRUM_SEPOLIA
      : CHAIN_IDS.ARBITRUM;

    if (networkConfigurationsByChainId[chainId]) {
      return;
    }

    const networkConfig = FEATURED_RPCS.find((rpc) => rpc.chainId === chainId);
    if (!networkConfig) {
      return;
    }

    await dispatch(addNetwork(networkConfig));
  }, [isTestnet, networkConfigurationsByChainId, dispatch]);

  return { ensureArbitrumNetworkExists };
};
