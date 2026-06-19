import type { LedgerConnectionStatusDeviceNotFound } from '../ledger-connection-status.constants';

export type LedgerConnectionStatusInstructionsProps = {
  /** Must be `device-not-found`; renders the troubleshooting checklist for that state. */
  status: LedgerConnectionStatusDeviceNotFound;
};
