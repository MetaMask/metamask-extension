import { isManifestV3 } from '../modules/mv3.utils';
import { LedgerTransportTypes } from '../constants/hardware-wallets';

export const getInitLedgerTransportType = (): string => {
  if (isManifestV3) {
    // Then enforce the use of WebHID as the default, despite
    // the current context not supporting window.navigator.hid
    return LedgerTransportTypes.webhid;
  }

  return Object.hasOwnProperty.call(window.navigator, 'hid')
    ? LedgerTransportTypes.webhid
    : LedgerTransportTypes.u2f;
};
