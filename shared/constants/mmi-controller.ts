import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { SignatureController } from '@metamask/signature-controller';
import { NetworkController } from '@metamask/network-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { PreferencesController } from '../../app/scripts/controllers/preferences-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { AppStateController } from '../../app/scripts/controllers/app-state-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import AccountTrackerController from '../../app/scripts/controllers/account-tracker-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import MetaMetricsController from '../../app/scripts/controllers/metametrics';

export type MMIControllerOptions = {
  mmiConfigurationController: MmiConfigurationController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyringController: any;
  preferencesController: PreferencesController;
  appStateController: AppStateController;
  transactionUpdateController: TransactionUpdateController;
  custodyController: CustodyController;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messenger: any;
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
