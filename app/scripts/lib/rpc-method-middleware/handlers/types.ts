import type { NonEmptyArray } from '@metamask/utils';
import type {
  RequestedPermissions,
  GenericPermissionController,
} from '@metamask/permission-controller';
import {
  getCaip25PermissionFromLegacyPermissions,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import type MetamaskController from '../../../metamask-controller';
import type {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../../shared/constants/metametrics';

export type GetAccounts = MetamaskController['getPermittedAccounts'];

export type RequestPermissionsForOrigin = (
  requestedPermissions: RequestedPermissions,
) => ReturnType<GenericPermissionController['requestPermissions']>;

export type SendMetrics = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void;

type Caip25Permission = ReturnType<
  typeof getCaip25PermissionFromLegacyPermissions
>;

type Caip25RequestedPermission =
  Caip25Permission[typeof Caip25EndowmentPermissionName];

type Caip25Caveats = {
  caveats: NonEmptyArray<Caip25RequestedPermission['caveats'][0]>;
};

export type GetCaip25PermissionFromLegacyPermissionsForOrigin = (
  requestedPermissions?: RequestedPermissions,
) => { [Caip25EndowmentPermissionName]: Caip25Caveats };
