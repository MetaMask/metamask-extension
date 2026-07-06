import { QrKeyring } from '@metamask/eth-qr-keyring';
import { QrKeyring as QrKeyringV2 } from '@metamask/eth-qr-keyring/v2';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import {
  OneKeyKeyring as OneKeyKeyringV2,
  TrezorKeyring as TrezorKeyringV2,
} from '@metamask/eth-trezor-keyring/v2';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import { LedgerKeyring as LedgerKeyringV2 } from '@metamask/eth-ledger-bridge-keyring/v2';
import LatticeKeyring from 'eth-lattice-keyring';
import { SnapKeyring as SnapKeyringV2 } from '@metamask/eth-snap-keyring/v2';
import { LatticeKeyringV2 } from '../lib/offscreen-bridge/lattice-keyring-v2';
import { HardwareDeviceNames } from '../../../shared/constants/hardware-wallets';
import {
  cancelHardwareConnect,
  getKeyringBuilders,
  getKeyringV2Builders,
} from './keyrings';

const mockTrezorOffscreenCancel = jest.fn().mockResolvedValue(undefined);
const mockTrezorMv2Cancel = jest.fn().mockResolvedValue(undefined);

// The V2 wrappers have their own tests; here we only verify that
// `getKeyringV2Builders` wires each one up correctly, so stub them out.
jest.mock('@metamask/eth-qr-keyring/v2', () => ({ QrKeyring: jest.fn() }));
jest.mock('@metamask/eth-trezor-keyring/v2', () => ({
  OneKeyKeyring: jest.fn(),
  TrezorKeyring: jest.fn(),
}));
jest.mock('@metamask/eth-ledger-bridge-keyring/v2', () => ({
  LedgerKeyring: jest.fn(),
}));
jest.mock('../lib/offscreen-bridge/lattice-keyring-v2', () => ({
  LatticeKeyringV2: jest.fn(),
}));

// `getKeyringBuilders` instantiates a Trezor bridge for cancellation and wires
// up the snap keyring + an internal messenger. Stub these so the test can focus
// on the cancel routing without real transports or messengers.
jest.mock('../lib/offscreen-bridge/trezor-offscreen-bridge', () => ({
  TrezorOffscreenBridge: jest
    .fn()
    .mockImplementation(() => ({ cancel: mockTrezorOffscreenCancel })),
}));
jest.mock('../lib/offscreen-bridge/trezor-mv2-bridge', () => ({
  TrezorMv2Bridge: jest
    .fn()
    .mockImplementation(() => ({ cancel: mockTrezorMv2Cancel })),
}));
jest.mock('../lib/snap-keyring', () => ({
  snapKeyringBuilder: jest.fn(() => ({ type: 'Snap Keyring' })),
}));
jest.mock('@metamask/messenger', () => ({
  Messenger: jest.fn().mockImplementation(() => ({ delegate: jest.fn() })),
}));
jest.mock('../../../shared/lib/mv3.utils', () => ({ isManifestV3: true }));

describe('getKeyringV2Builders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a builder for each hardware keyring keyed by the legacy type', () => {
    const builders = getKeyringV2Builders();

    expect(builders.map((builder) => builder.type)).toStrictEqual([
      LatticeKeyring.type,
      LedgerKeyring.type,
      QrKeyring.type,
      TrezorKeyring.type,
      OneKeyKeyring.type,
      SnapKeyringV2.type,
    ]);
  });

  it('constructs each V2 wrapper with the legacy keyring and the metadata id as entropy source', () => {
    const builders = getKeyringV2Builders() as unknown as (((
      keyring: unknown,
      metadata: { id: string },
    ) => unknown) & { type: string })[];

    const legacyKeyring = { id: 'legacy' };
    const metadata = { id: 'entropy-id' };
    const expectedArgs = { legacyKeyring, entropySource: metadata.id };

    const builderByType = new Map(
      builders.map((builder) => [builder.type, builder]),
    );

    builderByType.get(LatticeKeyring.type)?.(legacyKeyring, metadata);
    builderByType.get(LedgerKeyring.type)?.(legacyKeyring, metadata);
    builderByType.get(QrKeyring.type)?.(legacyKeyring, metadata);
    builderByType.get(TrezorKeyring.type)?.(legacyKeyring, metadata);
    builderByType.get(OneKeyKeyring.type)?.(legacyKeyring, metadata);

    expect(LatticeKeyringV2).toHaveBeenCalledWith(expectedArgs);
    expect(LedgerKeyringV2).toHaveBeenCalledWith(expectedArgs);
    expect(QrKeyringV2).toHaveBeenCalledWith(expectedArgs);
    expect(TrezorKeyringV2).toHaveBeenCalledWith(expectedArgs);
    expect(OneKeyKeyringV2).toHaveBeenCalledWith(expectedArgs);
  });
});

describe('cancelHardwareConnect', () => {
  const originalInTest = process.env.IN_TEST;

  const buildBuilders = () =>
    getKeyringBuilders({
      delegate: jest.fn(),
      call: jest.fn(),
    } as unknown as Parameters<typeof getKeyringBuilders>[0]);

  beforeEach(() => {
    jest.clearAllMocks();
    // `getKeyringBuilders` swaps in fake bridges when `IN_TEST` is set; clear it
    // so the (mocked) real Trezor bridge is used and its cancel can be asserted.
    delete process.env.IN_TEST;
  });

  afterAll(() => {
    process.env.IN_TEST = originalInTest;
  });

  it('cancels an in-flight Trezor connect via the active bridge', async () => {
    buildBuilders();

    await cancelHardwareConnect(HardwareDeviceNames.trezor);

    expect(mockTrezorOffscreenCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels an in-flight OneKey connect via the active bridge', async () => {
    buildBuilders();

    await cancelHardwareConnect(HardwareDeviceNames.oneKey);

    expect(mockTrezorOffscreenCancel).toHaveBeenCalledTimes(1);
  });

  it('does not cancel for non-Trezor devices', async () => {
    buildBuilders();

    await cancelHardwareConnect(HardwareDeviceNames.ledger);

    expect(mockTrezorOffscreenCancel).not.toHaveBeenCalled();
  });
});
