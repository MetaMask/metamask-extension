import type {
  CaveatSpecificationConstraint,
  PermissionController,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import type { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';

import type { MessageType } from '../../../../../shared/constants/app';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: string;
  };

type AbstractPermissionController = PermissionController<
  PermissionSpecificationConstraint,
  CaveatSpecificationConstraint
>;

export type GrantedPermissions = Awaited<
  ReturnType<AbstractPermissionController['requestPermissions']>
>[0];
