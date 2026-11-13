import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RpcEndpointType } from '@metamask/network-controller';
import type { AddNetworkFields } from '@metamask/network-controller';

import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  FEATURED_RPCS,
  infuraProjectId,
} from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { selectPerpsIsTestnet } from '../../../../selectors/perps-controller';
import { addNetwork } from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import { useDispatch } from '../../../../store/hooks';

/**
 * Arbitrum Sepolia, where Hyperliquid testnet deposits settle USDC2. It is not
 * a featured network, so the preflight adds it with the same Infura endpoint
 * shape `FEATURED_RPCS` uses for Arbitrum One.
 */
const ARBITRUM_SEPOLIA_NETWORK: AddNetworkFields = {
  chainId: CHAIN_IDS.ARBITRUM_SEPOLIA,
  name: 'Arbitrum Sepolia',
  nativeCurrency: CURRENCY_SYMBOLS.ETH,
  rpcEndpoints: [
    {
      url: `https://arbitrum-sepolia.infura.io/v3/${infuraProjectId}`,
      type: RpcEndpointType.Custom,
    },
  ],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  defaultBlockExplorerUrlIndex: 0,
};

/**
 * Manages the EVM network required for Perps deposits.
 *
 * Hyperliquid deposits settle USDC on Arbitrum: Arbitrum One on mainnet and
 * Arbitrum Sepolia on testnet. The perps controller's
 * `DepositService.prepareTransaction` resolves the deposit route for the active
 * provider's network and then looks up the network client for that chain,
 * throwing `No network client found` ("add the network first") when it is
 * missing. So the preflight must ensure the chain matching the perps network.
 */
export const usePerpsNetworkManagement = () => {
  const dispatch = useDispatch();
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const isTestnet = useSelector(selectPerpsIsTestnet);

  const ensureArbitrumNetworkExists = useCallback(async () => {
    const chainId = isTestnet ? CHAIN_IDS.ARBITRUM_SEPOLIA : CHAIN_IDS.ARBITRUM;

    if (networkConfigurationsByChainId[chainId]) {
      return;
    }

    const networkConfig = isTestnet
      ? ARBITRUM_SEPOLIA_NETWORK
      : FEATURED_RPCS.find((rpc) => rpc.chainId === chainId);
    if (!networkConfig) {
      return;
    }

    await dispatch(addNetwork(networkConfig));
  }, [networkConfigurationsByChainId, isTestnet, dispatch]);

  return { ensureArbitrumNetworkExists };
};
