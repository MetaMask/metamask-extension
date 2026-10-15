import { KeyringTypes } from '@metamask/keyring-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';

import { HardwareWalletType } from './types';
import {
  isHardwareWalletErrorModalRoute,
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

  it('returns true for cross-chain sub-routes', () => {
    expect(
      isHardwareWalletRoute(
        `${CROSS_CHAIN_SWAP_ROUTE}/swaps/prepare-bridge-page`,
      ),
    ).toBe(true);
  });

  it('returns true for awaiting signatures route', () => {
    expect(isHardwareWalletRoute(AWAITING_SIGNATURES_ROUTE)).toBe(true);
  });

  it('returns false for unrelated route', () => {
    expect(isHardwareWalletRoute(DEFAULT_ROUTE)).toBe(false);
  });
});

describe('isHardwareWalletErrorModalRoute', () => {
  it('returns true for transaction confirmation route', () => {
    expect(isHardwareWalletErrorModalRoute(CONFIRM_TRANSACTION_ROUTE)).toBe(
      true,
    );
  });

  it('returns true for confirmation vNext route', () => {
    expect(isHardwareWalletErrorModalRoute(CONFIRMATION_V_NEXT_ROUTE)).toBe(
      true,
    );
  });

  it('returns true for awaiting signatures route', () => {
    expect(isHardwareWalletErrorModalRoute(AWAITING_SIGNATURES_ROUTE)).toBe(
      true,
    );
  });

  it('returns false for cross-chain swap route', () => {
    expect(isHardwareWalletErrorModalRoute(CROSS_CHAIN_SWAP_ROUTE)).toBe(false);
  });

  it('returns false for cross-chain sub-routes', () => {
    expect(
      isHardwareWalletErrorModalRoute(
        `${CROSS_CHAIN_SWAP_ROUTE}/swaps/prepare-bridge-page`,
      ),
    ).toBe(false);
  });

  it('returns true for the cross-chain hardware wallet signatures route', () => {
    expect(
      isHardwareWalletErrorModalRoute(
        '/cross-chain/swaps/hardware-wallet-signatures',
      ),
    ).toBe(true);
  });

  it('returns true for the composed hardware wallet signatures prefix', () => {
    expect(
      isHardwareWalletErrorModalRoute(
        `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`,
      ),
    ).toBe(true);
  });

  it('returns false for unrelated route', () => {
    expect(isHardwareWalletErrorModalRoute(DEFAULT_ROUTE)).toBe(false);
  });
});
