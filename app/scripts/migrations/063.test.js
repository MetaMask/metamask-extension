import migration63 from './063';

describe('migration #63', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 62,
      },
      data: {},
    };

    const newStorage = await migration63.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 63,
    });
  });

  it('should move accountTokens data from PreferencesController to TokensController allTokens field and rotate structure from [accountAddress][chainId] to [chainId][accountAddress]', async () => {
    const oldAccountTokens = {
      '0x00000000000': {
        '0x1': [
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18,
            isERC721: false,
            symbol: 'DAI',
          },
          {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 18,
            isERC721: false,
            symbol: 'UNI',
          },
        ],
        '0x89': [
          {
            address: '0x70d1f773a9f81c852087b77f6ae6d3032b02d2ab',
            decimals: 18,
            isERC721: false,
            symbol: 'LINK',
          },
          {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6,
            isERC721: false,
            symbol: 'USDT',
          },
        ],
      },
      '0x1111111111': {
        '0x1': [
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18,
            isERC721: false,
            symbol: 'FAI',
          },
          {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 18,
            isERC721: false,
            symbol: 'PUNI',
          },
        ],
        '0x89': [
          {
            address: '0x70d1f773a9f81c852087b77f6ae6d3032b02d2ab',
            decimals: 18,
            isERC721: false,
            symbol: 'SLINK',
          },
          {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6,
            isERC721: false,
            symbol: 'USDC',
          },
        ],
      },
    };

    const expectedTokens = {
      '0x1': {
        '0x00000000000': [
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18,
            isERC721: false,
            symbol: 'DAI',
          },
          {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 18,
            isERC721: false,
            symbol: 'UNI',
          },
        ],
        '0x1111111111': [
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: 18,
            isERC721: false,
            symbol: 'FAI',
          },
          {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 18,
            isERC721: false,
            symbol: 'PUNI',
          },
        ],
      },
      '0x89': {
        '0x00000000000': [
          {
            address: '0x70d1f773a9f81c852087b77f6ae6d3032b02d2ab',
            decimals: 18,
            isERC721: false,
            symbol: 'LINK',
          },
          {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6,
            isERC721: false,
            symbol: 'USDT',
          },
        ],
        '0x1111111111': [
          {
            address: '0x70d1f773a9f81c852087b77f6ae6d3032b02d2ab',
            decimals: 18,
            isERC721: false,
            symbol: 'SLINK',
          },
          {
            address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
            decimals: 6,
            isERC721: false,
            symbol: 'USDC',
          },
        ],
      },
    };

    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          completedOnboarding: true,
          dismissSeedBackUpReminder: false,
          accountTokens: oldAccountTokens,
        },
      },
    };

    const newStorage = await migration63.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allTokens: expectedTokens,
        allIgnoredTokens: {},
      },
      PreferencesController: {
        completedOnboarding: true,
        dismissSeedBackUpReminder: false,
      },
    });
  });

  it('should move accountHiddenTokens data from PreferencesController to TokensController allIgnoredTokens field and rotate structure from [accountAddress][chainId] to [chainId][accountAddress]', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          completedOnboarding: true,
          dismissSeedBackUpReminder: false,
          accountTokens: {},
          accountHiddenTokens: {
            '0x1111111111': {
              '0x1': ['0x000000000000'],
              '0x89': ['0x11111111111'],
            },
            '0x222222': {
              '0x4': ['0x000011112222'],
            },
            '0x333333': {
              '0x5': ['0x000022223333'],
              '0x1': ['0x000033333344'],
            },
          },
        },
      },
    };

    const newStorage = await migration63.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      TokensController: {
        allTokens: {},
        allIgnoredTokens: {
          '0x1': {
            '0x1111111111': ['0x000000000000'],
            '0x333333': ['0x000033333344'],
          },
          '0x89': {
            '0x1111111111': ['0x11111111111'],
          },
          '0x4': {
            '0x222222': ['0x000011112222'],
          },
          '0x5': {
            '0x333333': ['0x000022223333'],
          },
        },
      },
      PreferencesController: {
        completedOnboarding: true,
        dismissSeedBackUpReminder: false,
      },
    });
  });

  it('should should remove all token related state from the preferences controller', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          completedOnboarding: true,
          dismissSeedBackUpReminder: false,
          accountTokens: {},
          accountHiddenTokens: {},
          tokens: {},
          hiddenTokens: {},
          assetImages: {},
          suggestedTokens: {},
        },
      },
    };

    const newStorage = await migration63.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        completedOnboarding: true,
        dismissSeedBackUpReminder: false,
      },
      TokensController: {
        allTokens: {},
        allIgnoredTokens: {},
      },
    });
  });
});
