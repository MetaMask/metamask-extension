import { isManifestV3 } from '../modules/mv3.utils';
import { LedgerTransportTypes } from '../constants/hardware-wallets';

export const getDefaultLedgerTransportType = (): LedgerTransportTypes => {
  if (isManifestV3) {
    // Then enforce the use of WebHID as the default, despite
    // the current context not supporting window.navigator.hid
    return LedgerTransportTypes.webhid;
  }

  return Object.hasOwnProperty.call(window.navigator, 'hid')
    ? LedgerTransportTypes.webhid
    : LedgerTransportTypes.u2f;
};

export const getRecommendedLedgerTransportType = (): LedgerTransportTypes => {
  // Currently the recommended ledger transport type is the default
  return getDefaultLedgerTransportType();
};

type LedgerTranslations = Record<LedgerTransportTypes, string>;
type LedgerTransportOption = {
  name: LedgerTranslations[LedgerTransportTypes];
  value: LedgerTransportTypes;
};

export const getLedgerTransportOption = (
  transportType: LedgerTransportTypes,
  translations: LedgerTranslations,
): LedgerTransportOption => {
  return {
    name: translations[transportType],
    value: transportType,
  };
};
