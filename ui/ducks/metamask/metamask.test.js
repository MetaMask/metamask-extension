import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import * as actionConstants from '../../store/actionConstants';
import reduceMetamask, {
  getBlockGasLimit,
  getConversionRate,
  getIsNetworkBusy,
  getNativeCurrency,
  getSendHexDataFeatureFlagState,
  getSendToAccounts,
  isNotEIP1559Network,
} from './metamask';

describe('MetaMask Reducers', () => {
  const mockState = {
    metamask: reduceMetamask(
      {
        isInitialized: true,
        isUnlocked: true,
        featureFlags: { sendHexData: true },
        identities: {
          '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
            name: 'Send Account 1',
          },
          '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            name: 'Send Account 2',
          },
          '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
            name: 'Send Account 3',
          },
          '0xd85a4b6a394794842887b8284293d69163007bbb': {
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
            name: 'Send Account 4',
          },
        },
        cachedBalances: {},
        currentBlockGasLimit: '0x4c1878',
        currentBlockGasLimitByChainId: {
          '0x5': '0x4c1878',
        },
        useCurrencyRateCheck: true,
        currencyRates: {
          TestETH: {
            conversionRate: 1200.88200327,
          },
        },
        selectedNetworkClientId: NetworkType.goerli,
        networksMetadata: {
          [NetworkType.goerli]: {
            EIPS: {},
            status: NetworkStatus.Available,
          },
        },
        providerConfig: {
          type: 'testnet',
          chainId: '0x5',
          ticker: 'TestETH',
        },
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
  it('init state', () => {
    const initState = reduceMetamask(undefined, {});

    expect.anything(initState);
  });

  it('locks MetaMask', () => {
    const unlockMetaMaskState = {
      isUnlocked: true,
      selectedAddress: 'test address',
    };
    const lockMetaMask = reduceMetamask(unlockMetaMaskState, {
      type: actionConstants.LOCK_METAMASK,
    });

    expect(lockMetaMask.isUnlocked).toStrictEqual(false);
  });

  it('sets account label', () => {
    const state = reduceMetamask(
      {},
      {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          account: 'test account',
          label: 'test label',
        },
      },
    );

    expect(state.identities).toStrictEqual({
      'test account': { name: 'test label' },
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

  it('disables desktop', () => {
    const enabledMetaMaskState = {
      desktopEnabled: true,
    };
    const enabledDesktopMetaMask = reduceMetamask(enabledMetaMaskState, {
      type: actionConstants.FORCE_DISABLE_DESKTOP,
    });

    expect(enabledDesktopMetaMask.desktopEnabled).toStrictEqual(false);
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
        expect(getNativeCurrency(mockState)).toStrictEqual('TestETH');
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
        ).toStrictEqual('TestETH');
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
            code: '0x',
            balance: '0x47c9d71831c76efe',
            nonce: '0x1b',
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
            name: 'Send Account 1',
          },
          {
            code: '0x',
            balance: '0x37452b1315889f80',
            nonce: '0xa',
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            name: 'Send Account 2',
          },
          {
            code: '0x',
            balance: '0x30c9d71831c76efe',
            nonce: '0x1c',
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
            name: 'Send Account 3',
          },
          {
            code: '0x',
            balance: '0x0',
            nonce: '0x0',
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
            name: 'Send Account 4',
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
            selectedNetworkClientId: NetworkType.mainnet,
            networksMetadata: {
              [NetworkType.mainnet]: {
                EIPS: {
                  1559: false,
                },
                status: 'available',
              },
            },
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
            selectedNetworkClientId: NetworkType.mainnet,
            networksMetadata: {
              [NetworkType.mainnet]: {
                EIPS: { 1559: true },
                status: 'available',
              },
            },
          },
        }),
      ).toStrictEqual(false);
    });
  });

  describe('getIsNetworkBusy', () => {
    it('should return true if state.metamask.gasFeeEstimates.networkCongestion is over the "busy" threshold', () => {
      expect(
        getIsNetworkBusy({
          metamask: { gasFeeEstimates: { networkCongestion: 0.67 } },
        }),
      ).toBe(true);
    });

    it('should return true if state.metamask.gasFeeEstimates.networkCongestion is right at the "busy" threshold', () => {
      expect(
        getIsNetworkBusy({
          metamask: { gasFeeEstimates: { networkCongestion: 0.66 } },
        }),
      ).toBe(true);
    });

    it('should return false if state.metamask.gasFeeEstimates.networkCongestion is not over the "busy" threshold', () => {
      expect(
        getIsNetworkBusy({
          metamask: { gasFeeEstimates: { networkCongestion: 0.65 } },
        }),
      ).toBe(false);
    });
  });
});
