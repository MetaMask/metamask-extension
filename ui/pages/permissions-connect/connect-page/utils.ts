import {
  CaipAccountAddress,
  CaipNamespace,
  CaipReference,
  Hex,
  parseCaipAccountId,
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
 * Filters and returns accounts available for selection based on the scope requested.
 *
 * @param accounts - All available accounts.
 * @param requestedNamespaces - The namespaces requested.
 * @returns Accounts available for selection.
 */
export function getFilteredAccounts(
  accounts: {
    internalAccount: MergedInternalAccount;
    address: CaipAccountAddress;
    namespace: CaipNamespace;
    reference: CaipReference;
  }[],
  requestedNamespaces: CaipNamespace[],
): {
  internalAccount: MergedInternalAccount;
  address: CaipAccountAddress;
  namespace: CaipNamespace;
  reference: CaipReference;
}[] {
  const filteredAccounts = accounts.filter((account) => {
    return requestedNamespaces.includes(account.namespace);
  });

  return filteredAccounts;

  //   const evmScopesAreRequested = Array.from(requestedScopes).some(
  //     (scope) => scope.startsWith('eip155:') || scope.startsWith('wallet:eip155'),
  //   );

  //   const filteredAccounts = accounts.filter((account) => {
  //     const hasUniversalEipScope =
  //       hasEipRequests && account.scopes.includes('eip155:0');

  //     if (hasUniversalEipScope) {
  //       return true;
  //     }
  //     /*
  //     [
  //     {
  //         "type": "solana:data-account",
  //         "id": "705449e6-e9e4-41b0-a2ef-d56689fd6b6a",
  //         "address": "43gdHDjZKnum4iZ2snLih2fu9FGWytHeFu9Fv2j91dCb",
  //         "options": {
  //             "scope": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  //             "entropySource": "01JNSCFB61ZBXCHWCBT0CNZSHW",
  //             "imported": false
  //         },
  //         "methods": [
  //             "signAndSendTransaction",
  //             "signTransaction",
  //             "signMessage",
  //             "signIn"
  //         ],
  //         "scopes": [
  //             "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  //             "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
  //             "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
  //         ],
  //         "metadata": {
  //             "name": "Solana Account 1",
  //             "importTime": 1741642143176,
  //             "keyring": {
  //                 "type": "Snap Keyring"
  //             },
  //             "snap": {
  //                 "id": "npm:@metamask/solana-wallet-snap",
  //                 "name": "Solana",
  //                 "enabled": true
  //             },
  //             "lastSelected": 1742928117271
  //         },
  //         "balance": "0",
  //         "pinned": false,
  //         "hidden": false,
  //         "active": false
  //     },
  //     {
  //         "type": "solana:data-account",
  //         "id": "cd709c6e-4a32-454b-bfe7-02e26024d0b3",
  //         "address": "BUDhihG2wwL7aCmnQyv5g7Mw4Rqo8oiEhgJVDdSdW9b4",
  //         "options": {
  //             "scope": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  //             "entropySource": "01JNSCFB61ZBXCHWCBT0CNZSHW",
  //             "imported": false
  //         },
  //         "methods": [
  //             "signAndSendTransaction",
  //             "signTransaction",
  //             "signMessage",
  //             "signIn"
  //         ],
  //         "scopes": [
  //             "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  //             "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
  //             "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
  //         ],
  //         "metadata": {
  //             "name": "Solana Account 2",
  //             "importTime": 1741728982744,
  //             "keyring": {
  //                 "type": "Snap Keyring"
  //             },
  //             "snap": {
  //                 "id": "npm:@metamask/solana-wallet-snap",
  //                 "name": "Solana",
  //                 "enabled": true
  //             },
  //             "lastSelected": 1742928115471
  //         },
  //         "balance": "0",
  //         "pinned": false,
  //         "hidden": false,
  //         "active": false
  //     }
  // ]
  //     */

  //     return account.scopes.some((accountScope) =>
  //       requestedScopes.has(accountScope),
  //     );

  // return filteredAccounts.map((internalAccount: MergedInternalAccount) => {
  //   const { namespace, reference } = parseCaipChainId(
  //     internalAccount.scopes[0],
  //   );
  //   return {
  //     address: internalAccount.address,
  //     namespace,
  //     reference,
  //   };
  // });
}

/**
 * Find and return available requested accounts.
 *
 * @param requestedCaip25CaveatValue - CAIP-25 request values.
 * @returns Accounts available for requesting.
 */
export function getRequestedAccounts(
  requestedCaip25CaveatValue: Caip25CaveatValue,
) {
  const requiredNonEvmAccounts = Object.values(
    requestedCaip25CaveatValue.requiredScopes,
  )
    .flatMap((scope) => scope.accounts)
    .map((account) => account.split(':').pop() ?? '')
    .filter(Boolean);

  const optionalNonEvmAccounts = Object.values(
    requestedCaip25CaveatValue.optionalScopes,
  )
    .flatMap((scope) => scope.accounts)
    .map((account) => account.split(':').pop() ?? '')
    .filter(Boolean);

  return [...requiredNonEvmAccounts, ...optionalNonEvmAccounts].filter(Boolean);
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
  )
    .flatMap((scope) => scope.accounts)
    .map((account) => ({
      address: parseCaipAccountId(account).address,
      namespace: parseCaipAccountId(account).chain.namespace,
      reference: parseCaipAccountId(account).chain.reference,
    }));

  const optionalAccounts = Object.values(
    requestedCaip25CaveatValue.optionalScopes,
  )
    .flatMap((scope) => scope.accounts)
    .map((account) => ({
      address: parseCaipAccountId(account).address,
      namespace: parseCaipAccountId(account).chain.namespace,
      reference: parseCaipAccountId(account).chain.reference,
    }));

  return [...requiredAccounts, ...optionalAccounts];
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
  // This ensures backwards compatability
  // if (
  //   !requestedCaip25CaveatValue ||
  //   (!requestedCaip25CaveatValue.requiredScopes &&
  //     !requestedCaip25CaveatValue.optionalScopes)
  // ) {
  //   return networks;
  // }

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

// We need at least one default per requested namespace
// if there are more explicitly requested accounts, use those instead
// for that namespace
export function getDefaultAccounts(
  requestedNamespaces: CaipNamespace[],
  supportedRequestedAccounts: {
    internalAccount: MergedInternalAccount;
    address: CaipAccountAddress;
    namespace: CaipNamespace;
    reference: CaipReference;
  }[],
  allAccounts: {
    internalAccount: MergedInternalAccount;
    address: CaipAccountAddress;
    namespace: CaipNamespace;
    reference: CaipReference;
  }[],
): {
  internalAccount: MergedInternalAccount;
  address: CaipAccountAddress;
  namespace: CaipNamespace;
  reference: CaipReference;
}[] {
  const defaultAccounts: {
    internalAccount: MergedInternalAccount;
    address: CaipAccountAddress;
    namespace: CaipNamespace;
    reference: CaipReference;
  }[] = [];

  supportedRequestedAccounts.forEach((account) => {
    if (requestedNamespaces.includes(account.namespace)) {
      defaultAccounts.push(account);
    }
  });

  requestedNamespaces.forEach((namespace) => {
    if (!defaultAccounts.find((account) => account.namespace === namespace)) {
      const defaultAccountForNamespace = allAccounts.find(
        (account) => account.namespace === namespace,
      );
      if (defaultAccountForNamespace) {
        defaultAccounts.push(defaultAccountForNamespace);
      }
    }
  });

  return defaultAccounts;
}
