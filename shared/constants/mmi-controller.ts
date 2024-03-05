import { TransactionMeta } from '@metamask/transaction-controller';

export interface MMIControllerOptions {
  mmiConfigurationController: any;
  keyringController: any;
  securityProviderRequest: any;
  preferencesController: any;
  appStateController: any;
  transactionUpdateController: any;
  custodyController: any;
  institutionalFeaturesController: any;
  getState: () => any;
  getPendingNonce: (address: string) => Promise<any>;
  accountTracker: any;
  metaMetricsController: any;
  networkController: any;
  permissionController: any;
  signatureController: any;
  accountsController: any;
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
