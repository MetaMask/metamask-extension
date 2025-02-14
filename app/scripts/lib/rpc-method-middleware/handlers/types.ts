import type {
  AddApprovalOptions,
  EndFlowOptions,
} from '@metamask/approval-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';
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

export type EndApprovalFlow = ({ id }: EndFlowOptions) => void;

export type FindNetworkConfigurationBy = (
  rpcInfo: Record<string, string>,
) => NetworkConfiguration | null;

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
