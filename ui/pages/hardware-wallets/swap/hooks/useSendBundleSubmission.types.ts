import type {
  Dispatch,
  MutableRefObject,
  SetStateAction,
} from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { MetaMaskReduxDispatch } from '../../../../store/store';
import type { internalSelectPendingApproval } from '../../../../selectors';
import type { HardwareWalletSignaturesAction } from '../hardware-wallet-signatures-state-machine';

export type UseSendBundleSubmissionOptions = {
  /** Reactive sendBundle txMeta; retry replaces it with a fresh TransactionMeta. */
  sendBundleTxMeta: TransactionMeta | undefined;
  /** Setter that updates `sendBundleTxMeta` on retry. */
  setSendBundleTxMeta: Dispatch<SetStateAction<TransactionMeta | undefined>>;
  /** Pending approval id captured at navigation time; reactive on retry. */
  currentApprovalRequestId: string | undefined;
  /** Setter that updates `currentApprovalRequestId` on retry. */
  setCurrentApprovalRequestId: Dispatch<SetStateAction<string | undefined>>;
  /**
   * Pending approval for `currentApprovalRequestId`, or `undefined` when it is
   * no longer pending. The submit guard refuses to call `updateAndApproveTx`
   * when this is missing, preventing signing of a stale txMeta after
   * back/forward navigation or multi-tab races.
   */
  expectedSendBundleApproval: ReturnType<typeof internalSelectPendingApproval>;
  /**
   * Monotonically increasing counter bumped on each retry so confirmation
   * monitoring and catch handlers ignore stale events from the cancelled batch.
   */
  retryGenerationRef: MutableRefObject<number>;
  /** Dispatcher for signature state-machine events. */
  dispatchSignatureEvent: Dispatch<HardwareWalletSignaturesAction>;
  /**
   * Shared guard returning true when a catch must not update the signature
   * state machine: either cancel-during-retry is in flight, or retry advanced
   * `retryGenerationRef` after this submission started.
   */
  isStaleAttempt: (submissionGeneration: number) => boolean;
  /** Redux dispatch, typed for thunks like `updateAndApproveTx`. */
  dispatch: MetaMaskReduxDispatch;
};

export type UseSendBundleSubmissionReturn = {
  /** Approves the sendBundle tx, triggering device signing (auto-submit path). */
  submitSendBundleTransaction: () => Promise<void>;
  /** Recreates and re-approves the sendBundle tx after a rejection or failure. */
  retrySendBundleSubmission: () => Promise<void>;
};
