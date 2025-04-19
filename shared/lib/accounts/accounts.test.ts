import { SnapId } from '@metamask/snaps-sdk';
import { BtcScope } from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  getNextAvailableSnapAccountName,
  getUniqueAccountName,
  SnapAccountNameOptions,
} from './accounts';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';
import { BITCOIN_WALLET_SNAP_ID } from './bitcoin-wallet-snap';

describe('accounts', () => {
  describe('getUniqueAccountName', () => {
    it('returns the suggested name if not used', () => {
      const name = getUniqueAccountName(
        [
          createMockInternalAccount({ name: 'Account 1' }),
          createMockInternalAccount({ name: 'Account 2' }),
          createMockInternalAccount({ name: 'Account 3' }),
        ],
        'Account 4',
      );

      expect(name).toBe('Account 4');
    });

    it('computes a unique name in case of conflicts', () => {
      const name = getUniqueAccountName(
        [
          createMockInternalAccount({ name: 'Account 1' }),
          createMockInternalAccount({ name: 'Account 2' }),
          createMockInternalAccount({ name: 'Account 3' }),
        ],
        'Account 1',
      );

      expect(name).toBe('Account 1 2');
    });
  });

  describe('getNextAvailableSnapAccountName', () => {
    const index = 3;
    const getNextAvailableAccountName = async () => `Snap Account ${index}`;
    const get = async (snapId: SnapId, options?: SnapAccountNameOptions) =>
      await getNextAvailableSnapAccountName(
        getNextAvailableAccountName,
        snapId,
        options,
      );

    it('returns a valid Snap account for Solana', async () => {
      expect(await get(SOLANA_WALLET_SNAP_ID)).toStrictEqual(
        `Solana Account ${index}`,
      );
    });

    it('returns a valid Snap account for Bitcoin', async () => {
      expect(await get(BITCOIN_WALLET_SNAP_ID)).toStrictEqual(
        `Bitcoin Account ${index}`,
      );
      expect(
        await get(BITCOIN_WALLET_SNAP_ID, { chainId: BtcScope.Testnet }),
      ).toStrictEqual(`Bitcoin Testnet Account ${index}`);
    });

    it('returns the same account name if Snap ID is not supported', async () => {
      expect(await get('npm:not-known' as SnapId)).toStrictEqual(
        `Snap Account ${index}`,
      );
    });
  });

  // TODO: Tests for MultichainWalletSnapClient
});
