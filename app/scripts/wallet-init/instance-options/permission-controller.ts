import type { WalletOptions } from '@metamask/wallet';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../../controllers/permissions';
import { getSnapPermissionSpecifications } from '../../controllers/permissions/snaps/specifications';
import { PermissionControllerInitMessenger } from '../messengers/permission-controller-messenger';

type PermissionControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['permissionController']
>;

export function getPermissionControllerInstanceOptions(
  messenger: PermissionControllerInitMessenger,
): PermissionControllerInstanceOptions {
  return {
    caveatSpecifications: getCaveatSpecifications({
      listAccounts: () => {
        const accounts = messenger.call('AccountsController:listAccounts');
        return accounts.map((account) => ({
          type: account.type,
          address: account.address as `0x${string}`,
        }));
      },
      findNetworkClientIdByChainId: (chainId) =>
        messenger.call(
          'NetworkController:findNetworkClientIdByChainId',
          chainId,
        ),
      isNonEvmScopeSupported: (scope) =>
        messenger.call('MultichainRoutingService:isSupportedScope', scope),
      getNonEvmAccountAddresses: (scope) =>
        messenger.call('MultichainRoutingService:getSupportedAccounts', scope),
    }),
    permissionSpecifications: {
      ...getPermissionSpecifications(),
      ...getSnapPermissionSpecifications(messenger),
    },
    unrestrictedMethods,
  };
}
