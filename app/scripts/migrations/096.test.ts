import { CHAIN_IDS } from '../../../shared/constants/network';
import { migrate, version } from './096';

const oldVersion = 95;
describe('migration #96', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('returns the state unaltered if it has no PreferencesController property', async () => {
    const oldData = {
      some: 'data',
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if it has no NetworkController property', async () => {
    const oldData = {
      PreferencesController: 'data',
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the PreferencesController object has no featureFlags property', async () => {
    const oldData = {
      PreferencesController: 'data',
      NetworkController: 'data',
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('returns the state unaltered if the NetworkController object has no networkConfigurations property', async () => {
    const oldData = {
      PreferencesController: {
        featureFlags: {
          showIncomingTransactions: true,
        },
      },
      NetworkController: 'data',
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('rewrites PreferencesController and delete showIncomingTransactions', async () => {
    const showIncomingTransactionsValue = false;
    const networkConfigurations = {
      'network-configuration-id-1': {
        chainId: '0xa4b1',
        nickname: 'Arbitrum One',
        rpcPrefs: {
          blockExplorerUrl: 'https://explorer.arbitrum.io',
        },
        rpcUrl:
          'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
        ticker: 'ETH',
      },
      'network-configuration-id-2': {
        chainId: '0x4e454152',
        nickname: 'Aurora Mainnet',
        rpcPrefs: {
          blockExplorerUrl: 'https://aurorascan.dev/',
        },
        rpcUrl:
          'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
        ticker: 'Aurora ETH',
      },
    };
    const oldData = {
      PreferencesController: {
        featureFlags: {
          showIncomingTransactions: showIncomingTransactionsValue,
        },
      },
      NetworkController: {
        networkConfigurations,
      },
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: oldData,
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {
          featureFlags: {},
          incomingTransactionsPreferences: {
            [CHAIN_IDS.MAINNET]: showIncomingTransactionsValue,
            [CHAIN_IDS.LINEA_MAINNET]: showIncomingTransactionsValue,
            [networkConfigurations['network-configuration-id-1'].chainId]:
              showIncomingTransactionsValue,
            [networkConfigurations['network-configuration-id-2'].chainId]:
              showIncomingTransactionsValue,
            [CHAIN_IDS.GOERLI]: showIncomingTransactionsValue,
            [CHAIN_IDS.SEPOLIA]: showIncomingTransactionsValue,
            [CHAIN_IDS.LINEA_GOERLI]: showIncomingTransactionsValue,
          },
        },
        NetworkController: { networkConfigurations },
      },
    });
  });
});
