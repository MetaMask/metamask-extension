import type { TransactionMeta } from '@metamask/transaction-controller';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';

/**
 * Subset of app state used by hardware wallet signature status components.
 */
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

/** Transaction history entries from BridgeStatusState, used for approval lookups. */
export type BridgeTxHistory = NonNullable<
  BridgeStatusState['metamask']['txHistory']
>;

/**
 * Represents an active QR hardware wallet signing request from the QR keyring.
 */
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

/**
 * Display statuses for individual signature steps in the hardware wallet
 * progress indicator.
 */
export const SignatureStepStatus = {
  Pending: 'pending',
  Active: 'active',
  Complete: 'complete',
  Rejected: 'rejected',
  Failed: 'failed',
  Disconnected: 'disconnected',
} as const;

export type SignatureStepStatus =
  (typeof SignatureStepStatus)[keyof typeof SignatureStepStatus];
