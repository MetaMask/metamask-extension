import {
  AddApprovalOptions,
  EndFlowOptions,
} from '@metamask/approval-controller';

export type HandlerWrapper = {
  methodNames: [string];
  hookNames: Record<string, boolean>;
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
