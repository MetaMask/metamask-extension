import { Hex } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/multichain';

export type PermissionsRequest = Record<
  string,
  { caveats?: { type: string; value: Caip25CaveatValue }[] }
>;

/**
 * Takes in an incoming {@link PermissionsRequest} and attempts to return the {@link Caip25CaveatValue} with the Ethereum accounts set.
 *
 * @param permissions - The {@link PermissionsRequest} with the target name of the {@link Caip25EndowmentPermissionName}.
 * @returns The {@link Caip25CaveatValue} with the Ethereum accounts set.
 */
export function getRequestedSessionScopes(
  permissions?: PermissionsRequest,
): Pick<Caip25CaveatValue, 'requiredScopes' | 'optionalScopes'> {
  return (
    permissions?.[Caip25EndowmentPermissionName]?.caveats?.find(
      (caveat) => caveat.type === Caip25CaveatType,
    )?.value ?? {
      optionalScopes: {},
      requiredScopes: {},
    }
  );
}

/**
 * Parses the CAIP-25 authorized permissions object after UI confirmation.
 *
 * @param addresses - The list of permitted addresses.
 * @param hexChainIds - The list of permitted chains.
 * @returns The granted permissions with the target name of the {@link Caip25EndowmentPermissionName}.
 */
export function getCaip25PermissionsResponse(
  addresses: string[],
  hexChainIds: string[],
): {
  permissions: {
    [Caip25EndowmentPermissionName]: {
      caveats: [{ type: string; value: Caip25CaveatValue }];
    };
  };
} {
  const caveatValue: Caip25CaveatValue = {
    requiredScopes: {},
    optionalScopes: {
      'wallet:eip155': {
        accounts: [],
      },
    },
    isMultichainOrigin: false,
  };

  const caveatValueWithChains = setPermittedEthChainIds(
    caveatValue,
    hexChainIds as Hex[],
  );

  const caveatValueWithAccounts = setEthAccounts(
    caveatValueWithChains,
    addresses as Hex[],
  );

  return {
    permissions: {
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: caveatValueWithAccounts,
          },
        ],
      },
    },
  };
}
