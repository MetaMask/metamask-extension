import type { LedgerConnectionStatusType } from './ledger-connection-status.constants';

export type LedgerConnectionStatusProps = {
  /** Connection state that controls the illustration, copy, and optional UI sections. */
  status: LedgerConnectionStatusType;
  /** Ledger model name for the device-found selector (for example, "Nano X"). */
  deviceModelName?: string;
  /** Called when the back button is clicked. Omit to hide back navigation. */
  onBack?: () => void;
  /** Called when the device selector row is clicked in the device-found state. */
  onDeviceSelectorClick?: () => void;
};
