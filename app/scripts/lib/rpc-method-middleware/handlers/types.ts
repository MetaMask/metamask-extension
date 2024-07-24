import {
  AddApprovalOptions,
  EndFlowOptions,
} from '@metamask/approval-controller';
import { ProviderConfig } from '@metamask/network-controller';

export type EndApprovalFlow = ({ id }: EndFlowOptions) => void;
export type FindNetworkConfigurationBy = (
  rpcInfo: Record<string, string>,
) => ProviderConfig | null;
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
