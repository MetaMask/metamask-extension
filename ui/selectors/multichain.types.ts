import type { CaipChainId, Hex } from '@metamask/utils';
import type { NetworkType } from '@metamask/controller-utils';
import type {
  MultichainBalancesControllerState,
  RatesControllerState,
} from '@metamask/assets-controllers';
import { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { NetworkState } from '../../shared/modules/selectors/networks';
import type { MultichainProviderConfig } from '../../shared/constants/multichain/networks';
import type { AccountsState } from './accounts';

export type RatesState = {
  metamask: RatesControllerState;
};

export type BalancesState = {
  metamask: MultichainBalancesControllerState;
};

export type TransactionsState = {
  metamask: MultichainTransactionsControllerState;
};

export type MultichainState = AccountsState &
  RatesState &
  BalancesState &
  TransactionsState &
  NetworkState;

// TODO: Remove after updating to @metamask/network-controller 20.0.0
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

export type MultichainNetwork = {
  nickname: string;
  isEvmNetwork: boolean;
  chainId: CaipChainId;
  network: ProviderConfigWithImageUrlAndExplorerUrl | MultichainProviderConfig;
};
