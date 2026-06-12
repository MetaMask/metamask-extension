import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

import { HardwareWalletType } from './types';
import {
  isHardwareWalletRoute,
  keyringTypeToHardwareWalletType,
} from './utils';

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

describe('isHardwareWalletRoute', () => {
  it('returns true for transaction confirmation route', () => {
    expect(isHardwareWalletRoute(CONFIRM_TRANSACTION_ROUTE)).toBe(true);
  });

  it('returns true for confirmation vNext route', () => {
    expect(isHardwareWalletRoute(CONFIRMATION_V_NEXT_ROUTE)).toBe(true);
  });

  it('returns true for cross-chain swap route', () => {
    expect(isHardwareWalletRoute(CROSS_CHAIN_SWAP_ROUTE)).toBe(true);
  });

  it('returns true for awaiting signatures route', () => {
    expect(isHardwareWalletRoute(AWAITING_SIGNATURES_ROUTE)).toBe(true);
  });

  it('returns false for unrelated route', () => {
    expect(isHardwareWalletRoute(DEFAULT_ROUTE)).toBe(false);
  });
});
