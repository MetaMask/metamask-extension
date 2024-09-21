import { TEST_CHAINS } from '../../../shared/constants/network';
import migration67 from './067';

describe('migration #67', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 66,
      },
      data: {},
    };

    const newStorage = await migration67.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 67,
    });
  });

  it('should set showTestNetworks to true if the user is currently on a test network', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        NetworkController: {
          provider: {
            chainId: TEST_CHAINS[0],
          },
        },
      },
    };

    const newStorage = await migration67.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.preferences.showTestNetworks,
    ).toBe(true);
  });

  it('should set showTestNetworks to true if there is a transaction on a test network in state', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        NetworkController: {
          provider: {
            chainId: 'not a test net',
          },
        },
        TransactionController: {
          transactions: {
            abc123: {
              chainId: TEST_CHAINS[0],
            },
          },
        },
      },
    };

    const newStorage = await migration67.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.preferences.showTestNetworks,
    ).toBe(true);
  });

  it('should set showTestNetworks to true if the user has a cached balance on a test network', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        NetworkController: {
          provider: {
            chainId: 'not a test net',
          },
        },
        TransactionController: {
          transactions: {
            abc123: {
              chainId: 'not a test net',
            },
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x1': {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
            [TEST_CHAINS[0]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x1',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
            [TEST_CHAINS[1]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
          },
        },
      },
    };

    const newStorage = await migration67.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.preferences.showTestNetworks,
    ).toBe(true);
  });

  it('should leave showTestNetworks false if there is no evidence of test network usage', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        NetworkController: {
          provider: {
            chainId: 'not a test net',
          },
        },
        TransactionController: {
          transactions: {
            abc123: {
              chainId: 'not a test net',
            },
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x1': {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x10',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x20',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x30',
            },
            [TEST_CHAINS[0]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
            [TEST_CHAINS[1]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
          },
        },
      },
    };
    const newStorage = await migration67.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.preferences.showTestNetworks,
    ).toBe(false);
  });

  it('should leave showTestNetworks true if it was true but there is no evidence of test network usage', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
        NetworkController: {
          provider: {
            chainId: 'not a test net',
          },
        },
        TransactionController: {
          transactions: {
            abc123: {
              chainId: 'not a test net',
            },
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x1': {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x10',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x20',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x30',
            },
            [TEST_CHAINS[0]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
            [TEST_CHAINS[1]]: {
              '0x027d4ae98b79d0c52918bab4c3170bea701fb8ab': '0x0',
              '0x2f318c334780961fb129d2a6c30d0763d9a5c970': '0x0',
              '0x7a46ce51fbbb29c34aea1fe9833c27b5d2781925': '0x0',
            },
          },
        },
      },
    };

    const newStorage = await migration67.migrate(oldStorage);
    expect(
      newStorage.data.PreferencesController.preferences.showTestNetworks,
    ).toBe(true);
  });
});
