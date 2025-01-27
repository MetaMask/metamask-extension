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
import {
  Hex,
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  AsyncJsonRpcEngineNextCallback,
  JsonRpcEngineEndCallback,
} from '@metamask/json-rpc-engine';
import { NetworkClientId } from '@metamask/network-controller';
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
    findNetworkClientIdByChainId: true,
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
 * Validates the networks associated with a caveat. Ensures that
 * the networks value is an array of valid chain IDs.
 *
 * @param chainIdsForCaveat - The list of chain IDs to validate.
 * @param findNetworkClientIdByChainId - Function to find network client ID by chain ID.
 * @throws {Error} If the chainIdsForCaveat is not a non-empty array of valid chain IDs.
 */
function validateCaveatNetworks(
  chainIdsForCaveat: Hex[],
  findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId,
) {
  if (chainIdsForCaveat.length === 0) {
    return;
  }

  chainIdsForCaveat.forEach((chainId) => {
    try {
      findNetworkClientIdByChainId(chainId);
    } catch (e) {
      console.error(e);
      throw new Error(
        `${PermissionNames.permittedChains} error: Received unrecognized chainId: "${chainId}". Please try adding the network first via wallet_addEthereumChain.`,
      );
    }
  });
}

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
 * @param options.findNetworkClientIdByChainId - A hook that finds network client id for specific chain.
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
    findNetworkClientIdByChainId,
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
    findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
  },
) {
  const { params } = req;

  if (!Array.isArray(params) || !isPlainObject(params[0])) {
    return end(invalidParams({ data: { request: req } }));
  }

  const [requestedPermissions] = params;

  /**
   * Before migrating CAIP-25 permission validation into factory {@link https://github.com/MetaMask/MetaMask-planning/issues/4017}
   * We should have validation of caveat networks done at this level, otherwise, downstream, a call is made to `ApprovalController.addAndShowApprovalRequest`
   * Which could potentially throw an unhandled exception that manifests in the UI (if a chain that is not setup in wallet is requested)
   * issue: {@link https://github.com/MetaMask/MetaMask-planning/issues/4014}
   */
  const requestedChainIds =
    requestedPermissions[PermissionNames.permittedChains]?.caveats?.find(
      (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
    )?.value ?? [];

  validateCaveatNetworks(
    requestedChainIds as Hex[],
    findNetworkClientIdByChainId,
  );

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
