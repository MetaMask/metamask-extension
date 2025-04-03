import { CaipNamespace, Hex, parseCaipAccountId } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MergedInternalAccountWithCaipAccountId } from '../../../selectors/selectors.types';

export type PermissionsRequest = Record<
  string,
  { caveats?: { type: string; value: Caip25CaveatValue }[] }
>;

/**
 * Takes in an incoming {@link PermissionsRequest} and attempts to return the {@link Caip25CaveatValue}.
 *
 * @param permissions - The {@link PermissionsRequest} with the target name of the {@link Caip25EndowmentPermissionName}.
 * @returns The {@link Caip25CaveatValue}.
 */
export function getRequestedCaip25CaveatValue(
  permissions?: PermissionsRequest,
): Caip25CaveatValue {
  return (
    permissions?.[Caip25EndowmentPermissionName]?.caveats?.find(
      (caveat) => caveat.type === Caip25CaveatType,
    )?.value ?? {
      optionalScopes: {},
      requiredScopes: {},
      sessionProperties: {},
      isMultichainOrigin: false,
    }
  );
}

/**
 * Modifies the requested CAIP-25 permissions object after UI confirmation.
 *
 * @param caip25CaveatValue - The requested CAIP-25 caveat value to modify.
 * @param ethAccountAddresses - The list of permitted eth addresses.
 * @param ethChainIds - The list of permitted eth chainIds.
 */
export function getCaip25PermissionsResponse(
  caip25CaveatValue: Caip25CaveatValue,
  ethAccountAddresses: Hex[],
  ethChainIds: Hex[],
): {
  [Caip25EndowmentPermissionName]: {
    caveats: [{ type: string; value: Caip25CaveatValue }];
  };
} {
  const caveatValueWithChains = setPermittedEthChainIds(
    caip25CaveatValue,
    ethChainIds,
  );

  const caveatValueWithAccounts = setEthAccounts(
    caveatValueWithChains,
    ethAccountAddresses,
  );

  return {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: caveatValueWithAccounts,
        },
      ],
    },
  };
}

/**
 * Filters networks based on the CAIP request scopes.
 *
 * @param networks - Network configurations.
 * @param requestedCaip25CaveatValue - CAIP-25 caveat value.
 * @returns Filtered network configurations matching the requested scopes.
 */
export function getFilteredNetworks(
  networks: Record<string, NetworkConfiguration>,
  requestedCaip25CaveatValue: Caip25CaveatValue,
): Record<string, NetworkConfiguration> {
  const filteredNetworks: Record<string, NetworkConfiguration> = {};
  const allScopes = {
    ...(requestedCaip25CaveatValue.requiredScopes || {}),
    ...(requestedCaip25CaveatValue.optionalScopes || {}),
  };

  const hasEipRequest = Object.keys(allScopes).some(
    (scope) => scope.startsWith('eip155:') || scope.startsWith('wallet:eip155'),
  );

  Object.entries(networks).forEach(([chainId, network]) => {
    if (chainId.startsWith('0x')) {
      if (hasEipRequest) {
        filteredNetworks[chainId] = network;
      }
    } else if (Object.keys(allScopes).includes(chainId)) {
      filteredNetworks[chainId] = network;
    }
  });

  return filteredNetworks;
}

/**
 * Gets the default accounts for the requested namespaces.
 * We need at least one default per requested namespace
 * if there are more explicitly requested accounts, use those instead
 * for that namespace
 *
 * @param requestedNamespaces - The namespaces requested.
 * @param supportedRequestedAccounts - The supported requested accounts.
 * @param allAccounts - All available accounts.
 */
export function getDefaultAccounts(
  requestedNamespaces: CaipNamespace[],
  supportedRequestedAccounts: MergedInternalAccountWithCaipAccountId[],
  allAccounts: MergedInternalAccountWithCaipAccountId[],
): MergedInternalAccountWithCaipAccountId[] {
  const defaultAccounts: MergedInternalAccountWithCaipAccountId[] = [];

  supportedRequestedAccounts.forEach((account) => {
    const {
      chain: { namespace },
    } = parseCaipAccountId(account.caipAccountId);
    if (requestedNamespaces.includes(namespace)) {
      defaultAccounts.push(account);
    }
  });

  // sort accounts by lastSelected descending
  const allAccountsSortedByLastSelected = allAccounts.sort((a, b) => {
    const lastSelectedA = a.metadata.lastSelected;
    const lastSelectedB = b.metadata.lastSelected;
    if (!lastSelectedA && !lastSelectedB) {
      return 0;
    }
    if (!lastSelectedA) {
      return 1;
    }
    if (!lastSelectedB) {
      return -1;
    }

    if (lastSelectedA > lastSelectedB) {
      return -1;
    } else if (lastSelectedA < lastSelectedB) {
      return 1;
    }
    return 0;
  });

  requestedNamespaces.forEach((namespace) => {
    if (
      !defaultAccounts.find((account) => {
        const {
          chain: { namespace: accountNamespace },
        } = parseCaipAccountId(account.caipAccountId);
        return accountNamespace === namespace;
      })
    ) {
      const defaultAccountForNamespace = allAccountsSortedByLastSelected.find(
        (account) => {
          const {
            chain: { namespace: accountNamespace },
          } = parseCaipAccountId(account.caipAccountId);
          return accountNamespace === namespace;
        },
      );
      if (defaultAccountForNamespace) {
        defaultAccounts.push(defaultAccountForNamespace);
      }
    }
  });

  return defaultAccounts;
}
