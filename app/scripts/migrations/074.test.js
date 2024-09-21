import migration74 from './074';

describe('migration #74', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {},
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 74,
    });
  });

  it('should add a deprecated testnet to custom networks if that network is currently selected and modify the provider', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x4',
            type: 'rinkeby',
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x4',
            type: 'rpc',
            rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            nickname: 'Rinkeby',
            ticker: 'RinkebyETH',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x4',
              nickname: 'Rinkeby',
              ticker: 'RinkebyETH',
              rpcPrefs: {},
            },
          ],
        },
      },
    });
  });

  it('should not add a deprecated testnet to custom networks if no deprecated testnet is selected', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
      },
    });
  });

  it('should add a deprecated testnet to custom networks if a transaction has been sent from that network', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
            2: {
              chainId: '0x4',
            },
            3: {
              chainId: '0xabc',
            },
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x4',
              nickname: 'Rinkeby',
              ticker: 'RinkebyETH',
              rpcPrefs: {},
            },
            {
              rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x3',
              nickname: 'Ropsten',
              ticker: 'RopstenETH',
              rpcPrefs: {},
            },
          ],
          preferences: {
            showTestNetworks: true,
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
            2: {
              chainId: '0x4',
            },
            3: {
              chainId: '0xabc',
            },
          },
        },
      },
    });
  });

  it('should add a deprecated testnet to custom networks if there is balance on that network', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x2a': {
              '0x123456789': '0x1',
            },
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x2a',
              nickname: 'Kovan',
              ticker: 'KovanETH',
              rpcPrefs: {},
            },
          ],
          preferences: {
            showTestNetworks: true,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x2a': {
              '0x123456789': '0x1',
            },
          },
        },
      },
    });
  });

  it('should add all three deprecated testnets to custom networks if each has a different reason for being added', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x2a',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            chainId: '0x2a',
            nickname: 'Kovan',
            ticker: 'KovanETH',
            type: 'rpc',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x2a',
              nickname: 'Kovan',
              ticker: 'KovanETH',
              rpcPrefs: {},
            },
            {
              rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x3',
              nickname: 'Ropsten',
              ticker: 'RopstenETH',
              rpcPrefs: {},
            },
            {
              rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x4',
              nickname: 'Rinkeby',
              ticker: 'RinkebyETH',
              rpcPrefs: {},
            },
          ],
          preferences: {
            showTestNetworks: true,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
      },
    });
  });

  it('should not add deprecated testnets to custom networks if none is selected and showTestNetworks is false', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: false,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
      },
    });
  });

  it('should not alter or remove existing custom networks when no deprecated testnets are being added', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://example.com`,
              chainId: '0xdef',
              ticker: 'ETH',
              nickname: 'Kovan',
              rpcPrefs: {},
            },
          ],
          preferences: {
            showTestNetworks: false,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0xabc',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://example.com`,
              chainId: '0xdef',
              ticker: 'ETH',
              nickname: 'Kovan',
              rpcPrefs: {},
            },
          ],
          preferences: {
            showTestNetworks: false,
          },
        },
        CachedBalancesController: {
          cachedBalances: {
            '0x4': {
              '0x123456789': '0x1',
            },
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
      },
    });
  });

  it('should not modify an existing custom network with the same chainId as a deprecated testnet', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
          frequentRpcListDetail: [
            {
              rpcUrl: `https://example.com`,
              chainId: '0x3',
              ticker: 'ETH',
              nickname: 'Ropsten',
              rpcPrefs: {},
            },
          ],
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x1',
          },
        },
        TransactionController: {
          transactions: {
            1: {
              chainId: '0x3',
            },
          },
        },
        PreferencesController: {
          preferences: {
            showTestNetworks: true,
          },
          frequentRpcListDetail: [
            {
              rpcUrl: `https://example.com`,
              chainId: '0x3',
              ticker: 'ETH',
              nickname: 'Ropsten',
              rpcPrefs: {},
            },
          ],
        },
      },
    });
  });
});
