import { CHAIN_IDS, NETWORK_TYPES } from '../../../shared/constants/network';
import migration52 from './052';

const TOKEN1 = { symbol: 'TST', address: '0x10', decimals: 18 };
const TOKEN2 = { symbol: 'TXT', address: '0x11', decimals: 18 };
const TOKEN3 = { symbol: 'TVT', address: '0x12', decimals: 18 };
const TOKEN4 = { symbol: 'TAT', address: '0x13', decimals: 18 };

describe('migration #52', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 52,
      },
      data: {},
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 52,
    });
  });

  it(`should move ${NETWORK_TYPES.MAINNET} tokens and hidden tokens to be keyed by ${CHAIN_IDS.MAINNET} for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountHiddenTokens: {
            '0x1111': {
              [NETWORK_TYPES.MAINNET]: [TOKEN1],
            },
            '0x1112': {
              [NETWORK_TYPES.MAINNET]: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              [NETWORK_TYPES.MAINNET]: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              [NETWORK_TYPES.MAINNET]: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountHiddenTokens: {
          '0x1111': {
            [CHAIN_IDS.MAINNET]: [TOKEN1],
          },
          '0x1112': {
            [CHAIN_IDS.MAINNET]: [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            [CHAIN_IDS.MAINNET]: [TOKEN1, TOKEN2],
          },
          '0x1112': {
            [CHAIN_IDS.MAINNET]: [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should move rinkeby tokens and hidden tokens to be keyed by '0x4' for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountHiddenTokens: {
            '0x1111': {
              rinkeby: [TOKEN1],
            },
            '0x1112': {
              rinkeby: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              rinkeby: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              rinkeby: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountHiddenTokens: {
          '0x1111': {
            '0x4': [TOKEN1],
          },
          '0x1112': {
            '0x4': [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            '0x4': [TOKEN1, TOKEN2],
          },
          '0x1112': {
            '0x4': [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should move kovan tokens and hidden tokens to be keyed by 0x2a for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountHiddenTokens: {
            '0x1111': {
              kovan: [TOKEN1],
            },
            '0x1112': {
              kovan: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              kovan: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              kovan: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountHiddenTokens: {
          '0x1111': {
            '0x2a': [TOKEN1],
          },
          '0x1112': {
            '0x2a': [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            '0x2a': [TOKEN1, TOKEN2],
          },
          '0x1112': {
            '0x2a': [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should move ${NETWORK_TYPES.GOERLI} tokens and hidden tokens to be keyed by ${CHAIN_IDS.GOERLI} for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountHiddenTokens: {
            '0x1111': {
              [NETWORK_TYPES.GOERLI]: [TOKEN1],
            },
            '0x1112': {
              [NETWORK_TYPES.GOERLI]: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              [NETWORK_TYPES.GOERLI]: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              [NETWORK_TYPES.GOERLI]: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountHiddenTokens: {
          '0x1111': {
            [CHAIN_IDS.GOERLI]: [TOKEN1],
          },
          '0x1112': {
            [CHAIN_IDS.GOERLI]: [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            [CHAIN_IDS.GOERLI]: [TOKEN1, TOKEN2],
          },
          '0x1112': {
            [CHAIN_IDS.GOERLI]: [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should move ropsten tokens and hidden tokens to be keyed by 0x3 for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          accountHiddenTokens: {
            '0x1111': {
              ropsten: [TOKEN1],
            },
            '0x1112': {
              ropsten: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              ropsten: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              ropsten: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        accountHiddenTokens: {
          '0x1111': {
            '0x3': [TOKEN1],
          },
          '0x1112': {
            '0x3': [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            '0x3': [TOKEN1, TOKEN2],
          },
          '0x1112': {
            '0x3': [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should duplicate ${NETWORK_TYPES.RPC} tokens and hidden tokens to all custom networks for each address`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          frequentRpcListDetail: [
            { chainId: '0xab' },
            { chainId: '0x12' },
            { chainId: '0xfa' },
          ],
          accountHiddenTokens: {
            '0x1111': {
              [NETWORK_TYPES.RPC]: [TOKEN1],
            },
            '0x1112': {
              [NETWORK_TYPES.RPC]: [TOKEN3],
            },
          },
          accountTokens: {
            '0x1111': {
              [NETWORK_TYPES.RPC]: [TOKEN1, TOKEN2],
            },
            '0x1112': {
              [NETWORK_TYPES.RPC]: [TOKEN1, TOKEN3],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        frequentRpcListDetail: [
          { chainId: '0xab' },
          { chainId: '0x12' },
          { chainId: '0xfa' },
        ],
        accountHiddenTokens: {
          '0x1111': {
            '0xab': [TOKEN1],
            '0x12': [TOKEN1],
            '0xfa': [TOKEN1],
          },
          '0x1112': {
            '0xab': [TOKEN3],
            '0x12': [TOKEN3],
            '0xfa': [TOKEN3],
          },
        },
        accountTokens: {
          '0x1111': {
            '0xab': [TOKEN1, TOKEN2],
            '0x12': [TOKEN1, TOKEN2],
            '0xfa': [TOKEN1, TOKEN2],
          },
          '0x1112': {
            '0xab': [TOKEN1, TOKEN3],
            '0x12': [TOKEN1, TOKEN3],
            '0xfa': [TOKEN1, TOKEN3],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it(`should overwrite ${NETWORK_TYPES.RPC} tokens with built in networks if chainIds match`, async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          frequentRpcListDetail: [{ chainId: '0x1' }],
          accountHiddenTokens: {
            '0x1111': {
              [NETWORK_TYPES.RPC]: [TOKEN3],
              [NETWORK_TYPES.MAINNET]: [TOKEN1],
            },
          },
          accountTokens: {
            '0x1111': {
              [NETWORK_TYPES.RPC]: [TOKEN1, TOKEN2],
              [NETWORK_TYPES.MAINNET]: [TOKEN3, TOKEN4],
            },
          },
          bar: 'baz',
        },
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        frequentRpcListDetail: [{ chainId: '0x1' }],
        accountHiddenTokens: {
          '0x1111': {
            '0x1': [TOKEN1],
          },
        },
        accountTokens: {
          '0x1111': {
            '0x1': [TOKEN3, TOKEN4],
          },
        },
        bar: 'baz',
      },
      foo: 'bar',
    });
  });

  it('should do nothing if no PreferencesController key', async () => {
    const oldStorage = {
      meta: {},
      data: {
        foo: 'bar',
      },
    };

    const newStorage = await migration52.migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      foo: 'bar',
    });
  });
});
