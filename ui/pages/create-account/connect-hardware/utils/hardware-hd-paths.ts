import {
  BIP44_PATH,
  HardwareDeviceNames,
  LATTICE_LEDGER_LIVE_PATH,
  LATTICE_MEW_PATH,
  LATTICE_STANDARD_BIP44_PATH,
  LEDGER_LIVE_PATH,
  MEW_PATH,
  TREZOR_TESTNET_PATH,
} from '../../../../../shared/constants/hardware-wallets';
import type { HardwareHdPathOptionData } from '../types';

export const LEDGER_HD_PATHS: HardwareHdPathOptionData[] = [
  { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
];

export const LATTICE_HD_PATHS: HardwareHdPathOptionData[] = [
  {
    name: `Standard (${LATTICE_STANDARD_BIP44_PATH})`,
    value: LATTICE_STANDARD_BIP44_PATH,
  },
  {
    name: `Ledger Live (${LATTICE_LEDGER_LIVE_PATH})`,
    value: LATTICE_LEDGER_LIVE_PATH,
  },
  { name: `Ledger Legacy (${LATTICE_MEW_PATH})`, value: LATTICE_MEW_PATH },
];

export const TREZOR_HD_PATHS: HardwareHdPathOptionData[] = [
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  { name: `Legacy (Ledger / MEW / MyCrypto)`, value: MEW_PATH },
  { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
];

export const DEVICE_HD_PATHS: Record<string, HardwareHdPathOptionData[]> = {
  ledger: LEDGER_HD_PATHS,
  lattice: LATTICE_HD_PATHS,
  trezor: TREZOR_HD_PATHS,
  oneKey: TREZOR_HD_PATHS,
};

/**
 * Returns HD path options for a hardware device.
 *
 * @param device - Hardware device name.
 */
export function getDeviceHdPaths(device: string): HardwareHdPathOptionData[] {
  return DEVICE_HD_PATHS[device] ?? [];
}

/**
 * Returns whether the device supports HD path configuration.
 *
 * @param device - Hardware device name.
 */
export function shouldShowHdPathSettings(device: string): boolean {
  return [
    HardwareDeviceNames.ledger,
    HardwareDeviceNames.lattice,
    HardwareDeviceNames.trezor,
    HardwareDeviceNames.oneKey,
  ].includes(device as HardwareDeviceNames);
}
