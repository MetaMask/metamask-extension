import { nanoid } from 'nanoid';
import {
  MethodNames,
  PermissionDoesNotExistError,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
  setNonSCACaipAccountIdsInCaip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
  getAllScopesFromCaip25CaveatValue,
  setChainIdsInCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { isSnapId } from '@metamask/snaps-utils';
import { parseCaipAccountId, parseCaipChainId } from '@metamask/utils';
import { getNetworkConfigurationsByCaipChainId } from '../../../../shared/modules/selectors/networks';

export function getPermissionBackgroundApiMethods({
  permissionController,
  approvalController,
  accountsController,
  networkController,
  multichainNetworkController,
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

  const setPermittedAccounts = (origin, caipAccountIds) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot set account permissions "${caipAccountIds.join(
          ', ',
        )}" for origin "${origin}": no permission currently exists for this origin.`,
      );
    }

    if (caipAccountIds.length === 0) {
      permissionController.revokePermission(
        origin,
        Caip25EndowmentPermissionName,
      );
      return;
    }

    const existingPermittedChainIds = getAllScopesFromCaip25CaveatValue(
      caip25Caveat.value,
    );

    let updatedPermittedChainIds = [...existingPermittedChainIds];

    const allNetworksList = Object.keys(
      getNetworkConfigurationsByCaipChainId({
        networkConfigurationsByChainId:
          networkController.state.networkConfigurationsByChainId,
        multichainNetworkConfigurationsByChainId:
          multichainNetworkController.state
            .multichainNetworkConfigurationsByChainId,
        internalAccounts: accountsController.state.internalAccounts,
      }),
    );

    caipAccountIds.forEach((caipAccountAddress) => {
      const {
        chain: { namespace: accountNamespace },
      } = parseCaipAccountId(caipAccountAddress);

      const existsSelectedChainForNamespace = updatedPermittedChainIds.some(
        (caipChainId) => {
          try {
            const { namespace: chainNamespace } = parseCaipChainId(caipChainId);
            return accountNamespace === chainNamespace;
          } catch (err) {
            return false;
          }
        },
      );

      if (!existsSelectedChainForNamespace) {
        const chainIdsForNamespace = allNetworksList.filter((caipChainId) => {
          try {
            const { namespace: chainNamespace } = parseCaipChainId(caipChainId);
            return accountNamespace === chainNamespace;
          } catch (err) {
            return false;
          }
        });

        updatedPermittedChainIds = [
          ...updatedPermittedChainIds,
          ...chainIdsForNamespace,
        ];
      }
    });

    const updatedCaveatValueWithChainIds = setChainIdsInCaip25CaveatValue(
      caip25Caveat.value,
      updatedPermittedChainIds,
    );

    const updatedCaveatValueWithAccountIds =
      setNonSCACaipAccountIdsInCaip25CaveatValue(
        updatedCaveatValueWithChainIds,
        caipAccountIds,
      );

    permissionController.updateCaveat(
      origin,
      Caip25EndowmentPermissionName,
      Caip25CaveatType,
      updatedCaveatValueWithAccountIds,
    );
  };

  const setPermittedChains = (origin, chainIds) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot set permission for chainIds "${chainIds.join(
          ', ',
        )}": No permissions exist for origin "${origin}".`,
      );
    }

    if (chainIds.length === 0 && !isSnapId(origin)) {
      permissionController.revokePermission(
        origin,
        Caip25EndowmentPermissionName,
      );
    } else {
      const updatedCaveatValueWithChainIds = setChainIdsInCaip25CaveatValue(
        caip25Caveat.value,
        chainIds,
      );

      const existingPermittedAccountIds =
        getCaipAccountIdsFromCaip25CaveatValue(caip25Caveat.value);

      const updatedCaveatValueWithAccountIds =
        setNonSCACaipAccountIdsInCaip25CaveatValue(
          updatedCaveatValueWithChainIds,
          existingPermittedAccountIds,
        );

      permissionController.updateCaveat(
        origin,
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        updatedCaveatValueWithAccountIds,
      );
    }
  };

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

    // Only the first scope in the scopes array is needed because
    // setPermittedAccounts currently sets accounts on all matching
    // namespaces, not just the exact CaipChainId.
    const caipAccountIds = internalAccounts.map((internalAccount) => {
      return `${internalAccount.scopes[0]}:${internalAccount.address}`;
    });

    const existingPermittedAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
      caip25Caveat.value,
    );

    const updatedAccountIds = Array.from(
      new Set([...existingPermittedAccountIds, ...caipAccountIds]),
    );

    setPermittedAccounts(origin, updatedAccountIds);
  };

  const addMoreChains = (origin, chainIds) => {
    const caip25Caveat = getCaip25Caveat(origin);
    if (!caip25Caveat) {
      throw new Error(
        `Cannot add chain permissions for origin "${origin}": no permission currently exists for this origin.`,
      );
    }

    const existingPermittedChainIds = getAllScopesFromCaip25CaveatValue(
      caip25Caveat.value,
    );

    const updatedChainIds = Array.from(
      new Set([...existingPermittedChainIds, ...chainIds]),
    );

    setPermittedChains(origin, updatedChainIds);
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
    addPermittedAccount: (origin, address) =>
      addMoreAccounts(origin, [address]),

    addPermittedAccounts: (origin, addresses) =>
      addMoreAccounts(origin, addresses),

    removePermittedAccount: (origin, address) => {
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove account "${address}": No permissions exist for origin "${origin}".`,
        );
      }

      const existingAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
        caip25Caveat.value,
      );

      const internalAccount = accountsController.getAccountByAddress(address);

      const remainingAccountIds = existingAccountIds.filter(
        (existingAccountId) => {
          return !isInternalAccountInPermittedAccountIds(internalAccount, [
            existingAccountId,
          ]);
        },
      );

      if (existingAccountIds.length === remainingAccountIds.length) {
        return;
      }

      setPermittedAccounts(origin, remainingAccountIds);
    },

    setPermittedAccounts,

    addPermittedChain: (origin, chainId) => addMoreChains(origin, [chainId]),

    addPermittedChains: (origin, chainIds) => addMoreChains(origin, chainIds),

    removePermittedChain: (origin, chainId) => {
      const caip25Caveat = getCaip25Caveat(origin);
      if (!caip25Caveat) {
        throw new Error(
          `Cannot remove permission for chainId "${chainId}": No permissions exist for origin "${origin}".`,
        );
      }

      const existingChainIds = getAllScopesFromCaip25CaveatValue(
        caip25Caveat.value,
      );

      const remainingChainIds = existingChainIds.filter(
        (existingChainId) => existingChainId !== chainId,
      );

      if (existingChainIds.length === remainingChainIds.length) {
        return;
      }

      setPermittedChains(origin, remainingChainIds);
    },

    setPermittedChains,

    requestAccountsAndChainPermissionsWithId: (origin) => {
      const id = nanoid();
      requestAccountsAndChainPermissions(origin, id);
      return id;
    },
  };
}
