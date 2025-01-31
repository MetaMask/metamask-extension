import {
  AddApprovalOptions,
  EndFlowOptions,
} from '@metamask/approval-controller';
import { JsonRpcParams, JsonRpcRequest } from '@metamask/utils';
import { MessageType } from '../../../../../shared/constants/app';

export type HandlerWrapper = {
  methodNames: [MessageType] | MessageType[];
  hookNames: Record<string, boolean>;
};

export type HandlerRequestType<Params extends JsonRpcParams = JsonRpcParams> =
  Required<JsonRpcRequest<Params>> & {
    origin: string;
  };

export type EndApprovalFlow = ({ id }: EndFlowOptions) => void;

export type GetCaveat = (options: {
  target: string;
  caveatType: string;
}) => Record<string, string[]> | undefined;

export type GetChainPermissionsFeatureFlag = () => boolean;

export type RequestPermittedChainsPermission = (
  chainIds: string[],
) => Promise<void>;

export type RequestUserApproval = (
  options?: AddApprovalOptions,
) => Promise<unknown>;

export type SetActiveNetwork = (
  networkConfigurationIdOrType: string,
) => Promise<void>;
