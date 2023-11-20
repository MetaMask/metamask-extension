import { v4 } from 'uuid';
import { migrate, version } from './082';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #82', () => {
  beforeEach(() => {
    v4.mockImplementationOnce(() => 'network-configuration-id-1')
      .mockImplementationOnce(() => 'network-configuration-id-2')
      .mockImplementationOnce(() => 'network-configuration-id-3')
      .mockImplementationOnce(() => 'network-configuration-id-4');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should migrate the network configurations from an array on the PreferencesController to an object on the NetworkController', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            {
              chainId: '0x4e454152',
              nickname: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            {
              chainId: '0x38',
              nickname:
                'BNB Smart Chain (previously Binance Smart Chain Mainnet)',
              rpcPrefs: {
                blockExplorerUrl: 'https://bscscan.com/',
              },
              rpcUrl: 'https://bsc-dataseed.binance.org/',
              ticker: 'BNB',
            },
          ],
        },
        NetworkController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {},
        NetworkController: {
          networkConfigurations: {
            'network-configuration-id-1': {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'network-configuration-id-2': {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'network-configuration-id-3': {
              chainId: '0x4e454152',
              nickname: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'network-configuration-id-4': {
              chainId: '0x38',
              nickname:
                'BNB Smart Chain (previously Binance Smart Chain Mainnet)',
              rpcPrefs: {
                blockExplorerUrl: 'https://bscscan.com/',
              },
              rpcUrl: 'https://bsc-dataseed.binance.org/',
              ticker: 'BNB',
            },
          },
        },
      },
    });
  });

  it('should not change data other than removing `frequentRpcListDetail` and adding `networkConfigurations` on the PreferencesController and NetworkController respectively', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            {
              chainId: '0x4e454152',
              nickname: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            {
              chainId: '0x38',
              nickname:
                'BNB Smart Chain (previously Binance Smart Chain Mainnet)',
              rpcPrefs: {
                blockExplorerUrl: 'https://bscscan.com/',
              },
              rpcUrl: 'https://bsc-dataseed.binance.org/',
              ticker: 'BNB',
            },
          ],
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
          networkConfigurations: {
            'network-configuration-id-1': {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'network-configuration-id-2': {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'network-configuration-id-3': {
              chainId: '0x4e454152',
              nickname: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'network-configuration-id-4': {
              chainId: '0x38',
              nickname:
                'BNB Smart Chain (previously Binance Smart Chain Mainnet)',
              rpcPrefs: {
                blockExplorerUrl: 'https://bscscan.com/',
              },
              rpcUrl: 'https://bsc-dataseed.binance.org/',
              ticker: 'BNB',
            },
          },
        },
      },
    });
  });

  it('should migrate the network configurations from an array on the PreferencesController to an object on the NetworkController and not include any properties on the frequentRpcListDetail objects that are not included in the list: [chainId, nickname, rpcPrefs, rpcUrl, ticker]', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              invalidKey: 'invalidKey',
              anotherInvalidKey: 'anotherInvalidKey',
            },
            {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
              randomInvalidKey: 'randomInvalidKey',
              randomInvalidKey2: 'randomInvalidKey2',
            },
          ],
        },
        NetworkController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {},
        NetworkController: {
          networkConfigurations: {
            'network-configuration-id-1': {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'network-configuration-id-2': {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
          },
        },
      },
    });
  });

  it('should migrate the network configurations from an array on the PreferencesController to an object on the NetworkController even if frequentRpcListDetail entries do not include all members of list [chainId, nickname, rpcPrefs, rpcUrl, ticker]', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            {
              chainId: '0xa4b1',
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
          ],
        },
        NetworkController: {},
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version,
      },
      data: {
        PreferencesController: {},
        NetworkController: {
          networkConfigurations: {
            'network-configuration-id-1': {
              chainId: '0x539',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              nickname: undefined,
              rpcPrefs: undefined,
            },
            'network-configuration-id-2': {
              chainId: '0xa4b1',
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
              nickname: undefined,
              rpcPrefs: undefined,
            },
          },
        },
      },
    });
  });

  it('should not change anything if any PreferencesController.frequentRpcListDetail entries are not objects', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'invalid entry type',
            1,
          ],
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalled();
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should capture an exception if any PreferencesController.frequentRpcListDetail entries are not objects', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
          frequentRpcListDetail: [
            {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'invalid entry type',
            1,
          ],
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
      },
    };
    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `state.PreferencesController.frequentRpcListDetail contains an element of type string`,
      ),
    );
  });

  it('should not change anything, and not capture an exception, if there is no frequentRpcListDetail property on PreferencesController but there is a networkConfigurations object', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
          networkConfigurations: {
            'network-configuration-id-1': {
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'network-configuration-id-2': {
              chainId: '0xa4b1',
              nickname: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'network-configuration-id-3': {
              chainId: '0x4e454152',
              nickname: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'network-configuration-id-4': {
              chainId: '0x38',
              nickname:
                'BNB Smart Chain (previously Binance Smart Chain Mainnet)',
              rpcPrefs: {
                blockExplorerUrl: 'https://bscscan.com/',
              },
              rpcUrl: 'https://bsc-dataseed.binance.org/',
              ticker: 'BNB',
            },
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).not.toHaveBeenCalled();
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should capture an exception if there is no frequentRpcListDetail property on PreferencesController and no networkConfiguration object', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {
          transactionSecurityCheckEnabled: false,
          useBlockie: false,
          useCurrencyRateCheck: true,
          useMultiAccountBalanceChecker: true,
          useNftDetection: false,
          useNonceField: false,
        },
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
      },
    };
    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(
        `typeof state.PreferencesController.frequentRpcListDetail is undefined`,
      ),
    );
  });

  it('should change nothing if PreferencesController is undefined', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('should capture an exception if PreferencesController is not an object', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        NetworkController: {
          network: '1',
          networkDetails: {
            EIPS: {
              1559: true,
            },
          },
          previousProviderStore: {
            chainId: '0x89',
            nickname: 'Polygon Mainnet',
            rpcPrefs: {},
            rpcUrl:
              'https://polygon-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
            ticker: 'MATIC',
            type: 'rpc',
          },
          provider: {
            chainId: '0x1',
            nickname: '',
            rpcPrefs: {},
            rpcUrl: '',
            ticker: 'ETH',
            type: 'mainnet',
          },
        },
        PreferencesController: false,
      },
    };
    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.PreferencesController is boolean`),
    );
  });

  it('should capture an exception if NetworkController is undefined', async () => {
    const oldStorage = {
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {},
      },
    };
    await migrate(oldStorage);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledTimes(1);
    expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
      new Error(`typeof state.NetworkController is undefined`),
    );
  });
});
