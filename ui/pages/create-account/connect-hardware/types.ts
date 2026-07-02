import type { RawHardwareAccount } from './utils/map-hardware-accounts';

export type { RawHardwareAccount };

/** Callback that may complete synchronously or as a promise. */
export type AsyncVoidCallback = () => void | Promise<void>;

/** Hardware account row from connectHardware, including legacy balance display. */
export type HardwareConnectAccount = RawHardwareAccount & {
  balance: string;
};

/** HD path option for hardware wallet onboarding. */
export type HardwareHdPathOptionData = {
  name: string;
  value: string;
};
