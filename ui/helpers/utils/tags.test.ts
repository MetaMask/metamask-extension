import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../shared/constants/app';
import { getStartupTraceTags } from './tags';

jest.mock('../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

const STATE_EMPTY_MOCK = {
  metamask: {
    allTokens: {},
    internalAccounts: {
      accounts: {},
    },
    metamaskNotificationsList: [],
  },
};

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
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          isUnlocked: true,
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.unlocked']).toStrictEqual(true);
    });

    it('includes if not unlocked', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          isUnlocked: false,
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.unlocked']).toStrictEqual(false);
    });

    it('includes pending approval type', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          pendingApprovals: {
            1: {
              type: 'eth_sendTransaction',
            },
          },
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.pending_approval']).toStrictEqual(
        'eth_sendTransaction',
      );
    });

    it('includes first pending approval type if multiple', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          pendingApprovals: {
            1: {
              type: 'eth_sendTransaction',
            },
            2: {
              type: 'personal_sign',
            },
          },
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.pending_approval']).toStrictEqual(
        'eth_sendTransaction',
      );
    });

    it('includes account count', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          internalAccounts: {
            accounts: {
              '0x1234': {},
              '0x4321': {},
            },
          },
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.account_count']).toStrictEqual(2);
    });

    it('includes nft count', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
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
          },
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.nft_count']).toStrictEqual(5);
    });

    it('includes notification count', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          metamaskNotificationsList: [{}, {}, {}],
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.notification_count']).toStrictEqual(3);
    });

    it('includes token count', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
          allTokens: {
            '0x1': {
              '0x1234': [{}, {}],
              '0x4321': [{}],
            },
            '0x2': {
              '0x5678': [{}],
            },
          },
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.token_count']).toStrictEqual(4);
    });

    it('includes transaction count', () => {
      const state = {
        metamask: {
          ...STATE_EMPTY_MOCK.metamask,
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
          ],
        },
      };

      const tags = getStartupTraceTags(state);

      expect(tags['wallet.transaction_count']).toStrictEqual(3);
    });
  });
});
