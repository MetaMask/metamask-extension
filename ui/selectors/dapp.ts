import { isEvmAccountType } from '@metamask/keyring-api';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import {
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getAllDomains,
} from './selectors';
import { getMultichainNetworkConfigurationsByChainId } from './multichain';

export const getDappActiveNetwork = createDeepEqualSelector(
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getAllDomains,
  getNetworkConfigurationsByChainId,
  getMultichainNetworkConfigurationsByChainId,
  (
    orderedConnectedAccounts,
    activeTabOrigin,
    allDomains,
    networkConfigurationsByChainId,
    multichainNetworkConfigurationsByChainId,
  ) => {
    if (!orderedConnectedAccounts || orderedConnectedAccounts.length === 0) {
      return null;
    }
    const selectedAccount = orderedConnectedAccounts[0];

    // Check if account is EVM or non-EVM using existing helper
    const isEvmAccount = isEvmAccountType(selectedAccount.type);

    if (isEvmAccount) {
      if (!activeTabOrigin || !allDomains) {
        return null;
      }

      const networkClientId = allDomains[activeTabOrigin];
      if (!networkClientId) {
        return null;
      }

      for (const chainId in networkConfigurationsByChainId) {
        if (
          Object.prototype.hasOwnProperty.call(
            networkConfigurationsByChainId,
            chainId,
          )
        ) {
          const network =
            networkConfigurationsByChainId[
              chainId as keyof typeof networkConfigurationsByChainId
            ];
          const hasMatchingEndpoint = network.rpcEndpoints.some(
            (rpcEndpoint) => rpcEndpoint.networkClientId === networkClientId,
          );
          if (hasMatchingEndpoint) {
            return { ...network, isEvm: true };
          }
        }
      }
    } else {
      // TODO: Add support for other networks (Bitcoin, Solana)
      const nonEvmScope = selectedAccount.scopes.find((scope: string) =>
        scope.startsWith('solana:'),
      );

      if (nonEvmScope) {
        const network = multichainNetworkConfigurationsByChainId[nonEvmScope];
        if (network) {
          return { ...network, isEvm: false };
        }
      }
    }

    return null;
  },
);
