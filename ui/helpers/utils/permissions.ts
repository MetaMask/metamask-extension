import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import { RestrictedEthMethods } from '../../../shared/constants/permissions';

export const containsEthPermissionsAndNonEvmAccount = (
  accounts: InternalAccount[],
  permissions: { [key: string]: string },
) => {
  const containsEthPermissions = Object.keys(permissions).some((permission) =>
    Object.keys(RestrictedEthMethods).includes(permission),
  );
  const containsNonEvmAccount = accounts.some(
    (account) => !isEvmAccountType(account.type),
  );

  return containsEthPermissions && containsNonEvmAccount;
};
