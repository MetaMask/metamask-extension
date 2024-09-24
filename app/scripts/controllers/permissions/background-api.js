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

  return {
    addPermittedAccount: (origin, account) => addMoreAccounts(origin, account),

  return {
    addPermittedAccount: (origin, account) => addMoreAccounts(origin, [account]),
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

    removePermittedChain: (origin, chain) => {
      const { value: existingChains } = permissionController.getCaveat(
        origin,
        RestrictedMethods.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
      );

      const remainingChains = existingChains.filter(
        (existingChain) => existingChain !== chain,
      );

      if (remainingChains.length === existingChains.length) {
        return;
      }

      if (remainingChains.length === 0) {
        permissionController.revokePermission(
          origin,
          RestrictedMethods.permittedChains,
        );
      } else {
        permissionController.updateCaveat(
          origin,
          RestrictedMethods.permittedChains,
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
