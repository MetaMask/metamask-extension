import type {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type {
  PerpsControllerGetStateAction,
  PerpsControllerRefreshEligibilityAction,
} from '@metamask/perps-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionPayControllerStateChangeEvent } from '@metamask/transaction-pay-controller';
import type { Hex, Json, JsonRpcRequest } from '@metamask/utils';
import type { PayRpcType } from '../../../../shared/lib/transaction/pay-rpc';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';
import type { RootMessenger } from '../messenger';
import type { AddTransactionMessenger } from '../transaction/util';

export type MmPayRpcMessenger = RootMessenger<
  | MessengerActions<AddTransactionMessenger>
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerListAccountsAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
  | PerpsControllerGetStateAction
  | PerpsControllerRefreshEligibilityAction
  | RemoteFeatureFlagControllerGetStateAction,
  | MessengerEvents<AddTransactionMessenger>
  | TransactionControllerUnapprovedTransactionAddedEvent
  | TransactionPayControllerStateChangeEvent
>;

export type MmPayRpcRequest = JsonRpcRequest<Json[]> & {
  origin?: string;
  securityAlertResponse?: unknown;
  traceContext?: unknown;
};

export type MmPayRpcParams = {
  type: string;
  from: Hex;
  payParams?: unknown;
};

export type MmPayRpcBuiltTransaction = {
  chainId: Hex;
  transactionParams: TransactionParams;
  type: TransactionType;
  skipInitialGasEstimate?: boolean;
};

export type MmPayRpcTypeRegistry<PayParams = unknown> = {
  type: PayRpcType;
  validatePayParams: (payParams: unknown) => PayParams;
  assertPreconditions: (context: {
    from: Hex;
    messenger: MmPayRpcMessenger;
  }) => void | Promise<void>;
  build: (context: {
    from: Hex;
    payParams: PayParams;
  }) => MmPayRpcBuiltTransaction;
};

export type MmPayRpcDeps = {
  messenger: MmPayRpcMessenger;
  getPermittedAccounts: () => string[];
  securityAlertsEnabled: boolean;
};

export type MmPayRpcResultSide = {
  chainId?: Hex;
  hash?: Hex;
};

/**
 * Result of a `wallet_mmPay` request, returned once the transfer completes.
 * Fields are omitted when unknown.
 */
export type MmPayRpcResult = {
  transactionId?: string;
  /** Pay strategy that executed the transfer, e.g. `relay`. */
  provider?: string;
  /** Where the funds left from. HyperCore is `0x539`. */
  source: MmPayRpcResultSide;
  destination: MmPayRpcResultSide;
};
