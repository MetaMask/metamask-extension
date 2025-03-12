import { Hex } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { isEvmAccountType } from '@metamask/keyring-api';
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
 * @param requestedCaip25CaveatValue - CAIP-25 request values.
 * @returns Accounts available for selection.
 */
export function getFilteredAccounts(
  accounts: MergedInternalAccount[],
  requestedCaip25CaveatValue: Caip25CaveatValue,
): MergedInternalAccount[] {
  // This ensures backwards compatability
  if (!requestedCaip25CaveatValue.isMultichainOrigin) {
    return accounts.filter((account: MergedInternalAccount) =>
      isEvmAccountType(account.type),
    );
  }

  const requestedScopes = new Set([
    ...Object.keys(requestedCaip25CaveatValue.requiredScopes),
    ...Object.keys(requestedCaip25CaveatValue.optionalScopes),
  ]);

  const hasEipRequests = Array.from(requestedScopes).some((scope) =>
    scope.startsWith('eip155:'),
  );

  return accounts.filter((account) => {
    const hasUniversalEipScope =
      hasEipRequests && account.scopes.includes('eip155:0');

    if (hasUniversalEipScope) {
      return true;
    }

    return account.scopes.some((accountScope) =>
      requestedScopes.has(accountScope),
    );
  });
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
  if (
    !requestedCaip25CaveatValue ||
    (!requestedCaip25CaveatValue.requiredScopes &&
      !requestedCaip25CaveatValue.optionalScopes)
  ) {
    return networks;
  }

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
