import { cloneDeep } from 'lodash';
import { migrate, version } from './175';

const oldVersion = 174;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Does nothing if `networkConfigurationsByChainId` is not in the network controller state', async () => {
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

  it('Updates nativeCurrency to FRAX for the FRAX mainnet and FRAX Testnet in networkConfigurationsByChainId', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurationsByChainId: {
          '0xfc': {
            chainId: '0xfc',
            nativeCurrency: 'frxETH',
          },
          '0x9da': {
            chainId: '0x9da',
            nativeCurrency: 'frxETH',
          },
        },
      },
    };

    const expectedState = {
      NetworkController: {
        networkConfigurationsByChainId: {
          '0xfc': {
            chainId: '0xfc',
            nativeCurrency: 'FRAX',
          },
          '0x9da': {
            chainId: '0x9da',
            nativeCurrency: 'FRAX',
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
  it('Does nothing if ChainId (0x9da or 0xfc) is not in networkConfigurationsByChainId', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            nativeCurrency: 'ETH',
          },
          '0x2a': {
            chainId: '0x2a',
            nativeCurrency: 'KOVAN',
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
});
