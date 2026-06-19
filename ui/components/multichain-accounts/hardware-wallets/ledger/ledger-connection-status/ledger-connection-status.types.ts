import type { LedgerConnectionStatusType } from '../ledger-connection-status.constants';

export type LedgerConnectionStatusProps = {
  /** Connection state for the illustration, copy, and optional sections. */
  status: LedgerConnectionStatusType;
  /** Ledger model name shown when status is device-found. */
  deviceModelName?: string;
  /** Back button click handler. Omit to hide the back button. */
  onBack?: () => void;
  /** Device selector click handler for the device-found state. */
  onDeviceSelectorClick?: () => void;
};
