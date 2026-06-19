export type LedgerConnectionStatusDeviceSelectorProps = {
  /** Detected Ledger model name shown in the selector row. */
  deviceModelName: string;
  /** Row click handler. Omit for a non-interactive row. */
  onDeviceSelectorClick?: () => void;
};
