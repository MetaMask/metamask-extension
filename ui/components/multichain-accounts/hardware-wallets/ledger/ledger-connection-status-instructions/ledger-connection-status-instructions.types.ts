import type { LedgerConnectionStatusDeviceNotFound } from '../ledger-connection-status.constants';

export type LedgerConnectionStatusInstructionsProps = {
  /** Device-not-found connection state for the troubleshooting checklist. */
  status: LedgerConnectionStatusDeviceNotFound;
};
