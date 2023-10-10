import { v4 } from 'uuid';
import migration81 from './081';

jest.mock('uuid', () => {
  const actual = jest.requireActual('uuid');

  return {
    ...actual,
    v4: jest.fn(),
  };
});

describe('migration #81', () => {
  beforeEach(() => {
    v4.mockImplementationOnce(() => 'uuid-1')
      .mockImplementationOnce(() => 'uuid-2')
      .mockImplementationOnce(() => 'uuid-3')
      .mockImplementationOnce(() => 'uuid-4');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 80,
      },
    };

    const newStorage = await migration81.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 81,
    });
  });
  it('should migrate the network configurations from an array on the PreferencesController to an object on the NetworkController and change property `nickname` to `chainName`', async () => {
    const oldStorage = {
      meta: {
        version: 80,
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
    const newStorage = await migration81.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 81,
      },
      data: {
        PreferencesController: {},
        NetworkController: {
          networkConfigurations: {
            'uuid-1': {
              chainId: '0x539',
              chainName: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'uuid-2': {
              chainId: '0xa4b1',
              chainName: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'uuid-3': {
              chainId: '0x4e454152',
              chainName: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'uuid-4': {
              chainId: '0x38',
              chainName:
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

  it('should not change data other than the frequentRpcListDetail/networkConfigurations on either the PreferencesController or NetworkController', async () => {
    const oldStorage = {
      meta: {
        version: 80,
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
    const newStorage = await migration81.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
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
            'uuid-1': {
              chainId: '0x539',
              chainName: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'uuid-2': {
              chainId: '0xa4b1',
              chainName: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'uuid-3': {
              chainId: '0x4e454152',
              chainName: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'uuid-4': {
              chainId: '0x38',
              chainName:
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
  it('should not change anything if there is no frequentRpcListDetail property on PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 80,
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
            'uuid-1': {
              chainId: '0x539',
              chainName: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'uuid-2': {
              chainId: '0xa4b1',
              chainName: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'uuid-3': {
              chainId: '0x4e454152',
              chainName: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'uuid-4': {
              chainId: '0x38',
              chainName:
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
    const newStorage = await migration81.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
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
            'uuid-1': {
              chainId: '0x539',
              chainName: 'Localhost 8545',
              rpcPrefs: {},
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
            },
            'uuid-2': {
              chainId: '0xa4b1',
              chainName: 'Arbitrum One',
              rpcPrefs: {
                blockExplorerUrl: 'https://explorer.arbitrum.io',
              },
              rpcUrl:
                'https://arbitrum-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'ETH',
            },
            'uuid-3': {
              chainId: '0x4e454152',
              chainName: 'Aurora Mainnet',
              rpcPrefs: {
                blockExplorerUrl: 'https://aurorascan.dev/',
              },
              rpcUrl:
                'https://aurora-mainnet.infura.io/v3/373266a93aab4acda48f89d4fe77c748',
              ticker: 'Aurora ETH',
            },
            'uuid-4': {
              chainId: '0x38',
              chainName:
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
});
