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
import {
  DEVICE_HD_PATHS,
  getDeviceHdPaths,
  LATTICE_HD_PATHS,
  LEDGER_HD_PATHS,
  shouldShowHdPathSettings,
  TREZOR_HD_PATHS,
} from './hardware-hd-paths';

describe('hardware HD path constants', () => {
  it('defines LEDGER_HD_PATHS with correct entries', () => {
    expect(LEDGER_HD_PATHS).toStrictEqual([
      { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
      { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
      {
        name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
        value: BIP44_PATH,
      },
    ]);
  });

  it('defines LATTICE_HD_PATHS with correct entries', () => {
    expect(LATTICE_HD_PATHS).toStrictEqual([
      {
        name: `Standard (${LATTICE_STANDARD_BIP44_PATH})`,
        value: LATTICE_STANDARD_BIP44_PATH,
      },
      {
        name: `Ledger Live (${LATTICE_LEDGER_LIVE_PATH})`,
        value: LATTICE_LEDGER_LIVE_PATH,
      },
      {
        name: `Ledger Legacy (${LATTICE_MEW_PATH})`,
        value: LATTICE_MEW_PATH,
      },
    ]);
  });

  it('defines TREZOR_HD_PATHS with correct entries', () => {
    expect(TREZOR_HD_PATHS).toStrictEqual([
      {
        name: `BIP44 Standard (e.g. MetaMask, Trezor)`,
        value: BIP44_PATH,
      },
      { name: `Legacy (Ledger / MEW / MyCrypto)`, value: MEW_PATH },
      { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
    ]);
  });

  it('maps oneKey to the Trezor HD path options', () => {
    expect(DEVICE_HD_PATHS.oneKey).toBe(TREZOR_HD_PATHS);
  });
});

describe('getDeviceHdPaths', () => {
  it('returns ledger paths for ledger devices', () => {
    expect(getDeviceHdPaths(HardwareDeviceNames.ledger)).toBe(LEDGER_HD_PATHS);
  });

  it('returns trezor paths for trezor devices', () => {
    expect(getDeviceHdPaths(HardwareDeviceNames.trezor)).toBe(TREZOR_HD_PATHS);
  });

  it('returns an empty array for unsupported devices', () => {
    expect(getDeviceHdPaths(HardwareDeviceNames.qr)).toStrictEqual([]);
  });
});

describe('shouldShowHdPathSettings', () => {
  it('returns true for ledger devices', () => {
    expect(shouldShowHdPathSettings(HardwareDeviceNames.ledger)).toBe(true);
  });

  it('returns true for lattice devices', () => {
    expect(shouldShowHdPathSettings(HardwareDeviceNames.lattice)).toBe(true);
  });

  it('returns true for trezor devices', () => {
    expect(shouldShowHdPathSettings(HardwareDeviceNames.trezor)).toBe(true);
  });

  it('returns true for oneKey devices', () => {
    expect(shouldShowHdPathSettings(HardwareDeviceNames.oneKey)).toBe(true);
  });

  it('returns false for QR hardware devices', () => {
    expect(shouldShowHdPathSettings(HardwareDeviceNames.qr)).toBe(false);
  });
});
