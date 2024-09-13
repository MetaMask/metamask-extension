import { EthAccountType } from '@metamask/keyring-api';
import {
  GasFeeEstimateType,
  TransactionStatus,
  mergeGasFeeEstimates,
} from '@metamask/transaction-controller';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import * as actionConstants from '../../store/actionConstants';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import reduceMetamask, {
  getBlockGasLimit,
  getConversionRate,
  getGasEstimateType,
  getGasEstimateTypeByChainId,
  getGasFeeEstimates,
  getGasFeeEstimatesByChainId,
  getIsNetworkBusyByChainId,
  getNativeCurrency,
  getSendHexDataFeatureFlagState,
  getSendToAccounts,
  isNotEIP1559Network,
} from './metamask';

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  mergeGasFeeEstimates: jest.fn(),
}));

const GAS_FEE_CONTROLLER_ESTIMATES_MOCK = {
  low: '0x1',
  medium: '0x2',
  high: '0x3',
};

const TRANSACTION_ESTIMATES_MOCK = {
  low: {
    maxFeePerGas: '0x1',
    maxPriorityFeePerGas: '0x2',
  },
  medium: {
    maxFeePerGas: '0x1',
    maxPriorityFeePerGas: '0x2',
  },
  high: {
    maxFeePerGas: '0x1',
    maxPriorityFeePerGas: '0x2',
  },
};

describe('MetaMask Reducers', () => {
  const mergeGasFeeEstimatesMock = jest.mocked(mergeGasFeeEstimates);

  const mockState = {
    metamask: reduceMetamask(
      {
        isInitialized: true,
        isUnlocked: true,
        featureFlags: { sendHexData: true },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Send Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
              address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
              id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
              metadata: {
                name: 'Send Account 2',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            '15e69915-2a1a-4019-93b3-916e11fd432f': {
              address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
              id: '15e69915-2a1a-4019-93b3-916e11fd432f',
              metadata: {
                name: 'Send Account 3',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            '784225f4-d30b-4e77-a900-c8bbce735b88': {
              address: '0xd85a4b6a394794842887b8284293d69163007bbb',
              id: '784225f4-d30b-4e77-a900-c8bbce735b88',
              metadata: {
                name: 'Send Account 4',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        cachedBalances: {},
        currentBlockGasLimit: '0x4c1878',
        currentBlockGasLimitByChainId: {
          '0x5': '0x4c1878',
        },
        useCurrencyRateCheck: true,
        currencyRates: {
          GoerliETH: {
            conversionRate: 1200.88200327,
          },
        },
        ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
        accounts: {
          '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
            code: '0x',
            balance: '0x47c9d71831c76efe',
            nonce: '0x1b',
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
          },
          '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
            code: '0x',
            balance: '0x37452b1315889f80',
            nonce: '0xa',
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          },
          '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
            code: '0x',
            balance: '0x30c9d71831c76efe',
            nonce: '0x1c',
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
          },
          '0xd85a4b6a394794842887b8284293d69163007bbb': {
            code: '0x',
            balance: '0x0',
            nonce: '0x0',
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
          },
        },
        accountsByChainId: {
          '0x5': {
            '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
              code: '0x',
              balance: '0x47c9d71831c76efe',
              nonce: '0x1b',
              address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
            },
            '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
              code: '0x',
              balance: '0x37452b1315889f80',
              nonce: '0xa',
              address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            },
            '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
              code: '0x',
              balance: '0x30c9d71831c76efe',
              nonce: '0x1c',
              address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
            },
            '0xd85a4b6a394794842887b8284293d69163007bbb': {
              code: '0x',
              balance: '0x0',
              nonce: '0x0',
              address: '0xd85a4b6a394794842887b8284293d69163007bbb',
            },
          },
        },
        addressBook: {
          '0x5': {
            '0x06195827297c7a80a443b6894d3bdb8824b43896': {
              address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
              name: 'Address Book Account 1',
              chainId: '0x5',
            },
          },
        },
        transactions: [
          {
            id: 4768706228115573,
            time: 1487363153561,
            status: TransactionStatus.unapproved,
            gasMultiplier: 1,
            chainId: '0x5',
            txParams: {
              from: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
              to: '0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761',
              value: '0xde0b6b3a7640000',
              metamaskId: 4768706228115573,
              chainId: '0x5',
              gas: '0x5209',
            },
            txFee: '17e0186e60800',
            txValue: 'de0b6b3a7640000',
            maxCost: 'de234b52e4a0800',
            gasPrice: '4a817c800',
          },
        ],
      },
      {},
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('init state', () => {
    const initState = reduceMetamask(undefined, {});

    expect.anything(initState);
  });

  it('locks MetaMask', () => {
    const unlockMetaMaskState = {
      isUnlocked: true,
    };
    const lockMetaMask = reduceMetamask(unlockMetaMaskState, {
      type: actionConstants.LOCK_METAMASK,
    });

    expect(lockMetaMask.isUnlocked).toStrictEqual(false);
  });

  it('sets account label', () => {
    const state = reduceMetamask(mockState.metamask, {
      type: actionConstants.SET_ACCOUNT_LABEL,
      value: {
        account: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
        label: 'test label',
      },
    });

    expect(state.internalAccounts).toStrictEqual({
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          ...mockState.metamask.internalAccounts.accounts[
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
          ],
          metadata: {
            ...mockState.metamask.internalAccounts.accounts[
              'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
            ].metadata,
            name: 'test label',
          },
        },
      },
    });
  });

  it('toggles account menu', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.TOGGLE_ACCOUNT_MENU,
      },
    );

    expect(state.isAccountMenuOpen).toStrictEqual(true);
  });

  it('toggles network menu', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.TOGGLE_NETWORK_MENU,
      },
    );

    expect(state.isNetworkMenuOpen).toStrictEqual(true);
  });

  it('updates value of tx by id', () => {
    const oldState = {
      transactions: [
        {
          id: 1,
          txParams: 'foo',
        },
      ],
    };

    const state = reduceMetamask(oldState, {
      type: actionConstants.UPDATE_TRANSACTION_PARAMS,
      id: 1,
      value: 'bar',
    });

    expect(state.transactions[0].txParams).toStrictEqual('bar');
  });

  it('close welcome screen', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.CLOSE_WELCOME_SCREEN,
      },
    );

    expect(state.welcomeScreenSeen).toStrictEqual(true);
  });

  it('sets pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = reduceMetamask(
      {},
      {
        type: actionConstants.SET_PENDING_TOKENS,
        payload,
      },
    );

    expect(pendingTokensState.pendingTokens).toStrictEqual(payload);
  });

  it('clears pending tokens', () => {
    const payload = {
      address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
      decimals: 18,
      symbol: 'META',
    };

    const pendingTokensState = {
      pendingTokens: payload,
    };

    const state = reduceMetamask(pendingTokensState, {
      type: actionConstants.CLEAR_PENDING_TOKENS,
    });

    expect(state.pendingTokens).toStrictEqual({});
  });

  describe('metamask state selectors', () => {
    describe('getBlockGasLimit', () => {
      it('should return the current block gas limit', () => {
        expect(getBlockGasLimit(mockState)).toStrictEqual('0x4c1878');
      });
    });

    describe('getConversionRate()', () => {
      it('should return the eth conversion rate', () => {
        expect(getConversionRate(mockState)).toStrictEqual(1200.88200327);
      });
    });

    describe('getNativeCurrency()', () => {
      it('should return nativeCurrency when useCurrencyRateCheck is true', () => {
        expect(getNativeCurrency(mockState)).toStrictEqual('GoerliETH');
      });

      it('should return the ticker symbol of the selected network when useCurrencyRateCheck is false', () => {
        expect(
          getNativeCurrency({
            ...mockState,
            metamask: {
              ...mockState.metamask,
              useCurrencyRateCheck: false,
            },
          }),
        ).toStrictEqual('GoerliETH');
      });
    });

    describe('getSendHexDataFeatureFlagState()', () => {
      it('should return the sendHexData feature flag state', () => {
        expect(getSendHexDataFeatureFlagState(mockState)).toStrictEqual(true);
      });
    });

    describe('getSendToAccounts()', () => {
      it('should return an array including all the users accounts and the address book', () => {
        expect(getSendToAccounts(mockState)).toStrictEqual([
          {
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Send Account 1',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            code: '0x',
            balance: '0x47c9d71831c76efe',
            nonce: '0x1b',
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
          },
          {
            id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
            metadata: {
              name: 'Send Account 2',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            code: '0x',
            balance: '0x37452b1315889f80',
            nonce: '0xa',
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          },
          {
            id: '15e69915-2a1a-4019-93b3-916e11fd432f',
            metadata: {
              name: 'Send Account 3',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            code: '0x',
            balance: '0x30c9d71831c76efe',
            nonce: '0x1c',
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
          },
          {
            id: '784225f4-d30b-4e77-a900-c8bbce735b88',
            metadata: {
              name: 'Send Account 4',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
            code: '0x',
            balance: '0x0',
            nonce: '0x0',
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
          },
          {
            address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
            name: 'Address Book Account 1',
            chainId: '0x5',
          },
        ]);
      });
    });
  });

  describe('isNotEIP1559Network()', () => {
    it('should return true if network does not supports EIP-1559', () => {
      expect(
        isNotEIP1559Network({
          ...mockState,
          metamask: {
            ...mockState.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.MAINNET,
              metadata: { EIPS: { 1559: false } },
            }),
          },
        }),
      ).toStrictEqual(true);
    });

    it('should return false if networksMetadata[selectedNetworkClientId].EIPS.1559 is not false', () => {
      expect(isNotEIP1559Network(mockState)).toStrictEqual(false);

      expect(
        isNotEIP1559Network({
          ...mockState,
          metamask: {
            ...mockState.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.MAINNET,
              metadata: { EIPS: { 1559: true } },
            }),
          },
        }),
      ).toStrictEqual(false);
    });
  });

  describe('getIsNetworkBusyByChainId', () => {
    it('should return true if networkCongestion is over the "busy" threshold', () => {
      expect(
        getIsNetworkBusyByChainId(
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x1': {
                  gasFeeEstimates: { networkCongestion: 0.91 },
                },
              },
            },
          },
          '0x1',
        ),
      ).toBe(true);
    });

    it('should return true if networkCongestion is right at the "busy" threshold', () => {
      expect(
        getIsNetworkBusyByChainId(
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x1': {
                  gasFeeEstimates: { networkCongestion: 0.9 },
                },
              },
            },
          },
          '0x1',
        ),
      ).toBe(true);
    });

    it('should return false if networkCongestion is not over the "busy" threshold', () => {
      expect(
        getIsNetworkBusyByChainId(
          {
            metamask: {
              gasFeeEstimatesByChainId: {
                '0x1': {
                  gasFeeEstimates: { networkCongestion: 0.89 },
                },
              },
            },
          },
          '0x1',
        ),
      ).toBe(false);
    });
  });

  describe('getGasFeeEstimates', () => {
    it('returns GasFeeController estimates if no transaction estimates', () => {
      const state = {
        metamask: {
          gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
        },
      };

      expect(getGasFeeEstimates(state)).toStrictEqual(
        GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
      );
    });

    it('returns merged transaction estimates if transaction estimates exist', () => {
      const state = {
        confirmTransaction: {
          txData: {
            gasFeeEstimates: TRANSACTION_ESTIMATES_MOCK,
          },
        },
        metamask: {
          gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
        },
      };

      mergeGasFeeEstimatesMock.mockReturnValue(TRANSACTION_ESTIMATES_MOCK);

      expect(getGasFeeEstimates(state)).toStrictEqual(
        TRANSACTION_ESTIMATES_MOCK,
      );

      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledTimes(1);
      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledWith({
        gasFeeControllerEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
        transactionGasFeeEstimates: TRANSACTION_ESTIMATES_MOCK,
      });
    });
  });

  describe('getGasFeeEstimatesByChainId', () => {
    it('returns GasFeeController estimates for specified chain if no transaction estimates', () => {
      const state = {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
            },
          },
        },
      };

      expect(getGasFeeEstimatesByChainId(state, '0x1')).toStrictEqual(
        GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
      );
    });

    it('returns merged transaction estimates if transaction estimates exist', () => {
      const state = {
        confirmTransaction: {
          txData: {
            chainId: '0x1',
            gasFeeEstimates: TRANSACTION_ESTIMATES_MOCK,
          },
        },
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
            },
          },
        },
      };

      mergeGasFeeEstimatesMock.mockReturnValue(TRANSACTION_ESTIMATES_MOCK);

      expect(getGasFeeEstimatesByChainId(state, '0x1')).toStrictEqual(
        TRANSACTION_ESTIMATES_MOCK,
      );

      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledTimes(1);
      expect(mergeGasFeeEstimatesMock).toHaveBeenCalledWith({
        gasFeeControllerEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
        transactionGasFeeEstimates: TRANSACTION_ESTIMATES_MOCK,
      });
    });

    it('returns GasFeeController estimates for specified chain if transaction chain does not match', () => {
      const state = {
        confirmTransaction: {
          txData: {
            chainId: '0x2',
            gasFeeEstimates: TRANSACTION_ESTIMATES_MOCK,
          },
        },
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasFeeEstimates: GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
            },
          },
        },
      };

      expect(getGasFeeEstimatesByChainId(state, '0x1')).toStrictEqual(
        GAS_FEE_CONTROLLER_ESTIMATES_MOCK,
      );
    });
  });

  describe('getGasEstimateType', () => {
    it('return GasFeeController type if no transaction estimates', () => {
      const state = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
        },
      };

      expect(getGasEstimateType(state)).toStrictEqual(
        GAS_ESTIMATE_TYPES.FEE_MARKET,
      );
    });

    it('return transaction type if transaction estimates exist', () => {
      const state = {
        metamask: {
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
        },
        confirmTransaction: {
          txData: {
            gasFeeEstimates: {
              type: GasFeeEstimateType.Legacy,
            },
          },
        },
      };

      expect(getGasEstimateType(state)).toStrictEqual(
        GAS_ESTIMATE_TYPES.LEGACY,
      );
    });
  });

  describe('getGasEstimateTypeByChainId', () => {
    it('return GasFeeController type for specified chain if no transaction estimates', () => {
      const state = {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
            },
          },
        },
      };

      expect(getGasEstimateTypeByChainId(state, '0x1')).toStrictEqual(
        GAS_ESTIMATE_TYPES.FEE_MARKET,
      );
    });

    it('return transaction type if transaction estimates exist', () => {
      const state = {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
            },
          },
        },
        confirmTransaction: {
          txData: {
            chainId: '0x1',
            gasFeeEstimates: {
              type: GasFeeEstimateType.Legacy,
            },
          },
        },
      };

      expect(getGasEstimateTypeByChainId(state, '0x1')).toStrictEqual(
        GAS_ESTIMATE_TYPES.LEGACY,
      );
    });

    it('return GasFeeController type if transaction chain does not match', () => {
      const state = {
        metamask: {
          gasFeeEstimatesByChainId: {
            '0x1': {
              gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
            },
          },
        },
        confirmTransaction: {
          txData: {
            chainId: '0x2',
            gasFeeEstimates: {
              type: GasFeeEstimateType.Legacy,
            },
          },
        },
      };

      expect(getGasEstimateTypeByChainId(state, '0x1')).toStrictEqual(
        GAS_ESTIMATE_TYPES.FEE_MARKET,
      );
    });
  });
});
