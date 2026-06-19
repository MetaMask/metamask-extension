import { LEDGER_CONNECTION_STATUS } from '../ledger-connection-status';

export type LedgerConnectionStatusInstructionsProps = {
  /** Must be `device-not-found`; renders the troubleshooting checklist for that state. */
  status: typeof LEDGER_CONNECTION_STATUS.DeviceNotFound;
};
