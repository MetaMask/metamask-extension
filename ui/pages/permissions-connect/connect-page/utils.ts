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
