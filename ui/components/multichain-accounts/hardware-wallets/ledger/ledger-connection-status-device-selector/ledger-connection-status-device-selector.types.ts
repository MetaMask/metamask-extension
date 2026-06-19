export type LedgerConnectionStatusDeviceSelectorProps = {
  /** Detected Ledger model name shown in the selector row. */
  deviceModelName: string;
  /** Called when the row is clicked. Omit to render a non-interactive row. */
  onDeviceSelectorClick?: () => void;
};
