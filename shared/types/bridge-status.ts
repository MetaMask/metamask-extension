import { TransactionControllerState } from '@metamask/transaction-controller';
import { BridgeStatusControllerState } from '@metamask/bridge-status-controller';
import {
  NetworkState,
  ProviderConfigState,
} from '../modules/selectors/networks';
import { SmartTransactionsMetaMaskState } from '../modules/selectors';

export type BridgeStatusAppState = ProviderConfigState & {
  metamask: BridgeStatusControllerState;
};

export type MetricsBackgroundState = BridgeStatusAppState['metamask'] &
  SmartTransactionsMetaMaskState['metamask'] &
  NetworkState['metamask'] &
  TransactionControllerState;
