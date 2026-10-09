import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../shared/constants/app';
import { MetaMaskReduxState } from '../../store/store';
import { getStartupTraceTags } from './tags';

jest.mock('../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

const STATE_EMPTY_MOCK = {
  metamask: {
    assetsInfo: {},
    assetsBalance: {},
    customAssets: {},
    internalAccounts: {
      accounts: {},
    },
    metamaskNotificationsList: [],
  },
} as unknown as MetaMaskReduxState;

function createMockState(
  // AssetsController fields used below are not yet on FlattenedBackgroundStateProxy.
  metamaskState: Partial<MetaMaskReduxState['metamask']> &
    Record<string, unknown>,
): MetaMaskReduxState {
  return {
    ...STATE_EMPTY_MOCK,
    metamask: {
      ...STATE_EMPTY_MOCK.metamask,
      ...metamaskState,
    },
  };
}

describe('Tags Utils', () => {
  const getEnvironmentTypeMock = jest.mocked(getEnvironmentType);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getStartupTraceTags', () => {
    it('includes UI type', () => {
      getEnvironmentTypeMock.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

      const tags = getStartupTraceTags(STATE_EMPTY_MOCK);

      expect(tags['wallet.ui_type']).toStrictEqual(ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('includes if unlocked', () => {
      const state = createMockState({ isUnlocked: true });
      const tags = getStartupTraceTags(state);

      expect(tags['wallet.unlocked']).toStrictEqual(true);
    });

    it('includes if not unlocked', () => {
      const state = createMockState({ isUnlocked: false });
      const tags = getStartupTraceTags(state);

      expect(tags['wallet.unlocked']).toStrictEqual(false);
    });

    it('includes pending approval type', () => {
      const state = createMockState({
        pendingApprovals: {
          1: {
            type: 'eth_sendTransaction',
          },
        } as unknown as MetaMaskReduxState['metamask']['pendingApprovals'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.pending_approval']).toStrictEqual(
        'eth_sendTransaction',
      );
    });

    it('includes first pending approval type if multiple', () => {
      const state = createMockState({
        pendingApprovals: {
          1: {
            type: 'eth_sendTransaction',
          },
          2: {
            type: 'personal_sign',
          },
        } as unknown as MetaMaskReduxState['metamask']['pendingApprovals'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.pending_approval']).toStrictEqual(
        'eth_sendTransaction',
      );
    });

    it('includes account count', () => {
      const state = createMockState({
        internalAccounts: {
          accounts: {
            '0x1234': {},
            '0x4321': {},
          },
        } as unknown as MetaMaskReduxState['metamask']['internalAccounts'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.account_count']).toStrictEqual(2);
    });

    it('includes nft count', () => {
      const state = createMockState({
        allNfts: {
          '0x1234': {
            '0x1': [
              {
                tokenId: '1',
              },
              {
                tokenId: '2',
              },
            ],
            '0x2': [
              {
                tokenId: '3',
              },
              {
                tokenId: '4',
              },
            ],
          },
          '0x4321': {
            '0x3': [
              {
                tokenId: '5',
              },
            ],
          },
        } as unknown as MetaMaskReduxState['metamask']['allNfts'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.nft_count']).toStrictEqual(5);
    });

    it('includes notification count', () => {
      const state = createMockState({
        metamaskNotificationsList: [
          {},
          {},
          {},
        ] as unknown as MetaMaskReduxState['metamask']['metamaskNotificationsList'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.notification_count']).toStrictEqual(3);
    });

    it('includes token count', () => {
      const account1 = 'account-1';
      const account2 = 'account-2';
      const account3 = 'account-3';
      const tokenIds = [
        'eip155:1/erc20:0x0000000000000000000000000000000000000001',
        'eip155:1/erc20:0x0000000000000000000000000000000000000002',
        'eip155:1/erc20:0x0000000000000000000000000000000000000003',
        'eip155:2/erc20:0x0000000000000000000000000000000000000004',
      ] as const;

      const state = createMockState({
        internalAccounts: {
          accounts: {
            [account1]: {
              id: account1,
              address: '0x1234',
              type: 'eip155:eoa',
            },
            [account2]: {
              id: account2,
              address: '0x4321',
              type: 'eip155:eoa',
            },
            [account3]: {
              id: account3,
              address: '0x5678',
              type: 'eip155:eoa',
            },
          },
        } as unknown as MetaMaskReduxState['metamask']['internalAccounts'],
        assetsInfo: {
          [tokenIds[0]]: {
            type: 'erc20',
            name: 'Token 1',
            symbol: 'T1',
            decimals: 18,
          },
          [tokenIds[1]]: {
            type: 'erc20',
            name: 'Token 2',
            symbol: 'T2',
            decimals: 18,
          },
          [tokenIds[2]]: {
            type: 'erc20',
            name: 'Token 3',
            symbol: 'T3',
            decimals: 18,
          },
          [tokenIds[3]]: {
            type: 'erc20',
            name: 'Token 4',
            symbol: 'T4',
            decimals: 18,
          },
        },
        customAssets: {
          [account1]: [tokenIds[0], tokenIds[1]],
          [account2]: [tokenIds[2]],
          [account3]: [tokenIds[3]],
        },
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.token_count']).toStrictEqual(4);
    });

    it('includes transaction count', () => {
      const state = createMockState({
        transactions: [
          {
            id: 1,
            chainId: '0x1',
          },
          {
            id: 2,
            chainId: '0x1',
          },
          {
            id: 3,
            chainId: '0x2',
          },
        ] as unknown as MetaMaskReduxState['metamask']['transactions'],
      });

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.transaction_count']).toStrictEqual(3);
    });
  });
});
