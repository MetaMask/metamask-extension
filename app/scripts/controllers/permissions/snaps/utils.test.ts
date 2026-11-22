import { KeyringType } from '@metamask/keyring-api/v2';
import { getMnemonicSeed } from './utils';

const SEED = new Uint8Array([1, 2, 3, 4]);

function buildMessenger(callImpl: (...args: unknown[]) => unknown) {
  return {
    call: jest.fn(callImpl),
  } as unknown as Parameters<typeof getMnemonicSeed>[0];
}

describe('getMnemonicSeed', () => {
  describe('without a source', () => {
    it('returns the primary HD keyring seed via the V2 unsafe type selector', async () => {
      const messenger = buildMessenger(async (_action, selector, operation) => {
        expect(selector).toStrictEqual({
          type: KeyringType.Hd,
          index: 0,
        });
        return (
          operation as (args: { keyring: { seed: Uint8Array } }) => unknown
        )({
          keyring: { seed: SEED },
        });
      });

      await expect(getMnemonicSeed(messenger)).resolves.toBe(SEED);
      expect(messenger.call).toHaveBeenCalledWith(
        'KeyringController:withKeyringV2Unsafe',
        expect.any(Object),
        expect.any(Function),
      );
    });

    it('throws when the primary keyring has no seed', async () => {
      const messenger = buildMessenger(async () => null);

      await expect(getMnemonicSeed(messenger)).rejects.toThrow(
        'Primary keyring mnemonic unavailable.',
      );
    });
  });

  describe('with a source id', () => {
    it('returns the seed for an HD keyring matched by id', async () => {
      const messenger = buildMessenger(async (_action, selector, operation) => {
        expect(selector).toStrictEqual({ id: 'keyring-id' });
        return (
          operation as (args: {
            keyring: { type: string; seed: Uint8Array };
          }) => unknown
        )({
          keyring: { type: KeyringType.Hd, seed: SEED },
        });
      });

      await expect(getMnemonicSeed(messenger, 'keyring-id')).resolves.toBe(
        SEED,
      );
    });

    it('throws when the keyring is not an HD keyring', async () => {
      const messenger = buildMessenger(async (_action, _selector, operation) =>
        (
          operation as (args: {
            keyring: { type: string; seed?: Uint8Array };
          }) => unknown
        )({
          keyring: { type: 'Ledger Hardware' },
        }),
      );

      await expect(getMnemonicSeed(messenger, 'keyring-id')).rejects.toThrow(
        'Entropy source with ID "keyring-id" not found.',
      );
    });

    it('throws when the messenger call rejects', async () => {
      const messenger = buildMessenger(async () => {
        throw new Error('messenger boom');
      });

      await expect(getMnemonicSeed(messenger, 'keyring-id')).rejects.toThrow(
        'Entropy source with ID "keyring-id" not found.',
      );
    });
  });
});
