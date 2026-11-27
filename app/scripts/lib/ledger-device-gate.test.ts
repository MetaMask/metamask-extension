import { it as jestIt } from '@jest/globals';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { HardwareWalletType } from '../../../shared/lib/hardware-wallets';
import {
  getLedgerModelKey,
  LedgerDeviceGate,
  type LedgerGateKeyring,
} from './ledger-device-gate';

const connection = (productId = 0x0004) => ({ productId });

// Stateful binding, so a bind is visible to later calls like on the real keyring.
function buildKeyring({
  deviceId = '',
  connected = [connection()],
}: {
  deviceId?: string;
  connected?: { productId: number }[];
} = {}) {
  let currentDeviceId = deviceId;
  let currentConnected = [...connected];
  return {
    get connected() {
      return currentConnected;
    },
    set connected(next: { productId: number }[]) {
      currentConnected = [...next];
    },
    bridge: {
      getConnectedDeviceInfo: jest.fn(async () => currentConnected),
    },
    getDeviceId: jest.fn(() => currentDeviceId),
    setDeviceId: jest.fn((id: string) => {
      currentDeviceId = id;
    }),
  };
}

const enforce = (keyring: LedgerGateKeyring, allowBind = true) =>
  new LedgerDeviceGate().enforceSingleDevice(keyring, { allowBind });

describe('getLedgerModelKey', () => {
  it('normalizes both productId conventions', () => {
    for (const [productId, expected] of [
      [0x0001, '1'],
      [0x0004, '4'],
      [0x0400, '4'],
      [0x0401, '4'],
    ] as const) {
      expect(getLedgerModelKey(productId)).toBe(expected);
    }
  });
});

describe('LedgerDeviceGate', () => {
  describe('enforceSingleDevice', () => {
    it('binds the normalized model once, and only with allowBind', async () => {
      const keyring = buildKeyring();

      await enforce(keyring);
      await enforce(keyring);
      expect(keyring.setDeviceId).toHaveBeenCalledWith('4');
      expect(keyring.setDeviceId).toHaveBeenCalledTimes(1);

      const unbound = buildKeyring();
      await enforce(unbound, false);
      expect(unbound.setDeviceId).not.toHaveBeenCalled();
    });

    jestIt.each([0x0001, 0x0101])(
      'throws 3011 for a different model (productId %#)',
      async (productId) => {
        const keyring = buildKeyring({
          deviceId: '4',
          connected: [connection(productId)],
        });

        await expect(enforce(keyring)).rejects.toMatchObject({
          code: ErrorCode.DeviceMultipleConnected,
          metadata: { walletType: HardwareWalletType.Ledger },
          userMessage: expect.stringContaining('one Ledger at a time'),
        });
      },
    );

    jestIt.each([0x0004, 0x0400, 0x0401])(
      'allows the bound model (productId %#)',
      async (productId) => {
        const keyring = buildKeyring({
          deviceId: '4',
          connected: [connection(productId)],
        });

        await expect(enforce(keyring)).resolves.toBeUndefined();
      },
    );

    it('fails open when the query rejects, is missing, or is empty', async () => {
      const rejecting = buildKeyring({ deviceId: '4' });
      rejecting.bridge.getConnectedDeviceInfo.mockRejectedValueOnce(
        new Error('No active Ledger handler'),
      );
      const empty = buildKeyring({ deviceId: '4', connected: [] });

      for (const keyring of [rejecting, {} as LedgerGateKeyring, empty]) {
        await expect(enforce(keyring)).resolves.toBeUndefined();
      }
      expect(rejecting.setDeviceId).not.toHaveBeenCalled();
      expect(empty.setDeviceId).not.toHaveBeenCalled();
    });

    it('fails open with more than one device, bound or not', async () => {
      const several = [connection(0x0004), connection(0x0001)];
      const unbound = buildKeyring({ connected: several });
      // Pins the fix: `connected[0]` is nondeterministic, so a bound model
      // must never be compared against one arbitrary device.
      const bound = buildKeyring({ deviceId: '4', connected: several });

      for (const keyring of [unbound, bound]) {
        await expect(enforce(keyring)).resolves.toBeUndefined();
      }
      expect(unbound.setDeviceId).not.toHaveBeenCalled();
    });
  });
});
