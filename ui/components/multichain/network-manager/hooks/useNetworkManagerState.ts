import { BUILT_IN_NETWORKS } from '@metamask/controller-utils';
import {
  NON_EVM_TESTNET_IDS,
  type MultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { Hex } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { convertCaipToHexChainId } from '../../../../../shared/modules/network.utils';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';
import {
  FEATURED_NETWORK_CHAIN_IDS,
  FEATURED_RPCS,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
import {
  getEnabledNetworksByNamespace,
  getAllEnabledNetworksUsed,
  getIsMultichainAccountsState2Enabled,
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkConfiguration,
} from '../../../../selectors';

export const useNetworkManagerState = ({
  showDefaultNetworks = false,
}: {
  showDefaultNetworks?: boolean;
} = {}) => {
  const currentMultichainNetwork = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );
  const [multichainNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const enabledNetworksByNamespace = useSelector(getEnabledNetworksByNamespace);
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const allEnabledNetworks = useSelector(getAllEnabledNetworksUsed);

  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(multichainNetworks).reduce(
        ([nonTestnetsList, testnetsList], [id, network]) => {
          let chainId = id;
          let isTest = false;

          if (network.isEvm) {
            // We keep using raw chain ID for EVM.
            chainId = convertCaipToHexChainId(network.chainId);
            isTest = TEST_CHAINS.includes(chainId as Hex);
          } else {
            isTest = NON_EVM_TESTNET_IDS.includes(network.chainId);
          }

          if (showDefaultNetworks) {
            (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
            return [nonTestnetsList, testnetsList];
          }

          // Pre-filter to only include networks that are NOT in built-in networks or featured RPCs
          const hexChainId = network.isEvm
            ? convertCaipToHexChainId(network.chainId)
            : network.chainId;

          // Check if the network is NOT a built-in network or featured RPC
          const isBuiltInNetwork = Object.values(BUILT_IN_NETWORKS).some(
            (builtInNetwork) => builtInNetwork.chainId === hexChainId,
          );
          const isFeaturedRpc = FEATURED_RPCS.some(
            (featuredRpc) => featuredRpc.chainId === hexChainId,
          );

          const isMultichainProviderConfig = Object.values(
            MultichainNetworks,
          ).some(
            (multichainNetwork) =>
              multichainNetwork === network.chainId ||
              (network.isEvm
                ? convertCaipToHexChainId(network.chainId)
                : network.chainId) === multichainNetwork,
          );

          const shouldInclude =
            !isBuiltInNetwork && !isFeaturedRpc && !isMultichainProviderConfig;

          if (shouldInclude || isTest) {
            (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
          }

          return [nonTestnetsList, testnetsList];
        },
        [
          {} as Record<string, MultichainNetworkConfiguration>,
          {} as Record<string, MultichainNetworkConfiguration>,
        ],
      ),
    [multichainNetworks, showDefaultNetworks],
  );

  const isNetworkInDefaultNetworkTab = useCallback(
    (network: MultichainNetworkConfiguration) => {
      if (!network.isEvm) {
        return true;
      }

      return FEATURED_NETWORK_CHAIN_IDS.includes(
        convertCaipToHexChainId(network.chainId),
      );
    },
    [],
  );

  const initialTab = useMemo(() => {
    if (isMultichainAccountsState2Enabled && allEnabledNetworks.length > 0) {
      return 'networks';
    }
    if (!currentMultichainNetwork.isEvm) {
      return 'networks';
    }

    const isCustomNetworkEnabled = FEATURED_NETWORK_CHAIN_IDS.some((chainId) =>
      Object.keys(enabledNetworksByNamespace).includes(chainId),
    );

    return isCustomNetworkEnabled ? 'networks' : 'custom-networks';
  }, []);

  return {
    nonTestNetworks,
    testNetworks,
    isNetworkInDefaultNetworkTab,
    initialTab,
  };
};
