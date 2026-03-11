import { KeyringTypes } from '@metamask/keyring-controller';
import type { HdKeyring } from '@metamask/eth-hd-keyring';
import type { RootMessenger } from '../../../lib/messenger';
import { getMnemonic, getMnemonicSeed } from './utils';

describe('snaps utils', () => {
  describe('getMnemonic', () => {
    it('handles undefined keyring gracefully for primary keyring', async () => {
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({ keyring: undefined });
            },
          ),
      } as unknown as RootMessenger;

      await expect(getMnemonic(mockMessenger, undefined)).rejects.toThrow(
        'Primary keyring mnemonic unavailable.',
      );

      expect(mockMessenger.call).toHaveBeenCalledWith(
        'KeyringController:withKeyring',
        {
          type: KeyringTypes.hd,
          index: 0,
        },
        expect.any(Function),
      );
    });

    it('returns mnemonic when keyring is defined', async () => {
      const mockMnemonic = new Uint8Array([1, 2, 3]);
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({
                keyring: { mnemonic: mockMnemonic } as HdKeyring,
              });
            },
          ),
      } as unknown as RootMessenger;

      const result = await getMnemonic(mockMessenger, undefined);

      expect(result).toBe(mockMnemonic);
    });

    it('handles undefined keyring gracefully for source keyring', async () => {
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({ keyring: undefined });
            },
          ),
      } as unknown as RootMessenger;

      await expect(
        getMnemonic(mockMessenger, 'test-source-id'),
      ).rejects.toThrow('Entropy source with ID "test-source-id" not found.');
    });
  });

  describe('getMnemonicSeed', () => {
    it('handles undefined keyring gracefully for primary keyring', async () => {
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({ keyring: undefined });
            },
          ),
      } as unknown as RootMessenger;

      await expect(getMnemonicSeed(mockMessenger, undefined)).rejects.toThrow(
        'Primary keyring mnemonic unavailable.',
      );

      expect(mockMessenger.call).toHaveBeenCalledWith(
        'KeyringController:withKeyring',
        {
          type: KeyringTypes.hd,
          index: 0,
        },
        expect.any(Function),
      );
    });

    it('returns seed when keyring is defined', async () => {
      const mockSeed = new Uint8Array([4, 5, 6]);
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({ keyring: { seed: mockSeed } as HdKeyring });
            },
          ),
      } as unknown as RootMessenger;

      const result = await getMnemonicSeed(mockMessenger, undefined);

      expect(result).toBe(mockSeed);
    });

    it('handles undefined keyring gracefully for source keyring', async () => {
      const mockMessenger = {
        call: jest
          .fn()
          .mockImplementation(
            async (
              _action: string,
              _options: unknown,
              callback: (args: { keyring: HdKeyring | undefined }) => unknown,
            ) => {
              return callback({ keyring: undefined });
            },
          ),
      } as unknown as RootMessenger;

      await expect(
        getMnemonicSeed(mockMessenger, 'test-source-id'),
      ).rejects.toThrow('Entropy source with ID "test-source-id" not found.');
    });
  });
});
