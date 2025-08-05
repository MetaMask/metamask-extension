import { CaipNamespace, Hex, parseCaipAccountId } from '@metamask/utils';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  setEthAccounts,
  setPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import { MergedInternalAccountWithCaipAccountId } from '../../../selectors/selectors.types';
import { sortSelectedInternalAccounts } from '../../../helpers/utils/util';

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
export function getCaip25CaveatValueFromPermissions(
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
  const satisfiedNamespaces = new Set<CaipNamespace>();

  supportedRequestedAccounts.forEach((account) => {
    const {
      chain: { namespace },
    } = parseCaipAccountId(account.caipAccountId);
    if (requestedNamespaces.includes(namespace)) {
      defaultAccounts.push(account);
      satisfiedNamespaces.add(namespace);
    }
  });

  const unsatisfiedNamespaces = requestedNamespaces.filter(
    (namespace) => !satisfiedNamespaces.has(namespace),
  );

  if (unsatisfiedNamespaces.length > 0) {
    const allAccountsSortedByLastSelected =
      sortSelectedInternalAccounts(allAccounts);

    for (const namespace of unsatisfiedNamespaces) {
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
  }

  return defaultAccounts;
}
