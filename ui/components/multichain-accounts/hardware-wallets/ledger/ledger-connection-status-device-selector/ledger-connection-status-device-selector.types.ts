export type LedgerConnectionStatusDeviceSelectorProps = {
  /** Detected Ledger model name shown in the selector row. */
  deviceModelName: string;
  /** Number of detected Ledger devices. Defaults to 1. */
  deviceCount?: number;
  /** Enables device selection when multiple devices are detected. */
  isDeviceSelectionEnabled?: boolean;
  /** Row click handler. Requires isDeviceSelectionEnabled and multiple devices. */
  onDeviceSelectorClick?: () => void;
};
