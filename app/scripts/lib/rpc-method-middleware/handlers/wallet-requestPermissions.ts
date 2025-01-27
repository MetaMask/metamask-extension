import { pick } from 'lodash';
import { isPlainObject } from '@metamask/controller-utils';
import {
  Caveat,
  CaveatSpecificationConstraint,
  invalidParams,
  MethodNames,
  PermissionController,
  PermissionSpecificationConstraint,
  RequestedPermissions,
  ValidPermission,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/multichain';
import { Json, JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';

export const requestPermissionsHandler = {
  methodNames: [MethodNames.RequestPermissions],
  implementation: requestPermissionsImplementation,
  hookNames: {
    getAccounts: true,
    requestPermissionsForOrigin: true,
    requestCaip25ApprovalForOrigin: true,
    grantPermissionsForOrigin: true,
  },
};

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];

/**
 * Request Permissions implementation to be used in JsonRpcEngine middleware.
 *
 * @param req - The JsonRpcEngine request
 * @param res - The JsonRpcEngine result object
 * @param _next - JsonRpcEngine next() callback - unused
 * @param end - JsonRpcEngine end() callback
 * @param options - Method hooks passed to the method implementation
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 * @param options.requestCaip25ApprovalForOrigin - A hook that requests approval for the CAIP-25 permission for the origin.
 * @param options.grantPermissionsForOrigin - A hook that grants permission for the approved permissions for the origin.
 * @param options.requestPermissionsForOrigin - A hook that requests permissions for the origin.
 * @returns A promise that resolves to nothing
 */
async function requestPermissionsImplementation(
  req: JsonRpcRequest<[RequestedPermissions]> & { origin: string },
  res: PendingJsonRpcResponse<Json>,
  _next: AsyncJsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    requestPermissionsForOrigin,
    requestCaip25ApprovalForOrigin,
    grantPermissionsForOrigin,
  }: {
    getAccounts: () => string[];
    requestPermissionsForOrigin: (
      requestedPermissions: RequestedPermissions,
    ) => Promise<[GrantedPermissions]>;
    requestCaip25ApprovalForOrigin: (
      requestedPermissions?: RequestedPermissions,
    ) => Promise<RequestedPermissions>;
    grantPermissionsForOrigin: (approvedPermissions: RequestedPermissions) => {
      [Caip25EndowmentPermissionName]: ValidPermission<
        typeof Caip25EndowmentPermissionName,
        Caveat<typeof Caip25CaveatType, Caip25CaveatValue>
      >;
    };
  },
) {
  const { params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  // TODO:
  // In the past, working build/ release
  // - Call to PermissionsController.validatePermissions is made BEFORE payload goes to UI
  // - Which calls this.validateRequestedPermissions
  // - Which then calls this.validatePermission(this.getPermissionSpecification(targetName) for ‘eth_accounts’ and ‘endowment:permitted-chains’
  // - This will in turn call this.validateCaveat(caveat, origin, target) , which throws for ‘endowment:permitted-chains’
  //     - "endowment:permitted-chains error: Received unrecognized chainId: "0xa86a". Please try adding the network first via wallet_addEthereumChain."

  // Now, in the current build/ release of `main`,
  // -  the call goes through `app/scripts/lib/rpc-method-middleware/handlers/wallet-requestPermissions.ts`
  // - `requestPermissionsImplementation` from this file is called
  // - This will call MetamaskController.requestCaip25Approval()
  // - Which will call approvalController.addAndShowApprovalRequest (sends call to UI) (Meaning PermissionsController.validatePermissions will later be called AFTER
  //   payload goes through UI)
  //     - Only after approvalController.addAndShowApprovalRequest is the caveatValue formed and ready to be sent to PermissionsController
  //     - Even in `refactor: connection flow to use caip25 format` branch (where we form the caveatValue before making call to ApprovalController),
  //     if I call PermissionsController.validatePermissions with the newly formed request permissions, BEFORE making the call to ApprovalController, we are getting a
  //     different error
  //        - "endowment:caip25 error: Received scopeString value(s) for caveat of type "authorizedScopes" that are not supported by the wallet."

  // So I believe the fix should be done in the Core repo, AFTER `refactor: connection flow to use caip25 format` branch is merged
  // - Having the refactor merged in, makes our life easier because after refactor, we form caveatValue BEFORE calling ApprovalController,
  //   therefore we can send this caveatValue to PermissionsController before calling ApprovalController
  // - ApprovalController should be made to properly support caveat type “authorizedScopes”, and do a similar check to what was done for “endowment:permitted-chains
  //   to decide a chainId was unrecognized
  // - Hard to do it before we call MetamaskController.requestCaip25Approval(), because ApprovalController doesn’t seem to have support for
  //   “endowment:permitted-chains” or “eth_accounts” anymore

  const [requestedPermissions] = params;
  const caip25EquivalentPermissions: Partial<
    Pick<RequestedPermissions, 'eth_accounts' | 'endowment:permitted-chains'>
  > = pick(requestedPermissions, [
    RestrictedMethods.eth_accounts,
    PermissionNames.permittedChains,
  ]);

  delete requestedPermissions[RestrictedMethods.eth_accounts];
  delete requestedPermissions[PermissionNames.permittedChains];

  const hasCaip25EquivalentPermissions =
    Object.keys(caip25EquivalentPermissions).length > 0;
  const hasOtherRequestedPermissions =
    Object.keys(requestedPermissions).length > 0;

  let grantedPermissions: GrantedPermissions = {};

  let caip25Approval;
  if (hasCaip25EquivalentPermissions) {
    try {
      caip25Approval = await requestCaip25ApprovalForOrigin(
        caip25EquivalentPermissions,
      );
    } catch (error) {
      return end(error as unknown as Error);
    }
  }

  if (hasOtherRequestedPermissions || !hasCaip25EquivalentPermissions) {
    try {
      const [frozenGrantedPermissions] = await requestPermissionsForOrigin(
        requestedPermissions,
      );
      grantedPermissions = { ...frozenGrantedPermissions };
    } catch (error) {
      return end(error as unknown as Error);
    }
  }

  if (caip25Approval) {
    const grantedCaip25Permissions = grantPermissionsForOrigin(caip25Approval);
    const caip25Endowment =
      grantedCaip25Permissions[Caip25EndowmentPermissionName];

    const caip25CaveatValue = caip25Endowment?.caveats?.find(
      ({ type }) => type === Caip25CaveatType,
    )?.value as Caip25CaveatValue | undefined;

    if (!caip25CaveatValue) {
      throw new Error(
        `could not find ${Caip25CaveatType} in granted ${Caip25EndowmentPermissionName} permission.`,
      );
    }

    // We cannot derive correct eth_accounts value directly from the CAIP-25 permission
    // because the accounts will not be in order of lastSelected
    const ethAccounts = getAccounts();

    grantedPermissions[RestrictedMethods.eth_accounts] = {
      ...caip25Endowment,
      parentCapability: RestrictedMethods.eth_accounts,
      caveats: [
        {
          type: CaveatTypes.restrictReturnedAccounts,
          value: ethAccounts,
        },
      ],
    };

    const ethChainIds = getPermittedEthChainIds(caip25CaveatValue);
    if (ethChainIds.length > 0) {
      grantedPermissions[PermissionNames.permittedChains] = {
        ...caip25Endowment,
        parentCapability: PermissionNames.permittedChains,
        caveats: [
          {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ethChainIds,
          },
        ],
      };
    }
  }

  res.result = Object.values(grantedPermissions).filter(
    (
      permission: ValidPermission<string, Caveat<string, Json>> | undefined,
    ): permission is ValidPermission<string, Caveat<string, Json>> =>
      permission !== undefined,
  );
  return end();
}
