import { Cryptocurrency } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BtcScope } from '@metamask/keyring-api';
import {
  type SupportedCaipChainId,
  AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
} from '@metamask/multichain-network-controller';
import {
  getCurrentCurrency,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  MultichainProviderConfig,
} from '../../shared/constants/multichain/networks';
import {
  MOCK_ACCOUNTS,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
} from '../../test/data/mock-accounts';
import {
  CHAIN_IDS,
  ETH_TOKEN_IMAGE_URL,
  MAINNET_DISPLAY_NAME,
} from '../../shared/constants/network';
import { MultichainNativeAssets } from '../../shared/constants/multichain/assets';
import { mockNetworkState } from '../../test/stub/networks';
import { getProviderConfig } from '../../shared/modules/selectors/networks';
import { AccountsState } from './accounts';
import {
  MultichainState,
  getMultichainCurrentChainId,
  getMultichainCurrentCurrency,
  getMultichainDefaultToken,
  getMultichainIsEvm,
  getMultichainIsMainnet,
  getMultichainNativeCurrency,
  getMultichainNetwork,
  getMultichainNetworkProviders,
  getMultichainProviderConfig,
  getMultichainSelectedAccountCachedBalance,
  getMultichainShouldShowFiat,
  getMultichainIsBitcoin,
  getMultichainSelectedAccountCachedBalanceIsZero,
  getMultichainIsTestnet,
} from './multichain';
import { getSelectedAccountCachedBalance, getShouldShowFiat } from '.';

type TestState = MultichainState &
  AccountsState & {
    metamask: {
      preferences: { showFiatInTestnets: boolean };
      accountsByChainId: Record<string, Record<string, { balance: string }>>;
      networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>;
      currentCurrency: string;
      currencyRates: Record<string, { conversionRate: string }>;
      completedOnboarding: boolean;
      selectedNetworkClientId?: string;
    };
  };

function getEvmState(chainId: Hex = CHAIN_IDS.MAINNET): TestState {
  return {
    metamask: {
      preferences: {
        showFiatInTestnets: false,
      },
      ...mockNetworkState({ chainId }),
      currentCurrency: 'ETH',
      currencyRates: {
        ETH: {
          conversionRate: 'usd',
        },
      },
      completedOnboarding: true,
      internalAccounts: {
        selectedAccount: MOCK_ACCOUNT_EOA.id,
        accounts: MOCK_ACCOUNTS,
      },
      accountsByChainId: {
        '0x1': {
          [MOCK_ACCOUNT_EOA.address]: {
            balance: '3',
          },
        },
      },
      nonEvmTransactions: {
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
          [BtcScope.Mainnet]: {
            transactions: [],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      balances: {
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: {
          [MultichainNativeAssets.BITCOIN]: {
            amount: '1.00000000',
            unit: 'BTC',
          },
        },
        [MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET.id]: {
          [MultichainNativeAssets.BITCOIN_TESTNET]: {
            amount: '2.00000000',
            unit: 'BTC',
          },
        },
      },
      fiatCurrency: 'usd',
      cryptocurrencies: [Cryptocurrency.Btc],
      rates: {
        btc: {
          conversionDate: 0,
          conversionRate: 100000,
        },
      },
      conversionRates: {},
      historicalPrices: {},
      assetsMetadata: {},
      accountsAssets: {},
      isEvmSelected: false,
      multichainNetworkConfigurationsByChainId:
        AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      selectedMultichainNetworkChainId: BtcScope.Mainnet,
      networksWithTransactionActivity: {},
    },
  };
}

function getNonEvmState(
  account = MOCK_ACCOUNT_BIP122_P2WPKH,
  selectedChainId: SupportedCaipChainId = BtcScope.Mainnet,
): TestState {
  return {
    metamask: {
      ...getEvmState().metamask,
      internalAccounts: {
        selectedAccount: account.id,
        accounts: MOCK_ACCOUNTS,
      },
      selectedMultichainNetworkChainId: selectedChainId,
    },
  };
}

function getBip122ProviderConfig(): MultichainProviderConfig {
  // For now, we only have Bitcoin non-EVM network, so we are expecting to have
  // this one with `bip122:*` account type
  return MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN];
}

describe('Multichain Selectors', () => {
  describe('getMultichainNetworkProviders', () => {
    it('has some providers', () => {
      const state = getEvmState();

      const networkProviders = getMultichainNetworkProviders(state);
      expect(Array.isArray(networkProviders)).toBe(true);
      expect(networkProviders.length).toBeGreaterThan(0);
    });
  });

  describe('getMultichainNetwork', () => {
    it('returns an EVM network provider if account is EVM', () => {
      const state = getEvmState();

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(true);
    });

    it('returns an non-EVM network provider if account is non-EVM', () => {
      const state = getNonEvmState();

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(false);
    });

    it('returns an EVM network provider if user is not onboarded', () => {
      const state = getEvmState();
      state.metamask.completedOnboarding = false;
      state.metamask.internalAccounts.selectedAccount = '';

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(true);
    });

    it('returns a EVM network with the correct network image', () => {
      const state = getEvmState();

      const network = getMultichainNetwork(state);
      expect(network.network.rpcPrefs?.imageUrl).toBe(ETH_TOKEN_IMAGE_URL);
    });

    it('returns a nickname for default networks', () => {
      const state = getEvmState();

      const network = getMultichainNetwork(state);
      expect(network.nickname).toBe(MAINNET_DISPLAY_NAME);
    });

    it('returns rpcUrl as its nickname if its not defined', () => {
      const mockNetworkRpc = 'https://mock-rpc.com';
      const mockNetwork = {
        ticker: 'MOCK',
        chainId: '0x123123123',
        rpcUrl: mockNetworkRpc,
        // `nickname` is undefined here
      } as const;

      const state = {
        ...getEvmState(),
        metamask: {
          ...getEvmState().metamask,
          ...mockNetworkState(mockNetwork),
        },
      };

      const network = getMultichainNetwork(state);
      expect(network.nickname).toBe(network.network.rpcUrl);
      expect(network.nickname).toBe(mockNetworkRpc);
    });
  });

  describe('getMultichainIsEvm', () => {
    it('returns true if selected account is EVM compatible', () => {
      const state = getEvmState();

      expect(getMultichainIsEvm(state)).toBe(true);
    });

    it('returns false if selected account is not EVM compatible', () => {
      const state = getNonEvmState();

      expect(getMultichainIsEvm(state)).toBe(false);
    });
  });

  describe('getMultichain{ProviderConfig,CurrentNetwork}', () => {
    it('returns a ProviderConfig if account is EVM', () => {
      const state = getEvmState();

      const evmMainnetNetwork = getProviderConfig(state);
      const multichainProviderConfig = getMultichainProviderConfig(state);
      delete multichainProviderConfig?.rpcPrefs?.imageUrl;
      expect(multichainProviderConfig).toStrictEqual(evmMainnetNetwork);
    });

    it('returns a MultichainProviderConfig if account is non-EVM (bip122:*)', () => {
      const state = getNonEvmState();

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainProviderConfig(state)).toBe(bip122ProviderConfig);
    });
  });

  describe('getMultichainNativeCurrency', () => {
    it('returns same native currency if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainNativeCurrency(state)).toBe(getNativeCurrency(state));
    });

    it('returns MultichainProviderConfig.ticker if account is non-EVM (bip122:*)', () => {
      const state = getNonEvmState();

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainNativeCurrency(state)).toBe(
        bip122ProviderConfig.ticker,
      );
    });
  });

  describe('getMultichainCurrentCurrency', () => {
    it('returns same currency currency if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainCurrentCurrency(state)).toBe(
        getCurrentCurrency(state),
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(['usd', 'ETH'])(
      "returns current currency '%s' if account is EVM",
      (currency: string) => {
        const state = getEvmState();

        state.metamask.currentCurrency = currency;
        expect(getCurrentCurrency(state)).toBe(currency);
        expect(getMultichainCurrentCurrency(state)).toBe(currency);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(['usd', 'BTC'])(
      "returns current currency '%s' if account is non-EVM",
      (currency: string) => {
        const state = getNonEvmState();

        state.metamask.currentCurrency = currency;
        expect(getCurrentCurrency(state)).toBe(currency);
        expect(getMultichainCurrentCurrency(state)).toBe(currency);
      },
    );
  });

  describe('getMultichainShouldShowFiat', () => {
    it('returns same value as getShouldShowFiat if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainShouldShowFiat(state)).toBe(getShouldShowFiat(state));
    });

    it('returns true if account is non-EVM and setting currencyRateCheck is true', () => {
      const state = {
        metamask: {
          ...getNonEvmState().metamask,
          useCurrencyRateCheck: true,
        },
      };
      expect(getMultichainShouldShowFiat(state)).toBe(true);
    });
    it('returns false if account is non-EVM and setting currencyRateCheck is false', () => {
      const state = {
        ...getNonEvmState(),
        metamask: {
          ...getNonEvmState().metamask,
          useCurrencyRateCheck: false,
        },
      };

      expect(getMultichainShouldShowFiat(state)).toBe(false);
    });
  });

  describe('getMultichainDefaultToken', () => {
    it('returns ETH if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainDefaultToken(state)).toEqual({
        symbol: 'ETH',
      });
    });

    it('returns true if account is non-EVM (bip122:*)', () => {
      const state = getNonEvmState();

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainDefaultToken(state)).toEqual({
        symbol: bip122ProviderConfig.ticker,
      });
    });
  });

  describe('getMultichainCurrentChainId', () => {
    it('returns current chain ID if account is EVM (mainnet)', () => {
      const state = getEvmState();

      expect(getMultichainCurrentChainId(state)).toEqual(CHAIN_IDS.MAINNET);
    });

    it('returns current chain ID if account is EVM (other)', () => {
      const state = getEvmState(CHAIN_IDS.SEPOLIA);
      expect(getMultichainCurrentChainId(state)).toEqual(CHAIN_IDS.SEPOLIA);
    });

    it('returns current chain ID if account is non-EVM (bip122:<mainnet>)', () => {
      const state = getNonEvmState();

      expect(getMultichainCurrentChainId(state)).toEqual(
        MultichainNetworks.BITCOIN,
      );
    });

    // No test for testnet with non-EVM for now, as we only support mainnet network providers!
  });

  describe('getMultichainIsMainnet', () => {
    it('returns true if account is EVM (mainnet)', () => {
      const state = getEvmState();

      expect(getMultichainIsMainnet(state)).toBe(true);
    });

    it('returns false if account is EVM (testnet)', () => {
      const state = getEvmState(CHAIN_IDS.SEPOLIA);
      expect(getMultichainIsMainnet(state)).toBe(false);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { isMainnet: true, account: MOCK_ACCOUNT_BIP122_P2WPKH },
      { isMainnet: false, account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET },
    ])(
      'returns $isMainnet if non-EVM account address "$account.address" is compatible with mainnet',
      ({
        isMainnet,
        account,
      }: {
        isMainnet: boolean;
        account: InternalAccount;
      }) => {
        const state = getNonEvmState(account);

        expect(getMultichainIsMainnet(state)).toBe(isMainnet);
      },
    );
  });

  describe('getMultichainIsTestnet', () => {
    it('returns false if account is EVM (mainnet)', () => {
      const state = getEvmState();

      expect(getMultichainIsTestnet(state)).toBe(false);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([CHAIN_IDS.SEPOLIA, CHAIN_IDS.LINEA_SEPOLIA])(
      'returns true if account is EVM (testnet): %s',
      (chainId: Hex) => {
        const state = getEvmState(chainId);
        expect(getMultichainIsTestnet(state)).toBe(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { isTestnet: false, account: MOCK_ACCOUNT_BIP122_P2WPKH },
      { isTestnet: true, account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET },
    ])(
      'returns $isTestnet if non-EVM account address "$account.address" is compatible with mainnet',
      ({
        isTestnet,
        account,
      }: {
        isTestnet: boolean;
        account: InternalAccount;
      }) => {
        const state = getNonEvmState(account);

        expect(getMultichainIsTestnet(state)).toBe(isTestnet);
      },
    );
  });

  describe('getMultichainSelectedAccountCachedBalance', () => {
    it('returns cached balance if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainSelectedAccountCachedBalance(state)).toBe(
        getSelectedAccountCachedBalance(state),
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        network: 'mainnet',
        account: MOCK_ACCOUNT_BIP122_P2WPKH,
        asset: MultichainNativeAssets.BITCOIN,
        chainId: BtcScope.Mainnet,
      },
      {
        network: 'testnet',
        account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
        asset: MultichainNativeAssets.BITCOIN_TESTNET,
        chainId: BtcScope.Testnet,
      },
    ] as const)(
      'returns cached balance if account is non-EVM: $network',
      ({
        account,
        asset,
        chainId,
      }: {
        account: InternalAccount;
        asset: MultichainNativeAssets;
        chainId: SupportedCaipChainId;
      }) => {
        const state = getNonEvmState(account, chainId);
        const balance = state.metamask.balances[account.id][asset].amount;

        state.metamask.internalAccounts.selectedAccount = account.id;
        expect(getMultichainSelectedAccountCachedBalance(state)).toBe(balance);
      },
    );
  });

  describe('getMultichainIsBitcoin', () => {
    it('returns false if account is EVM', () => {
      const state = getEvmState();
      expect(getMultichainIsBitcoin(state)).toBe(false);
    });

    it('returns true if account is BTC', () => {
      const state = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH);
      expect(getMultichainIsBitcoin(state)).toBe(true);
    });
  });

  describe('getMultichainSelectedAccountCachedBalanceIsZero', () => {
    it('returns true if the selected EVM account has a zero balance', () => {
      const state = getEvmState();
      state.metamask.accountsByChainId['0x1'][
        MOCK_ACCOUNT_EOA.address
      ].balance = '0x00';
      expect(getMultichainSelectedAccountCachedBalanceIsZero(state)).toBe(true);
    });

    it('returns false if the selected EVM account has a non-zero balance', () => {
      const state = getEvmState();
      state.metamask.accountsByChainId['0x1'][
        MOCK_ACCOUNT_EOA.address
      ].balance = '3';
      expect(getMultichainSelectedAccountCachedBalanceIsZero(state)).toBe(
        false,
      );
    });

    it('returns true if the selected non-EVM account has a zero balance', () => {
      const state = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH);
      state.metamask.balances[MOCK_ACCOUNT_BIP122_P2WPKH.id][
        MultichainNativeAssets.BITCOIN
      ].amount = '0.00000000';
      expect(getMultichainSelectedAccountCachedBalanceIsZero(state)).toBe(true);
    });

    it('returns false if the selected non-EVM account has a non-zero balance', () => {
      const state = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH);
      state.metamask.balances[MOCK_ACCOUNT_BIP122_P2WPKH.id][
        MultichainNativeAssets.BITCOIN
      ].amount = '1.00000000';
      expect(getMultichainSelectedAccountCachedBalanceIsZero(state)).toBe(
        false,
      );
    });
  });
});
