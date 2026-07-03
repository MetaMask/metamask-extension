/** Raw account row returned from connectHardware before UI mapping. */
export type RawHardwareAccount = {
  address: string;
  index: number;
};

/** Hardware account row from connectHardware, including legacy balance display. */
export type HardwareConnectAccount = RawHardwareAccount & {
  balance: string;
};

/** HD path option for hardware wallet onboarding. */
export type HardwareHdPathOptionData = {
  name: string;
  value: string;
};
