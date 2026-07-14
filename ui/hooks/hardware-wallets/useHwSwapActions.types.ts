import type { MutableRefObject } from 'react';

import type {
  HardwareWalletSignaturesAction,
  HardwareWalletSignaturesState,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

export type UseHwSwapActionsOptions = {
  /** Current hardware-wallet signature state-machine state. */
  signatureState: HardwareWalletSignaturesState;
  /** Dispatcher for signature state-machine events. */
  dispatchSignatureEvent: React.Dispatch<HardwareWalletSignaturesAction>;
  /** Cancels the in-flight hardware-wallet signing batch. */
  cancelCurrentBatch: () => Promise<void>;
  /** Clears connection-error tracking so a retry can re-handle errors. */
  resetConnectionError: () => void;
  /**
   * Monotonically increasing counter bumped on each retry so confirmation
   * monitoring and QR state ignore stale events from the cancelled batch.
   */
  retryGenerationRef: MutableRefObject<number>;
  /** Whether the flow requires two separate hardware-wallet confirmations. */
  needsTwoConfirmations: boolean;
  /** Whether smart transactions are enabled for the current network. */
  isStxEnabled: boolean;
  /** True when signing a sendBundle (send) flow rather than a bridge/swap. */
  isSendBundleFlow: boolean;
  /**
   * Ref set to `true` when sendBundle auto-submit or retry has started.
   * Retry sets this before re-submitting so the auto-submit effect does not
   * fire again for the refreshed txMeta.
   */
  hasStartedSendBundleSubmission: MutableRefObject<boolean>;
  /** Recreates and re-approves the sendBundle transaction. */
  retrySendBundleSubmission: () => Promise<void>;
  /** Re-submits the locked bridge/swap quote. */
  retrySubmission: () => Promise<void>;
  /** Stops any active QR signature scan. */
  handleQrSignatureCancel: () => void;
  /**
   * Pending approval id for the sendBundle flow. Rejected on cancel so the
   * confirmation does not linger after navigating away.
   */
  currentApprovalRequestId?: string;
  /** Optional route to return to when cancelling a sendBundle flow. */
  returnRoute?: string;
  /**
   * Shared guard ref set while a retry is in flight. Owned by the caller so
   * submission error handlers defined earlier in the hook order can ignore
   * reject/fail outcomes from the cancelled batch.
   */
  isRetryingRef: MutableRefObject<boolean>;
};
