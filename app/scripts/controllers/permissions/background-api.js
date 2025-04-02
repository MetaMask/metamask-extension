import { nanoid } from 'nanoid';
import {
  MethodNames,
  PermissionDoesNotExistError,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  setPermittedChainIds,
  setPermittedAccounts,
} from '@metamask/chain-agnostic-permission';
import { isSnapId } from '@metamask/snaps-utils';
import { parseCaipAccountId, parseCaipChainId } from '@metamask/utils';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

export function getPermissionBackgroundApiMethods({
  permissionController,
  approvalController,
  accountsController,
}) {
  // Returns the CAIP-25 caveat or undefined if it does not exist
  const getCaip25Caveat = (origin) => {
    let caip25Caveat;
    try {
      caip25Caveat = permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    } catch (err) {
      if (err instanceof PermissionDoesNotExistError) {
        // suppress expected error in case that the origin
        // does not have the target permission yet
      } else {
        throw err;
      }
    }
    return caip25Caveat;
  };

  // To add more than one account when already connected to the dapp
  const addMoreAccounts = (origin, addresses) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot add account permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
    }

    const internalAccounts = addresses.map((address) => {
      return accountsController.getAccountByAddress(address);
    });

    const caipAccountIds = internalAccounts.map((internalAccount) => {
      const { namespace, reference } = parseCaipChainId(
        internalAccount.scopes[0],
      );
      return `${namespace}:${reference}:${internalAccount.address}`;
    });

    // TODO dry this into core
    const permittedAccounts = new Set();
    Object.values(caip25Caveat.value.requiredScopes).forEach(({ accounts }) => {
      accounts.forEach((account) => {
        permittedAccounts.add(account);
      });
    });
    Object.values(caip25Caveat.value.optionalScopes).forEach(({ accounts }) => {
      accounts.forEach((account) => {
        permittedAccounts.add(account);
      });
    });

    caipAccountIds.forEach((account) => {
      permittedAccounts.add(account);
    });

    const updatedAccounts = Array.from(permittedAccounts);

    const updatedCaveatValue = setPermittedAccounts(
      caip25Caveat.value,
      updatedAccounts,
    );

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      updatedCaveatValue,
    );
  };

  const addMoreChains = (origin, chainIds) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot add chain permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
    }

    // TODO dry and or move to @metamask/chain-agnostic-permission
    const requiredScopes = Object.keys(caip25Caveat.value.requiredScopes);
    const optionalScopes = Object.keys(caip25Caveat.value.optionalScopes);
    const updatedChainIds = Array.from(
      new Set([...requiredScopes, ...optionalScopes, ...chainIds]),
    );

    const caveatValueWithChains = setPermittedChainIds(
      caip25Caveat.value,
      updatedChainIds,
    );

    // TODO dry this into core
    const permittedAccounts = new Set();
    Object.values(caip25Caveat.value.requiredScopes).forEach(({ accounts }) => {
      accounts.forEach((account) => {
        permittedAccounts.add(account);
      });
    });
    Object.values(caip25Caveat.value.optionalScopes).forEach(({ accounts }) => {
      accounts.forEach((account) => {
        permittedAccounts.add(account);
      });
    });

    // ensure that the list of permitted accounts is set for the newly added scopes
    const caveatValueWithAccountsSynced = setPermittedAccounts(
      caveatValueWithChains,
      Array.from(permittedAccounts),
    );

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      caveatValueWithAccountsSynced,
    );
  };

  const requestAccountsAndChainPermissions = async (origin, id) => {
    /**
     * Note that we are purposely requesting an approval from the ApprovalController
     * and then manually forming the permission that is then granted via the
     * PermissionController rather than calling the PermissionController.requestPermissions()
     * directly because the CAIP-25 permission is missing the factory method implementation.
     * After the factory method is added, we can move to requesting "endowment:caip25"
     * directly from the PermissionController instead.
     */
    const { permissions } = await approvalController.addAndShowApprovalRequest({
      id,
      origin,
      requestData: {
        metadata: {
          id,
          origin,
        },
        permissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {},
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      },
      type: MethodNames.RequestPermissions,
    });

    permissionController.grantPermissions({
      subject: { origin },
      approvedPermissions: permissions,
    });
  };

  return {
    addPermittedAccount: (origin, account) =>
      addMoreAccounts(origin, [account]),

    addPermittedAccounts: (origin, accounts) =>
      addMoreAccounts(origin, accounts),

    removePermittedAccount: (origin, address) => {
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove account "${address}": No permissions exist for origin "${origin}".`,
        );
      }

      // TODO dry this into core
      const permittedAccounts = new Set();
      Object.values(caip25Caveat.value.requiredScopes).forEach(
        ({ accounts }) => {
          accounts.forEach((account) => {
            permittedAccounts.add(account);
          });
        },
      );
      Object.values(caip25Caveat.value.optionalScopes).forEach(
        ({ accounts }) => {
          accounts.forEach((account) => {
            permittedAccounts.add(account);
          });
        },
      );

      const existingAccounts = Array.from(permittedAccounts);

      const internalAccount = accountsController.getAccountByAddress(address);

      const remainingAccounts = existingAccounts.filter((existingAccount) => {
        const {
          address: existingAddress,
          chain: { namespace: existingNamespace, reference: existingReference },
        } = parseCaipAccountId(existingAccount);

        const matchesExistingAccount = internalAccount.scopes.some((scope) => {
          const { namespace, reference } = parseCaipChainId(scope);

          if (
            namespace !== existingNamespace ||
            !isEqualCaseInsensitive(internalAccount.address, existingAddress)
          ) {
            return false;
          }

          return reference === '0' || reference === existingReference;
        });

        return !matchesExistingAccount;
      });

      if (remainingAccounts.length === existingAccounts.length) {
        return;
      }

      if (remainingAccounts.length === 0) {
        permissionController.revokePermission(
          origin,
          Caip25EndowmentPermissionName,
        );
      } else {
        const updatedCaveatValue = setPermittedAccounts(
          caip25Caveat.value,
          remainingAccounts,
        );
        permissionController.updateCaveat(
          origin,
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          updatedCaveatValue,
        );
      }
    },

    addPermittedChain: (origin, chainId) => addMoreChains(origin, [chainId]),

    addPermittedChains: (origin, chainIds) => addMoreChains(origin, chainIds),

    removePermittedChain: (origin, chainId) => {
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove permission for chainId "${chainId}": No permissions exist for origin "${origin}".`,
        );
      }

      // TODO dry and or move to @metamask/chain-agnostic-permission
      const requiredScopes = Object.keys(caip25Caveat.value.requiredScopes);
      const optionalScopes = Object.keys(caip25Caveat.value.optionalScopes);

      const existingChainIds = Array.from(
        new Set([...requiredScopes, ...optionalScopes]),
      );

      const remainingChainIds = existingChainIds.filter(
        (existingChainId) => existingChainId !== chainId,
      );

      if (remainingChainIds.length === existingChainIds.length) {
        return;
      }

      if (remainingChainIds.length === 0 && !isSnapId(origin)) {
        permissionController.revokePermission(
          origin,
          Caip25EndowmentPermissionName,
        );
      } else {
        const updatedCaveatValue = setPermittedChainIds(
          caip25Caveat.value,
          remainingChainIds,
        );
        permissionController.updateCaveat(
          origin,
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          updatedCaveatValue,
        );
      }
    },

    requestAccountsAndChainPermissionsWithId: (origin) => {
      const id = nanoid();
      requestAccountsAndChainPermissions(origin, id);
      return id;
    },
  };
}
