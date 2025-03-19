import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { SignatureController } from '@metamask/signature-controller';
import {
  NetworkController,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerSetActiveNetworkAction,
} from '@metamask/network-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerListAccountsAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { AppStateController } from '../../app/scripts/controllers/app-state-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import AccountTrackerController from '../../app/scripts/controllers/account-tracker-controller';
import MetaMetricsController, {
  MetaMetricsControllerGetStateAction,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../app/scripts/controllers/metametrics-controller';

// Unique name for the controller
const controllerName = 'MMIController';

type NetworkControllerGetNetworkConfigurationByChainId = {
  type: `NetworkController:getNetworkConfigurationByChainId`;
  handler: NetworkController['getNetworkConfigurationByChainId'];
};

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerListAccountsAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkConfigurationByChainId
  | MetaMetricsControllerGetStateAction;

/**
 * Messenger type for the {@link MMIController}.
 */
export type MMIControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

export type MMIControllerOptions = {
  mmiConfigurationController: MmiConfigurationController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyringController: any;
  appStateController: AppStateController;
  transactionUpdateController: TransactionUpdateController;
  custodyController: CustodyController;
  messenger: MMIControllerMessenger;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getState: () => any;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPendingNonce: (address: string) => Promise<any>;
  accountTrackerController: AccountTrackerController;
  metaMetricsController: MetaMetricsController;
  networkController: NetworkController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissionController: any;
  signatureController: SignatureController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  platform: any;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extension: any;
  updateTransactionHash: (txId: string, txHash: string) => void;
  trackTransactionEvents: (
    args: { transactionMeta: TransactionMeta },
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
  ) => void;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTransactions: (query?: any, opts?: any, fullTx?: boolean) => any[];
  setTxStatusSigned: (txId: string) => void;
  setTxStatusSubmitted: (txId: string) => void;
  setTxStatusFailed: (txId: string) => void;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateTransaction: (txMeta: any) => void;
  setChannelId: (channelId: string) => void;
  setConnectionRequest: (payload: ConnectionRequest | null) => void;
};

export type ISignedEvent = {
  signature: Signature;
  messageId: string;
};

export type IInteractiveRefreshTokenChangeEvent = {
  url: string;
  oldRefreshToken: string;
};

export type IConnectCustodyAddresses = {
  custodianType: string;
  custodianName: string;
  accounts: string[];
};

export type Label = {
  key: string;
  value: string;
};

export type Signature = {
  custodian_transactionId?: string;
  from: string;
};

export type NetworkConfiguration = {
  id: string;
  chainId: string;
  setActiveNetwork: (chainId: string) => void;
};

export type ConnectionRequest = {
  payload: string;
  traceId: string;
  channelId: string;
};
