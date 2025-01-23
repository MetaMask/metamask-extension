import {
  type CaipAccountId,
  type CaipChainId,
  Hex,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import {
  Caip25CaveatValue,
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

/**
 * Safely parses a string to a number, returning undefined if parsing fails.
 *
 * @param value - The string to parse.
 * @returns The parsed number or undefined if parsing fails.
 */
// TODO: I'm assuming we should have already something like this in such a big code base, where is it ? Or do we keep this implementation ?
function safeParseInt(value: string): number | undefined {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Takes in an incoming {@link PermissionsRequest} and attempts to return the {@link Caip25CaveatValue} with the Ethereum accounts set.
 *
 * @param permissions - The {@link PermissionsRequest} with the target name of the CAIP-25 endowment permission.
 * @returns The {@link Caip25CaveatValue} with the Ethereum accounts set. If Caip25 Caveat Type is not found, returns `undefined`.
 */
function getCaip25CaveatValue(
  permissions?: PermissionsRequest,
): Caip25CaveatValue | undefined {
  const caip25Permissions = permissions?.[EndowmentTypes.caip25];
  return caip25Permissions?.caveats?.find(
    (caveat) => caveat.type === CaveatTypes.caip25,
  )?.value;
}

/**
 * Takes in an incoming {@link PermissionsRequest} and attempts to return the list of requested Ethereum accounts.
 *
 * @param permissions - The {@link PermissionsRequest} with the target name of the CAIP-25 endowment permission.
 * @returns The list of requested Ethereum accounts.
 */
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

/**
 * Takes in an incoming {@link PermissionsRequest} and attempts to return the list of requested chains.
 *
 * @param permissions - The {@link PermissionsRequest} with the target name of the CAIP-25 endowment permission.
 * @returns The list of requested chains.
 */
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
    if (scope === 'wallet:eip155') {
      continue;
    }

    // TODO: [perhaps create multichain ticket?]
    // if I pass something other than a number here (for example, scope "eip:155", we get "0x0"). Is this expected behaviour?
    const { reference } = parseCaipChainId(scope as CaipChainId);
    const parsedReference = safeParseInt(reference);

    if (parsedReference) {
      result.push(parsedReference);
    }
  }

  return result.map((chainId) => decimalToPrefixedHex(chainId));
}

/**
 * Parses the CAIP-25 authorized permissions object after UI confirmation.
 *
 * @param addresses - The list of permitted addresses.
 * @param hexChainIds - The list of permitted chains.
 * @returns
 */
// TODO: advice, should we move this behaviour to @metamask/multichain lib?
export function parseCaip25PermissionsResponse(
  addresses: string[],
  hexChainIds: string[],
) {
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
      [EndowmentTypes.caip25]: {
        caveats: [
          {
            type: CaveatTypes.caip25,
            value: caveatValueWithAccounts,
          },
        ],
      },
    },
  };
}
