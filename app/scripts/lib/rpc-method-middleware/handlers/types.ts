import type { JsonRpcParams, JsonRpcRequest, Hex } from '@metamask/utils';
import type {
  CaveatSpecificationConstraint,
  OriginString,
  PermissionSpecificationConstraint,
  PermissionsRequest,
  RequestedPermissions,
} from '@metamask/permission-controller';
import { PermissionController } from '@metamask/permission-controller';
import {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../../shared/constants/metametrics';
import { MessageType } from '../../../../../shared/constants/app';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: string;
  };

/**
 * @property chainId - The current chain ID.
 * @property isUnlocked - Whether the extension is unlocked or not.
 * @property networkVersion - The current network ID.
 * @property accounts - List of permitted accounts for the specified origin.
 */
export type ProviderStateHandlerResult = {
  chainId: string;
  isUnlocked: boolean;
  networkVersion: string;
  accounts: string[];
};

export type GetAccounts = (options?: { ignoreLock: boolean }) => Promise<Hex[]>;

export type RequestCaip25ApprovalForOrigin = (
  origin?: OriginString,
  requestedPermissions?: PermissionsRequest['permissions'],
) => Promise<RequestedPermissions>;

export type GetCaip25PermissionFromLegacyPermissionsForOrigin = (
  requestedPermissions?: RequestedPermissions,
) => RequestedPermissions;

export type RequestPermissionsForOrigin = (
  requestedPermissions: RequestedPermissions,
) => Promise<[GrantedPermissions]>;

export type GetUnlockPromise = (
  shouldShowUnlockRequest: boolean,
) => Promise<void>;

export type SendMetrics = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void;

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

export type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];
