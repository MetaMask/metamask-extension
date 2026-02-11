import { KeyringTypes } from '@metamask/keyring-controller';

import { HardwareWalletType } from './types';
import { keyringTypeToHardwareWalletType } from './utils';

describe('keyringTypeToHardwareWalletType', () => {
  it('returns Ledger for ledger keyring type', () => {
    expect(keyringTypeToHardwareWalletType(KeyringTypes.ledger)).toBe(
      HardwareWalletType.Ledger,
    );
  });

  it('returns Trezor for trezor keyring type', () => {
    expect(keyringTypeToHardwareWalletType(KeyringTypes.trezor)).toBe(
      HardwareWalletType.Trezor,
    );
  });

  it('returns OneKey for oneKey keyring type', () => {
    expect(keyringTypeToHardwareWalletType(KeyringTypes.oneKey)).toBe(
      HardwareWalletType.OneKey,
    );
  });

  it('returns Lattice for lattice keyring type', () => {
    expect(keyringTypeToHardwareWalletType(KeyringTypes.lattice)).toBe(
      HardwareWalletType.Lattice,
    );
  });

  it('returns Qr for qr keyring type', () => {
    expect(keyringTypeToHardwareWalletType(KeyringTypes.qr)).toBe(
      HardwareWalletType.Qr,
    );
  });

  it('returns null for null keyring type', () => {
    expect(keyringTypeToHardwareWalletType(null)).toBeNull();
  });

  it('returns null for undefined keyring type', () => {
    expect(keyringTypeToHardwareWalletType(undefined)).toBeNull();
  });

  it('returns null for empty string keyring type', () => {
    expect(keyringTypeToHardwareWalletType('')).toBeNull();
  });

  it('returns null for unknown keyring type', () => {
    expect(keyringTypeToHardwareWalletType('Unknown Keyring')).toBeNull();
  });
});
