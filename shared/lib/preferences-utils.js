import { isManifestV3 } from '../modules/mv3.utils';
import { LEDGER_TRANSPORT_TYPES } from '../constants/hardware-wallets';

export const getInitLedgerTransportType = () => {
  if (isManifestV3) {
    // Then enforce the use of WebHID as the default, despite
    // the current context not supporting window.navigator.hid
    return LEDGER_TRANSPORT_TYPES.WEBHID;
  }

  return window.navigator.hid
    ? LEDGER_TRANSPORT_TYPES.WEBHID
    : LEDGER_TRANSPORT_TYPES.U2F;
};
