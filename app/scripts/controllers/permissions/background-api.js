import { nanoid } from 'nanoid';
import {
  MethodNames,
  PermissionDoesNotExistError,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  setEthAccounts,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from '@metamask/multichain';
import { isSnapId } from '@metamask/snaps-utils';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { PermissionNames } from './specifications';

export function getPermissionBackgroundApiMethods({
  permissionController,
  approvalController,
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
  const addMoreAccounts = (origin, accounts) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot add account permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
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
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot add chain permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
    }

    const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

    const updatedEthChainIds = Array.from(
      new Set([...ethChainIds, ...chainIds]),
    );

    const caveatValueWithChains = setPermittedEthChainIds(
      caip25Caveat.value,
      updatedEthChainIds,
    );

    // ensure that the list of permitted eth accounts is set for the newly added eth scopes
    const ethAccounts = getEthAccounts(caveatValueWithChains);
    const caveatValueWithAccountsSynced = setEthAccounts(
      caveatValueWithChains,
      ethAccounts,
    );

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      caveatValueWithAccountsSynced,
    );
  };

  const requestAccountsAndChainPermissions = async (origin, id) => {
    // Note that we are purposely requesting an approval from the ApprovalController
    // and then manually forming the permission that is then granted via the
    // PermissionController rather than calling the PermissionController.requestPermissions()
    // directly because the Approval UI is still dependent on the notion of there
    // being separate "eth_accounts" and "endowment:permitted-chains" permissions.
    // After that depedency is refactored, we can move to requesting "endowment:caip25"
    // directly from the PermissionController instead.
    const legacyApproval = await approvalController.addAndShowApprovalRequest({
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
      type: MethodNames.RequestPermissions,
    });

    const newCaveatValue = {
      requiredScopes: {},
      optionalScopes: {},
      isMultichainOrigin: false,
    };

    const caveatValueWithChains = setPermittedEthChainIds(
      newCaveatValue,
      legacyApproval.approvedChainIds,
    );

    const caveatValueWithAccounts = setEthAccounts(
      caveatValueWithChains,
      legacyApproval.approvedAccounts,
    );

    permissionController.grantPermissions({
      subject: { origin },
      approvedPermissions: {
        [Caip25EndowmentPermissionName]: {
          caveats: [
            {
              type: Caip25CaveatType,
              value: caveatValueWithAccounts,
            },
          ],
        },
      },
    });
  };

  return {
    addPermittedAccount: (origin, account) =>
      addMoreAccounts(origin, [account]),

    addPermittedAccounts: (origin, accounts) =>
      addMoreAccounts(origin, accounts),

    removePermittedAccount: (origin, account) => {
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove account "${account}": No permissions exist for origin "${origin}".`,
        );
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
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove permission for chainId "${chainId}": No permissions exist for origin "${origin}".`,
        );
      }

      const existingEthChainIds = getPermittedEthChainIds(caip25Caveat.value);

      const remainingChainIds = existingEthChainIds.filter(
        (existingChainId) => existingChainId !== chainId,
      );

      if (remainingChainIds.length === existingEthChainIds.length) {
        return;
      }

      if (remainingChainIds.length === 0 && !isSnapId(origin)) {
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

    requestAccountsAndChainPermissionsWithId: (origin) => {
      const id = nanoid();
      requestAccountsAndChainPermissions(origin, id);
      return id;
    },
  };
}
