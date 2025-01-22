import {
  type CaipAccountId,
  type CaipChainId,
  Hex,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/multichain';
import {
  CaveatTypes,
  EndowmentTypes,
} from '../../../../shared/constants/permissions';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';

export type PermissionsRequest = Record<
  string,
  { caveats?: { type: string; value: Caip25CaveatValue }[] }
>;

// TODO: jsdocs
function getCaip25CaveatValue(
  permissions?: PermissionsRequest,
): Caip25CaveatValue | undefined {
  const caip25Permissions = permissions?.[EndowmentTypes.caip25];
  return caip25Permissions?.caveats?.find(
    (caveat) => caveat.type === CaveatTypes.caip25,
  )?.value;
}

// TODO: jsdocs
export function getRequestedAccountsViaPermissionsRequest(
  permissions?: PermissionsRequest,
): string[] {
  const caip25CaveatValue = getCaip25CaveatValue(permissions);
  if (!caip25CaveatValue) {
    return [];
  }
  const { optionalScopes } = caip25CaveatValue;

  const allAccountsSet = new Set<string>();

  for (const { accounts } of Object.values(optionalScopes)) {
    accounts.forEach((accountId: CaipAccountId) =>
      allAccountsSet.add(parseCaipAccountId(accountId).address),
    );
  }

  return Array.from(allAccountsSet);
}

// TODO: jsdocs
export function getRequestedChainsViaPermissionsRequest(
  permissions?: PermissionsRequest,
): string[] {
  const caip25CaveatValue = getCaip25CaveatValue(permissions);
  if (!caip25CaveatValue) {
    return [];
  }

  const { optionalScopes } = caip25CaveatValue;
  const result: number[] = [];

  for (const scope of Object.keys(optionalScopes)) {
    const { reference } = parseCaipChainId(scope as CaipChainId);
    if (reference !== undefined) {
      // TODO: safely parse number
      result.push(Number(reference));
    }
  }

  return result.map((chainId) => decimalToPrefixedHex(chainId));
}

// TODO: explicit return type, jsdocs
export function parseCaip25PermissionsResponse(
  addresses: string[],
  hexChainIds: string[],
) {
  const caveatValue = {
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
    hexChainIds.filter((c) => c !== '0x0') as Hex[],
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
