import LatticeKeyring from 'eth-lattice-keyring';
import { KeyringType } from '@metamask/keyring-api/v2';
import { EthScope } from '@metamask/keyring-api';
import {
  LatticeKeyringV2,
  type LatticeCreateAccountOptions,
} from './lattice-keyring-v2';

const entropySource = 'lattice-device-id-1234';

const TEST_ADDRESSES = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
  '0x3333333333333333333333333333333333333333',
];

// The upstream `eth-lattice-keyring` declarations don't surface
// method-overload shapes that `jest.spyOn` and `mockResolvedValue` can
// narrow from, and parts of the V2 `CreateAccountOptions` discriminated
// union strip extension-specific fields like `entropySource`. The wrapper
// is the unit under test; the inner keyring's interaction surface is
// exercised only via mocks, so we expose it loosely-typed here to keep
// the call sites readable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InnerLatticeKeyringForTests = any;

/**
 * Build a `LatticeKeyringV2` wrapping a freshly-constructed legacy keyring.
 *
 * @returns The wrapper and inner keyring instances.
 */
function createWrapper(): {
  wrapper: LatticeKeyringV2;
  inner: InnerLatticeKeyringForTests;
} {
  const innerReal = new LatticeKeyring({});
  const wrapper = new LatticeKeyringV2({
    legacyKeyring: innerReal,
    entropySource,
  });
  return { wrapper, inner: innerReal };
}

describe('LatticeKeyringV2', () => {
  describe('constructor', () => {
    it('creates a wrapper with the Lattice keyring type and custom capabilities', () => {
      const { wrapper } = createWrapper();

      expect(wrapper.type).toBe(KeyringType.Lattice);
      expect(wrapper.capabilities).toStrictEqual({
        scopes: [EthScope.Eoa],
        custom: {
          createAccounts: true,
        },
      });
      expect(wrapper.entropySource).toBe(entropySource);
    });
  });

  describe('getAccounts', () => {
    it('returns empty array when the inner keyring has no accounts', async () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'getAccounts').mockResolvedValue([]);

      expect(await wrapper.getAccounts()).toStrictEqual([]);
    });

    it('returns one KeyringAccount per inner address with custom entropy', async () => {
      const { wrapper, inner } = createWrapper();
      jest
        .spyOn(inner, 'getAccounts')
        .mockResolvedValue([TEST_ADDRESSES[0], TEST_ADDRESSES[1]]);

      const accounts = await wrapper.getAccounts();

      expect(accounts).toHaveLength(2);
      expect(accounts[0]).toMatchObject({
        address: TEST_ADDRESSES[0],
        scopes: [EthScope.Eoa],
        options: { entropy: { type: 'custom' } },
      });
      expect(accounts[1]?.address).toBe(TEST_ADDRESSES[1]);
    });

    it('caches account IDs across calls', async () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'getAccounts').mockResolvedValue([TEST_ADDRESSES[0]]);

      const first = await wrapper.getAccounts();
      const second = await wrapper.getAccounts();

      expect(first[0]?.id).toBe(second[0]?.id);
    });

    it('rebuilds the account when the registry has an id but no cached entry', async () => {
      // Models the gap between `registry.getAccountId(hex)` (which returns an
      // id) and `registry.get(id)` (which returns nothing). Use spies to
      // force the asymmetry directly since the public registry API removes
      // both indexes together via `delete`.
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'getAccounts').mockResolvedValue([TEST_ADDRESSES[0]]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { registry } = wrapper as any;
      jest.spyOn(registry, 'getAccountId').mockReturnValue('ghost-id');
      jest.spyOn(registry, 'get').mockReturnValue(undefined);

      const accounts = await wrapper.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.address).toBe(TEST_ADDRESSES[0]);
    });
  });

  describe('createAccounts', () => {
    it('throws for unsupported account creation types', async () => {
      const { wrapper } = createWrapper();

      await expect(
        wrapper.createAccounts({
          type: 'bip44:derive-index',
          entropySource,
          groupIndex: 0,
        }),
      ).rejects.toThrow(/Unsupported account creation type/u);
    });

    it('throws on entropy source mismatch', async () => {
      const { wrapper } = createWrapper();

      await expect(
        wrapper.createAccounts({
          type: 'custom',
          entropySource: 'other-source',
          addressIndex: 0,
        } as LatticeCreateAccountOptions),
      ).rejects.toThrow(/Entropy source mismatch/u);
    });

    it('rejects non-integer or negative addressIndex', async () => {
      const { wrapper } = createWrapper();

      await expect(
        wrapper.createAccounts({
          type: 'custom',
          entropySource,
          addressIndex: -1,
        } as LatticeCreateAccountOptions),
      ).rejects.toThrow(/Invalid addressIndex/u);
    });

    it('delegates to inner setAccountToUnlock + addAccounts and registers the result', async () => {
      const { wrapper, inner } = createWrapper();
      const setAccountToUnlockSpy = jest
        .spyOn(inner, 'setAccountToUnlock')
        .mockImplementation();
      jest.spyOn(inner, 'addAccounts').mockResolvedValue([TEST_ADDRESSES[2]]);

      const accounts = await wrapper.createAccounts({
        type: 'custom',
        entropySource,
        addressIndex: 5,
      } as LatticeCreateAccountOptions);

      expect(setAccountToUnlockSpy).toHaveBeenCalledWith(5);
      expect(accounts).toHaveLength(1);
      expect(accounts[0]?.address).toBe(TEST_ADDRESSES[2]);
    });

    it('throws when the inner keyring returns no new address', async () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'setAccountToUnlock').mockImplementation();
      jest.spyOn(inner, 'addAccounts').mockResolvedValue([]);

      await expect(
        wrapper.createAccounts({
          type: 'custom',
          entropySource,
          addressIndex: 5,
        } as LatticeCreateAccountOptions),
      ).rejects.toThrow(/Failed to create new account/u);
    });
  });

  describe('deleteAccount', () => {
    it('removes the address from the inner keyring and clears the registry entry', async () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'getAccounts').mockResolvedValue([TEST_ADDRESSES[0]]);
      const removeAccountSpy = jest
        .spyOn(inner, 'removeAccount')
        .mockImplementation();

      const [account] = await wrapper.getAccounts();
      if (!account) {
        throw new Error('expected one account');
      }

      await wrapper.deleteAccount(account.id);

      expect(removeAccountSpy).toHaveBeenCalledWith(TEST_ADDRESSES[0]);
    });

    it('throws when the accountId is not in the registry', async () => {
      const { wrapper } = createWrapper();

      await expect(
        wrapper.deleteAccount('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow();
    });
  });

  describe('device management pass-throughs', () => {
    it('exposes the inner hdPath', () => {
      const { wrapper, inner } = createWrapper();
      inner.hdPath = `m/44'/60'/0'/0/x`;

      expect(wrapper.hdPath).toBe(`m/44'/60'/0'/0/x`);
    });

    it('forwards setHdPath to the inner keyring', () => {
      const { wrapper, inner } = createWrapper();
      const spy = jest.spyOn(inner, 'setHdPath').mockImplementation();

      wrapper.setHdPath(`m/44'/60'/0'/0`);

      expect(spy).toHaveBeenCalledWith(`m/44'/60'/0'/0`);
    });

    it('exposes appName via getter+setter', () => {
      const { wrapper, inner } = createWrapper();

      wrapper.appName = 'MetaMask';
      expect(inner.appName).toBe('MetaMask');
      expect(wrapper.appName).toBe('MetaMask');
    });

    it('exposes network via getter+setter', () => {
      const { wrapper, inner } = createWrapper();

      wrapper.network = 'mainnet';
      expect(inner.network).toBe('mainnet');
      expect(wrapper.network).toBe('mainnet');
    });

    it('forwards setAccountToUnlock and addAccounts', async () => {
      const { wrapper, inner } = createWrapper();
      const setSpy = jest
        .spyOn(inner, 'setAccountToUnlock')
        .mockImplementation();
      jest.spyOn(inner, 'addAccounts').mockResolvedValue([TEST_ADDRESSES[0]]);

      wrapper.setAccountToUnlock(7);
      const added = await wrapper.addAccounts(1);

      expect(setSpy).toHaveBeenCalledWith(7);
      expect(added).toStrictEqual([TEST_ADDRESSES[0]]);
    });

    it('defaults addAccounts to 1 when called with no argument', async () => {
      const { wrapper, inner } = createWrapper();
      const addSpy = jest
        .spyOn(inner, 'addAccounts')
        .mockResolvedValue([TEST_ADDRESSES[0]]);

      await wrapper.addAccounts();

      expect(addSpy).toHaveBeenCalledWith(1);
    });

    it('forwards page navigation methods', async () => {
      const { wrapper, inner } = createWrapper();
      const firstPage = [{ address: TEST_ADDRESSES[0], balance: null }];
      const nextPage = [{ address: TEST_ADDRESSES[1], balance: null }];
      const prevPage = [{ address: TEST_ADDRESSES[2], balance: null }];
      jest.spyOn(inner, 'getFirstPage').mockResolvedValue(firstPage);
      jest.spyOn(inner, 'getNextPage').mockResolvedValue(nextPage);
      jest.spyOn(inner, 'getPreviousPage').mockResolvedValue(prevPage);

      expect(await wrapper.getFirstPage()).toStrictEqual(firstPage);
      expect(await wrapper.getNextPage()).toStrictEqual(nextPage);
      expect(await wrapper.getPreviousPage()).toStrictEqual(prevPage);
    });

    it('forwards isUnlocked', () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'isUnlocked').mockReturnValue(true);

      expect(wrapper.isUnlocked()).toBe(true);
    });

    it('forgetDevice delegates to inner.forgetDevice and clears the registry', async () => {
      const { wrapper, inner } = createWrapper();
      jest.spyOn(inner, 'getAccounts').mockResolvedValue([TEST_ADDRESSES[0]]);
      const forgetSpy = jest.spyOn(inner, 'forgetDevice').mockImplementation();

      // Populate the registry
      await wrapper.getAccounts();

      await wrapper.forgetDevice();

      expect(forgetSpy).toHaveBeenCalled();

      // After forgetDevice + inner returning no accounts, wrapper should return empty.
      jest.spyOn(inner, 'getAccounts').mockResolvedValueOnce([]);
      expect(await wrapper.getAccounts()).toStrictEqual([]);
    });
  });
});
