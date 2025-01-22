import type { RatesControllerState } from '@metamask/assets-controllers';
import type { CaipChainId, Hex } from '@metamask/utils';
import type { NetworkType } from '@metamask/controller-utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { BalancesControllerState } from '../../app/scripts/lib/accounts/BalancesController';
import type { NetworkState } from '../../shared/modules/selectors/networks';
import type { MultichainProviderConfig } from '../../shared/constants/multichain/networks';
import type { AccountsState } from './accounts';

export type RatesState = {
  metamask: RatesControllerState;
};

export type BalancesState = {
  metamask: BalancesControllerState;
};

export type MultichainState = AccountsState &
  RatesState &
  BalancesState &
  NetworkState;

export type MultichainNetwork = {
  nickname: string;
  isEvmNetwork: boolean;
  chainId: CaipChainId;
  network: ProviderConfigWithImageUrlAndExplorerUrl | MultichainProviderConfig;
}; // TODO: Remove after updating to @metamask/network-controller 20.0.0

export type ProviderConfigWithImageUrlAndExplorerUrl = {
  rpcUrl?: string;
  type: NetworkType;
  chainId: Hex;
  ticker: string;
  nickname?: string;
  id?: string;
} & {
  rpcPrefs?: { blockExplorerUrl?: string; imageUrl?: string };
};
