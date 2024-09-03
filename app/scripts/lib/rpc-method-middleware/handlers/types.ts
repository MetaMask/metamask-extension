import { OriginString } from '@metamask/permission-controller';
import { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import { MessageType } from '../../../../../shared/constants/app';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: OriginString;
  };
