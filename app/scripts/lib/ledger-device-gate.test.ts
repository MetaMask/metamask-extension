import log from 'loglevel';
import { it as jestIt } from '@jest/globals';
import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  HardwareWalletErrorCode,
  HardwareWalletType,
} from '../../../shared/lib/hardware-wallets';
import {
  getLedgerModelKey,
  LedgerDeviceGate,
  type LedgerGateKeyring,
} from './ledger-device-gate';

const ACCOUNT = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
const CHECKSUMMED = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const OTHER = '0x0000000000000000000000000000000000000001';

const connection = (productId = 0x0004, connectionId = 'c1') => ({
  productId,
  connectionId,
});

// Stateful binding, so a bind is visible to later calls like on the real keyring.
function buildKeyring({
  deviceId = '',
  connected = [connection()],
  accounts = [] as string[],
  unlockAccountByAddress = jest.fn().mockResolvedValue("m/44'/60'/0'/0/0"),
}: {
  deviceId?: string;
  connected?: { productId: number; connectionId: string }[];
  accounts?: string[];
  unlockAccountByAddress?: jest.Mock;
} = {}) {
  let currentDeviceId = deviceId;
  let currentConnected = [...connected];
  return {
    get connected() {
      return currentConnected;
    },
    set connected(next: { productId: number; connectionId: string }[]) {
      currentConnected = [...next];
    },
    unlockAccountByAddress,
    bridge: {
      getConnectedDeviceInfo: jest.fn(async () => currentConnected),
    },
    getDeviceId: jest.fn(() => currentDeviceId),
    setDeviceId: jest.fn((id: string) => {
      currentDeviceId = id;
    }),
    getAccounts: jest.fn(async () => accounts.map((address) => ({ address }))),
  };
}

const enforce = (keyring: LedgerGateKeyring, allowBind = true) =>
  new LedgerDeviceGate().enforceSingleDevice(keyring, { allowBind });

const verify = (keyring: LedgerGateKeyring, address = ACCOUNT) =>
  new LedgerDeviceGate().verifyAccountOwnership(keyring, address);

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
      const several = [connection(0x0004), connection(0x0001, 'c2')];
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

  describe('verifyAccountOwnership', () => {
    it('normalizes the address on match and throws 3012 on seed mismatch', async () => {
      const ok = buildKeyring();
      await expect(verify(ok, CHECKSUMMED)).resolves.toBeUndefined();
      expect(ok.unlockAccountByAddress).toHaveBeenCalledWith(ACCOUNT);

      const bad = buildKeyring({
        unlockAccountByAddress: jest
          .fn()
          .mockRejectedValue(
            new Error(
              `Ledger: Account ${CHECKSUMMED} does not belong to the connected device`,
            ),
          ),
      });
      await expect(verify(bad, CHECKSUMMED)).rejects.toMatchObject({
        code: HardwareWalletErrorCode.DeviceSeedMismatch,
        metadata: { accountAddress: ACCOUNT },
      });
    });

    it('fails open on missing unlock, missing path, or transient error without memoizing', async () => {
      const warn = jest.spyOn(log, 'warn').mockImplementation(() => undefined);
      const rejectWith = (msg: string) =>
        buildKeyring({
          unlockAccountByAddress: jest.fn().mockRejectedValue(new Error(msg)),
        });
      const noPath = rejectWith(
        `Ledger: Account for address '${ACCOUNT}' not found`,
      );
      const transient = rejectWith('TransportOpenFailed');

      for (const keyring of [{}, noPath, transient, transient]) {
        await expect(verify(keyring)).resolves.toBeUndefined();
      }
      expect(transient.unlockAccountByAddress).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledWith(
        'Ledger seed check skipped: no derivation path recorded for the account',
        expect.anything(),
      );
      warn.mockRestore();
    });

    it('memoizes per connection+address and invalidates on replug, clearMemo, or empty list', async () => {
      const gate = new LedgerDeviceGate();
      const keyring = buildKeyring();

      await gate.verifyAccountOwnership(keyring, ACCOUNT);
      await gate.verifyAccountOwnership(keyring, CHECKSUMMED);
      await gate.verifyAccountOwnership(keyring, OTHER);
      expect(keyring.unlockAccountByAddress).toHaveBeenCalledTimes(2);

      keyring.connected = [connection(0x0004, 'c2')];
      await gate.verifyAccountOwnership(keyring, ACCOUNT);
      gate.clearMemo();
      await gate.verifyAccountOwnership(keyring, ACCOUNT);
      keyring.connected = [];
      await gate.verifyAccountOwnership(keyring, ACCOUNT);
      keyring.connected = [connection(0x0004, 'c2')];
      await gate.verifyAccountOwnership(keyring, ACCOUNT);
      expect(keyring.unlockAccountByAddress).toHaveBeenCalledTimes(6);
    });
  });

  describe('verifyFirstStoredAccount', () => {
    it('verifies the first account, skips empty, and fails open on getAccounts error', async () => {
      const warn = jest.spyOn(log, 'warn').mockImplementation(() => undefined);
      const gate = new LedgerDeviceGate();
      const populated = buildKeyring({ accounts: [CHECKSUMMED] });
      const empty = buildKeyring();
      const failing = buildKeyring();
      failing.getAccounts.mockRejectedValueOnce(new Error('TransportOpen'));

      await gate.verifyFirstStoredAccount(populated);
      expect(populated.unlockAccountByAddress).toHaveBeenCalledWith(ACCOUNT);

      await gate.verifyFirstStoredAccount(empty);
      expect(empty.unlockAccountByAddress).not.toHaveBeenCalled();

      await expect(
        gate.verifyFirstStoredAccount(failing),
      ).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith(
        'Ledger first-account seed check failed, failing open',
        expect.anything(),
      );
      warn.mockRestore();
    });
  });
});
