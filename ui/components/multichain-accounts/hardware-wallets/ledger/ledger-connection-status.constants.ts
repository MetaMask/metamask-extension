import { IconName } from '@metamask/design-system-react';

export const LEDGER_CONNECTION_STATUS = {
  Searching: 'searching',
  DeviceFound: 'device-found',
  DeviceUnresponsive: 'device-unresponsive',
  AppClosed: 'app-closed',
  DeviceLocked: 'device-locked',
  DeviceNotFound: 'device-not-found',
  GenericError: 'generic-error',
} as const;

export type LedgerConnectionStatusType =
  (typeof LEDGER_CONNECTION_STATUS)[keyof typeof LEDGER_CONNECTION_STATUS];

export type LedgerConnectionStatusDeviceNotFound =
  typeof LEDGER_CONNECTION_STATUS.DeviceNotFound;

export const LEDGER_CONNECTION_STATUS_LIST: LedgerConnectionStatusType[] =
  Object.values(LEDGER_CONNECTION_STATUS);

const LEDGER_CONNECTION_ILLUSTRATION_BASE =
  './images/hardware-wallets/ledger-connection';

export const LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL: Record<
  LedgerConnectionStatusType,
  string
> = {
  [LEDGER_CONNECTION_STATUS.Searching]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-searching.png`,
  [LEDGER_CONNECTION_STATUS.DeviceFound]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-device-found.png`,
  [LEDGER_CONNECTION_STATUS.DeviceUnresponsive]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-device-inactive.png`,
  [LEDGER_CONNECTION_STATUS.AppClosed]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-ethereum-app-closed.png`,
  [LEDGER_CONNECTION_STATUS.DeviceLocked]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-device-inactive.png`,
  [LEDGER_CONNECTION_STATUS.DeviceNotFound]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-device-inactive.png`,
  [LEDGER_CONNECTION_STATUS.GenericError]: `${LEDGER_CONNECTION_ILLUSTRATION_BASE}/ledger-generic-error.png`,
};

export type LedgerConnectionStatusInstruction = {
  iconName: IconName;
  messageKey: string;
};

export type LedgerConnectionStatusContentConfig = {
  titleKey: string;
  descriptionKey?: string;
  showDeviceSelector?: boolean;
  instructions?: LedgerConnectionStatusInstruction[];
};

export const LEDGER_CONNECTION_STATUS_CONTENT: Record<
  LedgerConnectionStatusType,
  LedgerConnectionStatusContentConfig
> = {
  [LEDGER_CONNECTION_STATUS.Searching]: {
    titleKey: 'ledgerConnectionStatusSearchingTitle',
    descriptionKey: 'ledgerConnectionStatusSearchingDescription',
  },
  [LEDGER_CONNECTION_STATUS.DeviceFound]: {
    titleKey: 'ledgerConnectionStatusDeviceFoundTitle',
    showDeviceSelector: true,
  },
  [LEDGER_CONNECTION_STATUS.DeviceUnresponsive]: {
    titleKey: 'ledgerConnectionStatusDeviceUnresponsiveTitle',
    descriptionKey: 'ledgerConnectionStatusDeviceUnresponsiveDescription',
  },
  [LEDGER_CONNECTION_STATUS.AppClosed]: {
    titleKey: 'ledgerConnectionStatusAppClosedTitle',
    descriptionKey: 'ledgerConnectionStatusAppClosedDescription',
  },
  [LEDGER_CONNECTION_STATUS.DeviceLocked]: {
    titleKey: 'ledgerConnectionStatusDeviceLockedTitle',
    descriptionKey: 'ledgerConnectionStatusDeviceLockedDescription',
  },
  [LEDGER_CONNECTION_STATUS.DeviceNotFound]: {
    titleKey: 'ledgerConnectionStatusDeviceNotFoundTitle',
    instructions: [
      {
        iconName: IconName.Plug,
        messageKey: 'ledgerConnectionStatusDeviceNotFoundStepPlugIn',
      },
      {
        iconName: IconName.Lock,
        messageKey: 'ledgerConnectionStatusDeviceNotFoundStepUnlock',
      },
      {
        iconName: IconName.Ethereum,
        messageKey: 'ledgerConnectionStatusDeviceNotFoundStepOpenEthApp',
      },
      {
        iconName: IconName.Wifi,
        messageKey: 'ledgerConnectionStatusDeviceNotFoundStepRetry',
      },
    ],
  },
  [LEDGER_CONNECTION_STATUS.GenericError]: {
    titleKey: 'ledgerConnectionStatusGenericErrorTitle',
    descriptionKey: 'ledgerConnectionStatusGenericErrorDescription',
  },
};
