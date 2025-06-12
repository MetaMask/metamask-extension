import { getMetaMaskAccountsById } from '..';
import mockState from '../../../test/data/mock-state.json';
import {
  getAccountTree,
  getWalletsWithAccounts,
} from './multichain-accounts-selectors';
import { MultichainAccountsState } from './multichain-accounts-selectors.types';

describe('Multichain Accounts Selectors', () => {
  describe('getAccountTree', () => {
    it('returns the account tree', () => {
      const result = getAccountTree(mockState as MultichainAccountsState);

      expect(result).toStrictEqual(mockState.metamask.accountTree);
    });
  });

  describe('getWalletsWithAccounts', () => {
    it('returns wallets with accounts and their metadata', () => {
      const result = getWalletsWithAccounts(mockState);
      const accounts = getMetaMaskAccountsById(mockState);

      expect(result).toStrictEqual({
        '01JKAF3DSGM3AB87EM9N0K41AJ': {
          groups: {
            '01JKAF3DSGM3AB87EM9N0K41AJ:default': {
              accounts: [
                accounts['cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'],
                accounts['07c2cfec-36c9-46c4-8115-3836d3ac9047'],
              ],
              id: '01JKAF3DSGM3AB87EM9N0K41AJ:default',
              metadata: {
                name: 'Default',
              },
            },
          },
          id: '01JKAF3DSGM3AB87EM9N0K41AJ',
          metadata: {
            name: 'Wallet 1',
          },
        },
        '01JKAF3PJ247KAM6C03G5Q0NP8': {
          groups: {
            '01JKAF3PJ247KAM6C03G5Q0NP8:default': {
              accounts: [
                accounts['784225f4-d30b-4e77-a900-c8bbce735b88'],
              ],
              id: '01JKAF3PJ247KAM6C03G5Q0NP8:default',
              metadata: {
                name: 'Default',
              },
            },
          },
          id: '01JKAF3PJ247KAM6C03G5Q0NP8',
          metadata: {
            name: 'Wallet 2',
          },
        },
        'local:custody:test': {
          groups: {
            'local:custody:test:default': {
              accounts: [
                accounts['694225f4-d30b-4e77-a900-c8bbce735b42'],
              ],
              id: 'local:custody:test:default',
              metadata: {
                name: 'Default',
              },
            },
          },
          id: 'local:custody:test',
          metadata: {
            name: 'Custody test',
          },
        },
        'local:hardware:ledger': {
          groups: {
            'local:hardware:ledger:default': {
              accounts: [
                accounts['15e69915-2a1a-4019-93b3-916e11fd432f'],
              ],
              id: 'local:hardware:ledger:default',
              metadata: {
                name: 'Default',
              },
            },
          },
          id: 'local:hardware:ledger',
          metadata: {
            name: 'Ledger Hardware',
          },
        },
        'local:snap-id': {
          groups: {
            'local:snap-id:default': {
              accounts: [
                accounts['c3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3'],
              ],
              id: 'local:snap-id:default',
              metadata: {
                name: 'Default',
              },
            },
          },
          id: 'local:snap-id',
          metadata: {
            name: 'Snap: snap-name',
          },
        },
      });
    });
  });
});
