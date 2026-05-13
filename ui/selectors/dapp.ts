import { isEvmAccountType } from '@metamask/keyring-api';
import { KnownSessionProperties } from '@metamask/chain-agnostic-permission';
import { getNetworkConfigurationsByChainId } from '../../shared/lib/selectors/networks';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import { getCaip25CaveatValueFromPermissions } from '../pages/permissions-connect/connect-page/utils';
import {
  getOrderedConnectedAccountsForActiveTab,
  getOriginOfCurrentTab,
  getPermissions,
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

/**
 * Determines whether the network picker should be shown for the current tab's
 * dapp connection. Returns `true` only when the CAIP-25 caveat contains
 * `sessionProperties["eip1193-compatible"].
 *
 * This property is set for:
 *
 * - Legacy `window.ethereum` / EIP-1193 connections (injected by the
 * extension's EIP-1193 middleware in metamask-controller.js)
 * - `@metamask/connect-evm` connections (set by connect-evm itself)
 *
 * Pure Multichain API connections — even those with only `eip155:*` scopes —
 * will NOT have this property and will not show the network picker.
 */
export const getIsEip1193CompatibleConnection = createDeepEqualSelector(
  getOriginOfCurrentTab,
  (state) => {
    const origin = getOriginOfCurrentTab(state);
    return origin ? getPermissions(state, origin) : undefined;
  },
  (_origin, permissions) => {
    if (!permissions) {
      return false;
    }

    const caveatValue = getCaip25CaveatValueFromPermissions(permissions);
    return (
      caveatValue.sessionProperties?.[
        KnownSessionProperties.Eip1193Compatible
      ] === true
    );
  },
);
