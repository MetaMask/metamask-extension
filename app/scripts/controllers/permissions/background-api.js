import nanoid from 'nanoid';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';

export function getPermissionBackgroundApiMethods(permissionController) {
  return {
    addPermittedAccount: (origin, account) => {
      const { value: existingAccounts } = permissionController.getCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      if (existingAccounts.includes(account)) {
        return;
      }

      permissionController.updateCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
        [...existingAccounts, account],
      );
    },

    // To add more than one account when already connected to the dapp
    addMorePermittedAccounts: (origin, accounts) => {
      const { value: existingAccounts } = permissionController.getCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      const updatedAccounts = Array.from(
        new Set([...existingAccounts, ...accounts]),
      );

      if (updatedAccounts.length === existingAccounts.length) {
        return;
      }

      permissionController.updateCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
        updatedAccounts,
      );
    },

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
