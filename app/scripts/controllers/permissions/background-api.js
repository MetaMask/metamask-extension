import nanoid from 'nanoid';
import { MethodNames } from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  setEthAccounts,
  getPermittedEthChainIds,
  setPermittedEthChainIds,
} from '@metamask/multichain';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import { PermissionNames } from './specifications';

const snapsPrefixes = ['npm:', 'local:'];
const isSnap = (origin) =>
  snapsPrefixes.some((prefix) => origin.startsWith(prefix));

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
        `Cannot add chain permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
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

      if (remainingChainIds.length === 0 && !isSnap(origin)) {
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
    },
  };
}
