import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { CustodyController } from '@metamask-institutional/custody-controller';
import { SignatureController } from '@metamask/signature-controller';
import { NetworkController } from '@metamask/network-controller';
import { PreferencesController } from '../../app/scripts/controllers/preferences';
import AppStateController from '../../app/scripts/controllers/app-state';
import AccountTracker from '../../app/scripts/lib/account-tracker';
import MetaMetricsController from '../../app/scripts/controllers/metametrics';

export interface MMIControllerOptions {
  mmiConfigurationController: MmiConfigurationController;
  keyringController: any;
  preferencesController: PreferencesController;
  appStateController: AppStateController;
  transactionUpdateController: TransactionUpdateController;
  custodyController: CustodyController;
  messenger: any;
  getState: () => any;
  getPendingNonce: (address: string) => Promise<any>;
  accountTracker: AccountTracker;
  metaMetricsController: MetaMetricsController;
  networkController: NetworkController;
  permissionController: any;
  signatureController: SignatureController;
  platform: any;
  extension: any;
  updateTransactionHash: (txId: string, txHash: string) => void;
  trackTransactionEvents: (
    args: { transactionMeta: TransactionMeta },
    event: any,
  ) => void;
  getTransactions: (query?: any, opts?: any, fullTx?: boolean) => any[];
  setTxStatusSigned: (txId: string) => void;
  setTxStatusSubmitted: (txId: string) => void;
  setTxStatusFailed: (txId: string) => void;
  updateTransaction: (txMeta: any) => void;
}

export interface ISignedEvent {
  signature: Signature;
  messageId: string;
}

export interface IInteractiveRefreshTokenChangeEvent {
  url: string;
  oldRefreshToken: string;
}

export interface IConnectCustodyAddresses {
  custodianType: string;
  custodianName: string;
  accounts: string[];
}

export interface Label {
  key: string;
  value: string;
}

export interface Signature {
  custodian_transactionId?: string;
  from: string;
}

export interface NetworkConfiguration {
  id: string;
  chainId: string;
  setActiveNetwork: (chainId: string) => void;
}
