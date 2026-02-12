import { cloneDeep } from 'lodash';
import { migrate, version } from './121.2';

const oldVersion = 121.1;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Does nothing if `networkConfigurations` or `providerConfig` are not in the network controller state', async () => {
    const oldState = {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Updates MATIC ticker to POL and updates imageURL in networkConfigurations', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'MATIC',
            rpcPrefs: {
              imageUrl: './images/matic-token.svg',
            },
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'POL',
            rpcPrefs: {
              imageUrl: './images/pol-token.svg',
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });

  it('Does not update ticker to POL if ticker is not MATIC, but still updates imageURL in networkConfigurations', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'NOT_MATIC',
            rpcPrefs: {
              imageUrl: './images/matic-token.svg',
            },
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'NOT_MATIC',
            rpcPrefs: {
              imageUrl: './images/pol-token.svg',
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });

  it('Does not update tickers for other network configurations, updates only ticker and imageURL for chain 0x89', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'MATIC',
            rpcPrefs: {
              imageUrl: './images/matic-token.svg',
            },
          },
          '0x1': {
            chainId: '0x1',
            ticker: 'ETH',
            rpcPrefs: {
              imageUrl: './images/eth-token.svg',
            },
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        networkConfigurations: {
          '0x89': {
            chainId: '0x89',
            ticker: 'POL',
            rpcPrefs: {
              imageUrl: './images/pol-token.svg',
            },
          },
          '0x1': {
            chainId: '0x1',
            ticker: 'ETH',
            rpcPrefs: {
              imageUrl: './images/eth-token.svg',
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });

  it('Does nothing if Polygon ChainId (0x89) is not in networkConfigurations', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          '0x1': {
            chainId: '0x1',
            ticker: 'ETH',
            rpcPrefs: {
              imageUrl: './images/eth-token.svg',
            },
          },
          '0x2a': {
            chainId: '0x2a',
            ticker: 'KOVAN',
            rpcPrefs: {
              imageUrl: './images/kovan-token.svg',
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Updates Polygon ChainId (0x89) in ProviderConfig if exists, and ticker is set to MATIC, and updates imageUrl', async () => {
    const oldState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x89',
          ticker: 'MATIC',
          rpcPrefs: {
            imageUrl: './images/matic-token.svg',
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x89',
          ticker: 'POL',
          rpcPrefs: {
            imageUrl: './images/pol-token.svg',
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });

  it('Does nothing if Polygon ChainId (0x89) is not in providerConfig', async () => {
    const oldState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x1',
          ticker: 'ETH',
          rpcPrefs: {
            imageUrl: './images/eth-token.svg',
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Does not update ticker if Polygon ChainId (0x89) is in providerConfig, but ticker is not MATIC, but still updates imageUrl', async () => {
    const oldState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x89',
          ticker: 'NOT_MATIC',
          rpcPrefs: {
            imageUrl: './images/matic-token.svg',
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        providerConfig: {
          chainId: '0x89',
          ticker: 'NOT_MATIC',
          rpcPrefs: {
            imageUrl: './images/pol-token.svg',
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toStrictEqual(expectedState);
  });
});
