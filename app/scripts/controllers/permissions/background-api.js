import nanoid from 'nanoid';
import { MethodNames } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../lib/multichain-api/caip25permissions';
import {
  getEthAccounts,
  setEthAccounts,
} from '../../lib/multichain-api/adapters/caip-permission-adapter-eth-accounts';
import {
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from '../../lib/multichain-api/adapters/caip-permission-adapter-permittedChains';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { PermissionNames } from './specifications';

export function getPermissionBackgroundApiMethods({
  permissionController,
  approvalController,
}) {
  // To add more than one account when already connected to the dapp
  const addMoreAccounts = (origin, accounts) => {
    let caip25Caveat;
    try {
      caip25Caveat = permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    } catch (err) {
      // noop
    }

    if (!caip25Caveat) {
      throw new Error('tried to add accounts when none have been permissioned'); // TODO: better error
    }

    const ethAccounts = getEthAccounts(caip25Caveat.value);

    const updatedEthAccounts = Array.from(
      new Set([...ethAccounts, ...accounts]),
    );

    const updatedCaveatValue = setEthAccounts(
      caip25Caveat.value,
      updatedEthAccounts,
    );

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      updatedCaveatValue,
    );
  };

  const addMoreChains = (origin, chainIds) => {
    let caip25Caveat;
    try {
      caip25Caveat = permissionController.getCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    } catch (err) {
      // noop
    }

    if (!caip25Caveat) {
      throw new Error('tried to add chains when none have been permissioned'); // TODO: better error
    }

    // get the list of permitted eth accounts before we modify the permitted chains and potentially lose some
    const ethAccounts = getEthAccounts(caip25Caveat.value);

    const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

    const updatedEthChainIds = Array.from(
      new Set([...ethChainIds, ...chainIds]),
    );

    let updatedCaveatValue = setPermittedEthChainIds(
      caip25Caveat.value,
      updatedEthChainIds,
    );

    // ensure that the list of permitted eth accounts is intact after permitted chain updates
    updatedCaveatValue = setEthAccounts(updatedCaveatValue, ethAccounts);

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      updatedCaveatValue,
    );
  };

  const requestAccountsAndChainPermissionsWithId = (origin) => {
    const id = nanoid();
    // NOTE: the eth_accounts/permittedChains approvals will be combined in the future.
    // Until they are actually combined, when testing, you must request both
    // eth_accounts and permittedChains together.
    approvalController
      .addAndShowApprovalRequest({
        id,
        origin,
        requestData: {
          metadata: {
            id,
            origin,
          },
          permissions: {
            [RestrictedMethods.eth_accounts]: {},
            [PermissionNames.permittedChains]: {},
          },
        },
        type: MethodNames.requestPermissions,
      })
      .then((legacyApproval) => {
        let caveatValue = {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
        };
        caveatValue = setPermittedEthChainIds(
          caveatValue,
          legacyApproval.approvedChainIds,
        );

        caveatValue = setEthAccounts(
          caveatValue,
          legacyApproval.approvedAccounts,
        );

        permissionController.grantPermissions({
          subject: { origin },
          approvedPermissions: {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: caveatValue,
                },
              ],
            },
          },
        });
      });

    return id;
  };

  return {
    addPermittedAccount: (origin, account) =>
      addMoreAccounts(origin, [account]),

    addPermittedAccounts: (origin, accounts) =>
      addMoreAccounts(origin, accounts),

    removePermittedAccount: (origin, account) => {
      let caip25Caveat;
      try {
        caip25Caveat = permissionController.getCaveat(
          origin,
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
        );
      } catch (err) {
        // noop
      }

      if (!caip25Caveat) {
        throw new Error(
          'tried to remove accounts when none have been permissioned',
        ); // TODO: better error
      }

      const existingAccounts = getEthAccounts(caip25Caveat.value);

      const remainingAccounts = existingAccounts.filter(
        (existingAccount) => existingAccount !== account,
      );

      if (remainingAccounts.length === existingAccounts.length) {
        return;
      }

      if (remainingAccounts.length === 0) {
        permissionController.revokePermission(
          origin,
          Caip25EndowmentPermissionName,
        );
      } else {
        const updatedCaveatValue = setEthAccounts(
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
      let caip25Caveat;
      try {
        caip25Caveat = permissionController.getCaveat(
          origin,
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
        );
      } catch (err) {
        // noop
      }

      if (!caip25Caveat) {
        throw new Error(
          'tried to remove chains when none have been permissioned',
        ); // TODO: better error
      }

      const existingEthChainIds = getPermittedEthChainIds(caip25Caveat.value);

      const remainingChainIds = existingEthChainIds.filter(
        (existingChainId) => existingChainId !== chainId,
      );

      if (remainingChainIds.length === existingEthChainIds.length) {
        return;
      }

      // TODO: Is this right? Do we want to revoke the entire
      // CAIP-25 permission if no eip-155 chains are left?
      if (remainingChainIds.length === 0) {
        permissionController.revokePermission(
          origin,
          Caip25EndowmentPermissionName,
        );
      } else {
        const updatedCaveatValue = setPermittedEthChainIds(
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

    requestAccountsAndChainPermissionsWithId,

    // TODO: Remove this / DRY with requestAccountsAndChainPermissionsWithId
    requestAccountsPermissionWithId: requestAccountsAndChainPermissionsWithId,
  };
}
