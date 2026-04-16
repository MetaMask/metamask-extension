import {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import {
  getCaveatSpecifications,
  getPermissionSpecifications,
  unrestrictedMethods,
} from '../controllers/permissions';
import { getSnapPermissionSpecifications } from '../controllers/permissions/snaps/specifications';
import {
  PermissionControllerInitMessenger,
  PermissionControllerMessenger,
} from './messengers';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the permission controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @param request.getMessengerClient
 * @returns The initialized controller.
 */
export const PermissionControllerInit: MessengerClientInitFunction<
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >,
  PermissionControllerMessenger,
  PermissionControllerInitMessenger
> = ({
  controllerMessenger,
  persistedState,
  initMessenger,
  getMessengerClient,
}) => {
  const approvalController = getMessengerClient('ApprovalController');
  const keyringController = getMessengerClient('KeyringController');

  const messengerClient = new PermissionController({
    state: persistedState.PermissionController,
    // @ts-expect-error PermissionController messenger parameter type is incompatible with our messenger alias (handler unions).
    messenger: controllerMessenger,
    caveatSpecifications: getCaveatSpecifications({
      listAccounts: () => {
        const accounts = initMessenger.call('AccountsController:listAccounts');
        return accounts.map((account) => ({
          type: account.type,
          address: account.address as `0x${string}`,
        }));
      },
      findNetworkClientIdByChainId: (chainId) =>
        initMessenger.call(
          'NetworkController:findNetworkClientIdByChainId',
          chainId,
        ),
      isNonEvmScopeSupported: (scope) =>
        initMessenger.call('MultichainRoutingService:isSupportedScope', scope),
      getNonEvmAccountAddresses: (scope) =>
        initMessenger.call(
          'MultichainRoutingService:getSupportedAccounts',
          scope,
        ),
    }),
    permissionSpecifications: {
      ...getPermissionSpecifications(),
      ...getSnapPermissionSpecifications(initMessenger, {
        addAndShowApprovalRequest:
          approvalController.addAndShowApprovalRequest.bind(approvalController),
        addNewKeyring: keyringController.addNewKeyring.bind(keyringController),
      }),
    },
    unrestrictedMethods,
  });

  return {
    messengerClient,
  };
};
