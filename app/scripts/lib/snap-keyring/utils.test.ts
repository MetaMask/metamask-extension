import { KeyringType } from '@metamask/keyring-api/v2';
import { SnapId } from '@metamask/snaps-sdk';
import { getAccountsBySnapId } from './utils';

const mockSnapId = 'local:http://localhost:8080' as SnapId;
const mockOtherSnapId = 'local:http://localhost:8081' as SnapId;

type WithKeyringOptions = {
  filter: (keyring: unknown) => boolean;
};

type WithKeyringOperation = (args: { keyring: unknown }) => Promise<string[]>;

function buildMessenger(callImpl: (...args: unknown[]) => unknown) {
  return {
    call: jest.fn(callImpl),
  } as unknown as Parameters<typeof getAccountsBySnapId>[0];
}

describe('getAccountsBySnapId', () => {
  it('returns account addresses from the Snap keyring matching the Snap ID', async () => {
    const matchingKeyring = {
      type: KeyringType.Snap,
      snapId: mockSnapId,
      getAccounts: jest
        .fn()
        .mockResolvedValue([{ address: '0x123' }, { address: '0x456' }]),
    };
    const otherSnapKeyring = {
      type: KeyringType.Snap,
      snapId: mockOtherSnapId,
      getAccounts: jest.fn(),
    };
    const nonSnapKeyring = {
      type: KeyringType.Hd,
      snapId: mockSnapId,
      getAccounts: jest.fn(),
    };

    const messenger = buildMessenger(async (action, selector, operation) => {
      expect(action).toBe('KeyringController:withKeyringV2');

      const { filter } = selector as WithKeyringOptions;
      expect(filter(matchingKeyring)).toBe(true);
      expect(filter(otherSnapKeyring)).toBe(false);
      expect(filter(nonSnapKeyring)).toBe(false);

      return (operation as WithKeyringOperation)({
        keyring: matchingKeyring,
      });
    });

    await expect(
      getAccountsBySnapId(messenger, mockSnapId),
    ).resolves.toStrictEqual(['0x123', '0x456']);

    expect(messenger.call).toHaveBeenCalledWith(
      'KeyringController:withKeyringV2',
      expect.objectContaining({ filter: expect.any(Function) }),
      expect.any(Function),
    );
    expect(matchingKeyring.getAccounts).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when the operation receives a non-Snap keyring', async () => {
    const getAccounts = jest.fn();
    const nonSnapKeyring = {
      type: KeyringType.Hd,
      snapId: mockSnapId,
      getAccounts,
    };

    const messenger = buildMessenger(async (_action, _selector, operation) =>
      (operation as WithKeyringOperation)({
        keyring: nonSnapKeyring,
      }),
    );

    await expect(
      getAccountsBySnapId(messenger, mockSnapId),
    ).resolves.toStrictEqual([]);
    expect(getAccounts).not.toHaveBeenCalled();
  });

  it('returns an empty array when no keyring matches the Snap ID', async () => {
    const messenger = buildMessenger(async () => {
      throw new Error('No keyring found');
    });

    await expect(
      getAccountsBySnapId(messenger, mockSnapId),
    ).resolves.toStrictEqual([]);
  });
});
