import { AccountWalletType } from '@metamask/account-api';
import type { AccountWalletObject } from '@metamask/account-tree-controller';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  MetaMetricsEventAccountType,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../shared/constants/metametrics';
import {
  getAccountWalletMetricProps,
  isPrivateKeyWallet,
} from './account-wallet';

const createKeyringWallet = (keyringType: KeyringTypes) =>
  ({
    id: `keyring:${keyringType}`,
    type: AccountWalletType.Keyring,
    metadata: { name: keyringType, keyring: { type: keyringType } },
    groups: {},
  }) as unknown as AccountWalletObject;

const entropyWallet = {
  id: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ',
  type: AccountWalletType.Entropy,
  metadata: { name: 'Wallet 1', entropy: { id: '01JKAF3DSGM3AB87EM9' } },
  groups: {},
} as unknown as AccountWalletObject;

describe('isPrivateKeyWallet', () => {
  it('identifies an imported private key wallet', () => {
    expect(isPrivateKeyWallet(createKeyringWallet(KeyringTypes.simple))).toBe(
      true,
    );
  });

  it('rejects other keyring wallets, such as hardware wallets', () => {
    expect(isPrivateKeyWallet(createKeyringWallet(KeyringTypes.ledger))).toBe(
      false,
    );
  });

  it('rejects wallets that are not keyring wallets', () => {
    expect(isPrivateKeyWallet(entropyWallet)).toBe(false);
  });
});

// Segment property names are snake_case by contract.
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
/* eslint-disable @typescript-eslint/naming-convention */
describe('getAccountWalletMetricProps', () => {
  it('reports an entropy wallet as a MetaMask account', () => {
    expect(getAccountWalletMetricProps(entropyWallet)).toStrictEqual({
      account_type: MetaMetricsEventAccountType.Default,
    });
  });

  it('reports an imported private key wallet as imported', () => {
    expect(
      getAccountWalletMetricProps(createKeyringWallet(KeyringTypes.simple)),
    ).toStrictEqual({
      account_type: MetaMetricsEventAccountType.Imported,
    });
  });

  const hardwareCases: [KeyringTypes, MetaMetricsHardwareWalletDeviceType][] = [
    [KeyringTypes.ledger, MetaMetricsHardwareWalletDeviceType.Ledger],
    [KeyringTypes.trezor, MetaMetricsHardwareWalletDeviceType.Trezor],
    [KeyringTypes.lattice, MetaMetricsHardwareWalletDeviceType.Lattice],
    [KeyringTypes.qr, MetaMetricsHardwareWalletDeviceType.QrHardware],
    // OneKey is air-gapped over QR, and is grouped with QR hardware by the
    // number_of_qr_hardware_accounts user trait too.
    [KeyringTypes.oneKey, MetaMetricsHardwareWalletDeviceType.QrHardware],
  ];

  hardwareCases.forEach(([keyringType, deviceType]) => {
    it(`reports ${keyringType} with the Segment device name in both account_type and account_hardware_type`, () => {
      expect(
        getAccountWalletMetricProps(createKeyringWallet(keyringType)),
      ).toStrictEqual({
        account_type: deviceType,
        account_hardware_type: deviceType,
      });
    });
  });

  it('never reports the generic hardware value, which is not in the schema enum', () => {
    const hardwareKeyrings = [
      KeyringTypes.ledger,
      KeyringTypes.trezor,
      KeyringTypes.lattice,
      KeyringTypes.qr,
      KeyringTypes.oneKey,
    ];

    hardwareKeyrings.forEach((keyringType) => {
      expect(
        getAccountWalletMetricProps(createKeyringWallet(keyringType))
          .account_type,
      ).not.toBe(MetaMetricsEventAccountType.Hardware);
    });
  });

  it('reports a snap wallet with its snap id', () => {
    const snapWallet = {
      id: 'snap:npm:@metamask/solana-wallet-snap',
      type: AccountWalletType.Snap,
      metadata: {
        name: 'Solana',
        snap: { id: 'npm:@metamask/solana-wallet-snap' },
      },
      groups: {},
    } as unknown as AccountWalletObject;

    expect(getAccountWalletMetricProps(snapWallet)).toStrictEqual({
      account_type: MetaMetricsEventAccountType.Snap,
      account_snap_type: 'npm:@metamask/solana-wallet-snap',
    });
  });

  it('never returns a null or undefined account_type when the wallet is gone', () => {
    // `account_type` is required by the schema, so an unresolvable wallet must
    // still produce a valid value rather than an absent or null one.
    expect(getAccountWalletMetricProps(undefined)).toStrictEqual({
      account_type: MetaMetricsEventAccountType.Default,
    });
  });

  it('never reports a raw AccountWalletType value, which the schema does not accept', () => {
    const invalidValues: string[] = Object.values(AccountWalletType);

    [
      entropyWallet,
      createKeyringWallet(KeyringTypes.simple),
      createKeyringWallet(KeyringTypes.ledger),
      undefined,
    ].forEach((wallet) => {
      expect(invalidValues).not.toContain(
        getAccountWalletMetricProps(wallet).account_type,
      );
    });
  });
});
/* eslint-enable @typescript-eslint/naming-convention */
