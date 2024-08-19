import nanoid from 'nanoid';
import { MethodNames } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { CaveatFactories } from './specifications';

export function getPermissionBackgroundApiMethods(
  permissionController,
  approvalController,
) {
  // TODO: Update this too
  const addMoreAccounts = (origin, accountOrAccounts) => {
    const accounts = Array.isArray(accountOrAccounts)
      ? accountOrAccounts
      : [accountOrAccounts];
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

    // To add more than one account when already connected to the dapp
    addMorePermittedAccounts: (origin, accounts) =>
      addMoreAccounts(origin, accounts),

    // Update this too
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

    // hmm...
    requestAccountsPermissionWithId: async (origin) => {
      const id = nanoid();
      approvalController.addAndShowApprovalRequest({
        id,
        origin,
        requestData: {
          metadata: {
            id,
            origin,
          },
          permissions: {
            eth_accounts: {},
          },
        },
        type: MethodNames.requestPermissions,
      });
      // TODO Handle this on approval
      return id;
    },
  };
}
