import nanoid from 'nanoid';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { CaveatFactories, PermissionNames } from './specifications';

export function getPermissionBackgroundApiMethods(permissionController) {
  const addMoreAccounts = (origin, accounts) => {
    const caveat = CaveatFactories.restrictReturnedAccounts(accounts);

    permissionController.grantPermissionsIncremental({
      subject: { origin },
      approvedPermissions: {
        [RestrictedMethods.eth_accounts]: { caveats: [caveat] },
      },
    });
  };

  const addMoreChains = (origin, chainIds) => {
    const caveat = CaveatFactories.restrictNetworkSwitching(chainIds);

    permissionController.grantPermissionsIncremental({
      subject: { origin },
      approvedPermissions: {
        [PermissionNames.permittedChains]: { caveats: [caveat] },
      },
    });
  };

  return {
    addPermittedAccount: (origin, account) =>
      addMoreAccounts(origin, [account]),
    addPermittedAccounts: (origin, accounts) =>
      addMoreAccounts(origin, accounts),

    removePermittedAccount: (origin, account) => {
      const { value: existingAccounts } = permissionController.getCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      const remainingAccounts = existingAccounts.filter(
        (existingAccount) => existingAccount !== account,
      );

      if (remainingAccounts.length === existingAccounts.length) {
        return;
      }

      if (remainingAccounts.length === 0) {
        permissionController.revokePermission(
          origin,
          RestrictedMethods.eth_accounts,
        );
      } else {
        permissionController.updateCaveat(
          origin,
          RestrictedMethods.eth_accounts,
          CaveatTypes.restrictReturnedAccounts,
          remainingAccounts,
        );
      }
    },

    addPermittedChain: (origin, chainId) => addMoreChains(origin, [chainId]),
    addPermittedChains: (origin, chainIds) => addMoreChains(origin, chainIds),

    removePermittedChain: (origin, chainId) => {
      const { value: existingChains } = permissionController.getCaveat(
        origin,
        PermissionNames.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
      );

      const remainingChains = existingChains.filter(
        (existingChain) => existingChain !== chainId,
      );

      if (remainingChains.length === existingChains.length) {
        return;
      }

      if (remainingChains.length === 0) {
        permissionController.revokePermission(
          origin,
          PermissionNames.permittedChains,
        );
      } else {
        permissionController.updateCaveat(
          origin,
          PermissionNames.permittedChains,
          CaveatTypes.restrictNetworkSwitching,
          remainingChains,
        );
      }
    },

    requestAccountsAndChainPermissionsWithId: async (origin) => {
      const id = nanoid();
      permissionController.requestPermissions(
        { origin },
        {
          [PermissionNames.eth_accounts]: {},
          [PermissionNames.permittedChains]: {},
        },
        { id },
      );
      return id;
    },

    requestAccountsPermissionWithId: async (origin) => {
      const id = nanoid();
      permissionController.requestPermissions(
        { origin },
        {
          eth_accounts: {},
        },
        { id },
      );
      return id;
    },
  };
}
