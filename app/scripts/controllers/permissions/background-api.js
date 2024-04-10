import nanoid from 'nanoid';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';

export function getPermissionBackgroundApiMethods(permissionController) {
  return {
    addPermittedAccount: (origin, account) => {
      const existing = permissionController.getCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      if (existing.value.includes(account)) {
        return;
      }

      permissionController.updateCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
        [...existing.value, account],
      );
    },

    // To add more than one accounts when already connected to the dapp
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
      const existing = permissionController.getCaveat(
        origin,
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      if (!existing.value.includes(account)) {
        return;
      }

      const remainingAccounts = existing.value.filter(
        (existingAccount) => existingAccount !== account,
      );

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
