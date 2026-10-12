import type {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import type { NetworkControllerFindNetworkClientIdByChainIdAction } from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex, Json, JsonRpcRequest } from '@metamask/utils';
import type { PayRpcType } from '../../../../shared/lib/transaction/pay-rpc';
import type { RootMessenger } from '../messenger';
import type { AddTransactionMessenger } from '../transaction/util';
import type { WalletPayParams } from './validate-request';

export type WalletPayMessenger = RootMessenger<
  | MessengerActions<AddTransactionMessenger>
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerListAccountsAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | RemoteFeatureFlagControllerGetStateAction,
  MessengerEvents<AddTransactionMessenger>
>;

export type WalletPayRequest = JsonRpcRequest<Json[]> & {
  origin?: string;
  securityAlertResponse?: unknown;
  traceContext?: unknown;
};

export type WalletPayBuiltTransaction = {
  chainId: Hex;
  transactionParams: TransactionParams;
  type: TransactionType;
  skipInitialGasEstimate?: boolean;
};

export type WalletPayTypeRegistry = {
  type: PayRpcType;
  assertPreconditions: (context: {
    from: Hex;
    messenger: WalletPayMessenger;
  }) => void | Promise<void>;
  build: (params: WalletPayParams) => WalletPayBuiltTransaction;
};

export type WalletPayDeps = {
  messenger: WalletPayMessenger;
  getPermittedAccounts: () => string[];
  securityAlertsEnabled: boolean;
};

/** Result of a `wallet_pay` request, returned once the transfer completes. */
export type WalletPayResult = {
  transactionHash?: Hex;
};
