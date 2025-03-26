import {
  CaipNamespace,
  Hex,
  CaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { NetworkConfiguration } from '@metamask/network-controller';
import { MergedInternalAccount } from '../../../selectors/selectors.types';

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
 * Gets a list of unique accounts from the given CAIP-25 caveat value.
 *
 * @param requestedCaip25CaveatValue - CAIP-25 request values.
 * @returns Accounts available for requesting.
 */
export function getAllRequestedAccounts(
  requestedCaip25CaveatValue: Caip25CaveatValue,
) {
  const requiredAccounts = Object.values(
    requestedCaip25CaveatValue.requiredScopes,
  ).flatMap((scope) => scope.accounts);

  const optionalAccounts = Object.values(
    requestedCaip25CaveatValue.optionalScopes,
  ).flatMap((scope) => scope.accounts);

  return new Set([...requiredAccounts, ...optionalAccounts]);
}

/**
 * Extracts chain IDs from both required and optional scopes in CAIP-25 caveat value.
 * Converts EVM chain IDs to hexadecimal format and keeps other chain identifiers as is.
 *
 * @param caveatValue - The CAIP-25 caveat value containing scopes.
 * @returns Array of chain IDs.
 */
export function getRequestedChainIds(caveatValue: Caip25CaveatValue): string[] {
  const allScopes = [
    ...Object.keys(caveatValue.requiredScopes),
    ...Object.keys(caveatValue.optionalScopes),
  ];

  return [...new Set(allScopes)].map((scope) => {
    if (scope.startsWith('eip155:')) {
      const chainId = scope.split(':')[1];
      return `0x${parseInt(chainId, 10).toString(16)}`;
    }

    return scope;
  });
}

export function getAllRequestedChainIds(
  requestedCaip25CaveatValue: Caip25CaveatValue,
) {
  const allScopes = [
    ...Object.keys(requestedCaip25CaveatValue.requiredScopes),
    ...Object.keys(requestedCaip25CaveatValue.optionalScopes),
  ];

  return [...new Set(allScopes)];
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
  supportedRequestedAccounts: {
    internalAccount: MergedInternalAccount;
    caipAccountId: CaipAccountId;
  }[],
  allAccounts: {
    internalAccount: MergedInternalAccount;
    caipAccountId: CaipAccountId;
  }[],
): {
  internalAccount: MergedInternalAccount;
  caipAccountId: CaipAccountId;
}[] {
  const defaultAccounts: {
    internalAccount: MergedInternalAccount;
    caipAccountId: CaipAccountId;
  }[] = [];

  supportedRequestedAccounts.forEach((account) => {
    const { namespace } = parseCaipChainId(account.caipAccountId);
    if (requestedNamespaces.includes(namespace)) {
      defaultAccounts.push(account);
    }
  });

  requestedNamespaces.forEach((namespace) => {
    if (
      !defaultAccounts.find((account) => {
        const { namespace: accountNamespace } = parseCaipChainId(
          account.caipAccountId,
        );
        return accountNamespace === namespace;
      })
    ) {
      const defaultAccountForNamespace = allAccounts.find((account) => {
        const { namespace: accountNamespace } = parseCaipChainId(
          account.caipAccountId,
        );
        return accountNamespace === namespace;
      });
      if (defaultAccountForNamespace) {
        defaultAccounts.push(defaultAccountForNamespace);
      }
    }
  });

  return defaultAccounts;
}
