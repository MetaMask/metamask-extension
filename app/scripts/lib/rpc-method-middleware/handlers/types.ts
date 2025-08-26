import type {
  JsonRpcParams,
  JsonRpcRequest,
  NonEmptyArray,
} from '@metamask/utils';
import type {
  CaveatSpecificationConstraint,
  PermissionSpecificationConstraint,
  RequestedPermissions,
} from '@metamask/permission-controller';
import { PermissionController } from '@metamask/permission-controller';
import {
  getCaip25PermissionFromLegacyPermissions,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { MessageType } from '../../../../../shared/constants/app';
import MetamaskController from '../../../metamask-controller';
import MetaMetricsController from '../../../controllers/metametrics-controller';
import { AppStateController } from '../../../controllers/app-state-controller';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: string;
  };

export type GetAccounts = MetamaskController['getPermittedAccounts'];

export type GetCaip25PermissionFromLegacyPermissionsForOrigin = (
  requestedPermissions?: RequestedPermissions,
) => { [Caip25EndowmentPermissionName]: Caip25Caveats };

export type RequestPermissionsForOrigin = (
  requestedPermissions: RequestedPermissions,
) => Promise<[GrantedPermissions]>;

export type GetUnlockPromise = AppStateController['getUnlockPromise'];

export type SendMetrics = MetaMetricsController['trackEvent'];

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

export type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];

type Caip25Permission = ReturnType<
  typeof getCaip25PermissionFromLegacyPermissions
>;

type Caip25RequestedPermission =
  Caip25Permission[typeof Caip25EndowmentPermissionName];

type Caip25Caveats = {
  caveats: NonEmptyArray<Caip25RequestedPermission['caveats'][0]>;
};
