import type {
  AddApprovalOptions,
  EndFlowOptions,
} from '@metamask/approval-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { Json, JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import type { MessageType } from '../../../../../shared/constants/app';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: string;
  };

export type EndApprovalFlow = ({ id }: EndFlowOptions) => void;

export type FindNetworkConfigurationBy = (
  rpcInfo: Record<string, string>,
) => NetworkConfiguration | null;

export type GetCaveat<Result = Record<string, Json>> = (options: {
  target: string;
  caveatType: string;
}) => Result | undefined;

export type GetChainPermissionsFeatureFlag = () => boolean;

export type RequestPermittedChainsPermission = (
  chainIds: string[],
) => Promise<void>;

export type RequestUserApproval = (
  options?: AddApprovalOptions,
) => Promise<unknown>;

export type RevokePermissionsForOrigin = (permissionKeys: string[]) => void;
export type RejectApprovalRequestsForOrigin = () => void;

export type SetActiveNetwork = (
  networkConfigurationIdOrType: string,
) => Promise<void>;

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

export type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];
