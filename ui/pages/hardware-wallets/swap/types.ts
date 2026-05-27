import type { TransactionMeta } from '@metamask/transaction-controller';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';

export type BridgeStatusState = {
  metamask: {
    txHistory?: Record<
      string,
      {
        approvalTxId?: string;
        quote?: {
          requestId?: string;
        };
      }
    >;
    transactions?: TransactionMeta[];
  };
  confirmTransaction?: {
    txData?: {
      id?: string;
    } & Record<string, unknown>;
  };
};

export type QrHardwareSignRequest = {
  type: QrScanRequestType.SIGN;
  request: {
    requestId: string;
    payload: {
      type: string;
      cbor: string;
    };
  };
};
