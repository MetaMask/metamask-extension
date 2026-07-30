import type { LedgerConnectionStatusType } from '../ledger-connection-status.constants';

export type LedgerConnectionStatusProps = {
  /** Connection state for the illustration, copy, and optional sections. */
  status: LedgerConnectionStatusType;
  /** Ledger model name shown when status is device-found. */
  deviceModelName?: string;
  /** Number of detected Ledger devices. Defaults to 1. */
  deviceCount?: number;
  /** Enables device selection when multiple devices are detected. */
  isDeviceSelectionEnabled?: boolean;
  /** Back button click handler. Omit to hide the back button. */
  onBack?: () => void;
  /** Device selector click handler when device selection is enabled. */
  onDeviceSelectorClick?: () => void;
};
