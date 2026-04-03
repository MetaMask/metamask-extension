import { caip25CaveatBuilder } from '@metamask/chain-agnostic-permission';
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
import { ControllerInitFunction } from './types';

type Caip25CaveatBuilderOptions = Parameters<typeof caip25CaveatBuilder>[0];

/**
 * Initialize the permission controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @param request.getController
 * @returns The initialized controller.
 */
export const PermissionControllerInit: ControllerInitFunction<
  PermissionController<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >,
  PermissionControllerMessenger,
  PermissionControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger, getController }) => {
  const approvalController = getController('ApprovalController');
  const keyringController = getController('KeyringController');

  const controller = new PermissionController({
    state: persistedState.PermissionController,
    // Runtime messenger is built via getPermissionControllerMessenger; PermissionController's
    // constructor type is narrower (registerActionHandler handler unions).
    // @ts-expect-error Messenger not assignable to PermissionControllerMessenger (handler variance).
    messenger: controllerMessenger,
    caveatSpecifications: getCaveatSpecifications({
      listAccounts: initMessenger.call.bind(
        initMessenger,
        'AccountsController:listAccounts',
      ) as unknown as Caip25CaveatBuilderOptions['listAccounts'],
      findNetworkClientIdByChainId: initMessenger.call.bind(
        initMessenger,
        'NetworkController:findNetworkClientIdByChainId',
      ) as unknown as Caip25CaveatBuilderOptions['findNetworkClientIdByChainId'],
      isNonEvmScopeSupported: initMessenger.call.bind(
        initMessenger,
        'MultichainRoutingService:isSupportedScope',
      ) as unknown as Caip25CaveatBuilderOptions['isNonEvmScopeSupported'],
      getNonEvmAccountAddresses: initMessenger.call.bind(
        initMessenger,
        'MultichainRoutingService:getSupportedAccounts',
      ) as unknown as Caip25CaveatBuilderOptions['getNonEvmAccountAddresses'],
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
    controller,
  };
};
