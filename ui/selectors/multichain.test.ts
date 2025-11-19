import { Cryptocurrency } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
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
  MOCK_ACCOUNT_TRON_MAINNET,
  MOCK_ACCOUNT_TRON_NILE,
  MOCK_ACCOUNT_TRON_SHASTA,
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
  getMultichainIsTron,
  getMultichainSelectedAccountCachedBalanceIsZero,
  getMultichainIsTestnet,
  getLastSelectedTronAccount,
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
        [MOCK_ACCOUNT_TRON_MAINNET.id]: {
          [MultichainNativeAssets.TRON]: {
            amount: '100.000000',
            unit: 'TRX',
          },
        },
        [MOCK_ACCOUNT_TRON_NILE.id]: {
          [MultichainNativeAssets.TRON_NILE]: {
            amount: '200.000000',
            unit: 'TRX',
          },
        },
        [MOCK_ACCOUNT_TRON_SHASTA.id]: {
          [MultichainNativeAssets.TRON_SHASTA]: {
            amount: '150.000000',
            unit: 'TRX',
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
        trx: {
          conversionDate: 0,
          conversionRate: 0.08,
        },
      },
      conversionRates: {},
      historicalPrices: {},
      assetsMetadata: {},
      accountsAssets: {},
      allIgnoredAssets: {},
      isEvmSelected: false,
      multichainNetworkConfigurationsByChainId: {
        ...AVAILABLE_MULTICHAIN_NETWORK_CONFIGURATIONS,
      },
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

function getTronState(
  account = MOCK_ACCOUNT_TRON_MAINNET,
  selectedChainId: SupportedCaipChainId = TrxScope.Mainnet,
): TestState {
  return {
    metamask: {
      ...getEvmState().metamask,
      internalAccounts: {
        selectedAccount: account.id,
        accounts: {
          ...MOCK_ACCOUNTS,
          [MOCK_ACCOUNT_TRON_MAINNET.id]: MOCK_ACCOUNT_TRON_MAINNET,
          [MOCK_ACCOUNT_TRON_NILE.id]: MOCK_ACCOUNT_TRON_NILE,
          [MOCK_ACCOUNT_TRON_SHASTA.id]: MOCK_ACCOUNT_TRON_SHASTA,
        },
      },
      selectedMultichainNetworkChainId: selectedChainId,
    },
  };
}

function getTronProviderConfig(): MultichainProviderConfig {
  return MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON];
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

    it('returns a Tron network provider if account is Tron', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(false);
      expect(network.chainId).toBe(TrxScope.Mainnet);
      expect(network.network.ticker).toBe('TRX');
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

    it('prioritizes account scopes over selectedMultichainNetworkChainId for non-EVM networks', () => {
      // Create a Bitcoin account with Bitcoin scope
      const bitcoinAccount = MOCK_ACCOUNT_BIP122_P2WPKH;
      const state = getNonEvmState(bitcoinAccount, BtcScope.Mainnet);

      // Set selectedMultichainNetworkChainId to Solana (different from account scope)
      state.metamask.selectedMultichainNetworkChainId = SolScope.Mainnet;

      const network = getMultichainNetwork(state);

      // Should return Bitcoin network based on account scope, not Solana from selectedChainId
      expect(network.isEvmNetwork).toBe(false);
      expect(network.chainId).toBe(MultichainNetworks.BITCOIN);
      expect(network.nickname).toBe('Bitcoin');
    });

    it('falls back to selectedMultichainNetworkChainId when account has no matching scopes', () => {
      // Create a state with a Bitcoin account but no matching provider configs
      const state = getNonEvmState(
        MOCK_ACCOUNT_BIP122_P2WPKH,
        SolScope.Mainnet,
      );

      // Modify the account to have no scopes that match available providers
      const modifiedAccount = {
        ...MOCK_ACCOUNT_BIP122_P2WPKH,
        scopes: ['bip122:nonexistent-network' as `${string}:${string}`],
      };
      state.metamask.internalAccounts.accounts = {
        ...state.metamask.internalAccounts.accounts,
        [modifiedAccount.id]: modifiedAccount,
      };

      const network = getMultichainNetwork(state);

      // Should fall back to selectedMultichainNetworkChainId (Solana)
      expect(network.isEvmNetwork).toBe(false);
      expect(network.chainId).toBe(MultichainNetworks.SOLANA);
      expect(network.nickname).toBe('Solana');
    });

    it('uses address compatibility as final fallback', () => {
      // Create a state where neither scopes nor selectedChainId match
      const state = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH);

      // Set selectedMultichainNetworkChainId to null and modify account scopes
      // @ts-expect-error - Testing null case for fallback behavior
      state.metamask.selectedMultichainNetworkChainId = null;
      const modifiedAccount = {
        ...MOCK_ACCOUNT_BIP122_P2WPKH,
        scopes: ['bip122:nonexistent-network' as `${string}:${string}`],
      };
      state.metamask.internalAccounts.accounts = {
        ...state.metamask.internalAccounts.accounts,
        [modifiedAccount.id]: modifiedAccount,
      };

      const network = getMultichainNetwork(state);

      // Should fall back to address compatibility (Bitcoin for Bitcoin address)
      expect(network.isEvmNetwork).toBe(false);
      expect(network.chainId).toBe(MultichainNetworks.BITCOIN);
      expect(network.nickname).toBe('Bitcoin');
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

    it('returns a MultichainProviderConfig if account is Tron', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      const tronProviderConfig = getTronProviderConfig();
      expect(getMultichainProviderConfig(state)).toBe(tronProviderConfig);
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

    it('returns TRX if account is Tron', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      expect(getMultichainNativeCurrency(state)).toBe('TRX');
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

    it('returns TRX if account is Tron', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      expect(getMultichainDefaultToken(state)).toEqual({
        symbol: 'TRX',
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

    it('returns current chain ID if account is Tron mainnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      expect(getMultichainCurrentChainId(state)).toEqual(
        MultichainNetworks.TRON,
      );
    });

    it('returns current chain ID if account is Tron Nile testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_NILE, TrxScope.Nile);

      expect(getMultichainCurrentChainId(state)).toEqual(
        MultichainNetworks.TRON_NILE,
      );
    });

    it('returns current chain ID if account is Tron Shasta testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_SHASTA, TrxScope.Shasta);

      expect(getMultichainCurrentChainId(state)).toEqual(
        MultichainNetworks.TRON_SHASTA,
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

    it('returns true if Tron account is on mainnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);
      expect(getMultichainIsMainnet(state)).toBe(true);
    });

    it('returns false if Tron account is on Nile testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_NILE, TrxScope.Nile);
      expect(getMultichainIsMainnet(state)).toBe(false);
    });

    it('returns false if Tron account is on Shasta testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_SHASTA, TrxScope.Shasta);
      expect(getMultichainIsMainnet(state)).toBe(false);
    });
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

    it('returns false for Tron mainnet account (expected behavior)', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);
      expect(getMultichainIsTestnet(state)).toBe(false);
    });

    it('returns true for Tron Nile testnet account', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_NILE, TrxScope.Nile);
      expect(getMultichainIsTestnet(state)).toBe(true);
    });

    it('returns true for Tron Shasta testnet account', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_SHASTA, TrxScope.Shasta);
      expect(getMultichainIsTestnet(state)).toBe(true);
    });
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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      {
        network: 'Tron mainnet',
        account: MOCK_ACCOUNT_TRON_MAINNET,
        asset: MultichainNativeAssets.TRON,
        chainId: TrxScope.Mainnet,
      },
      {
        network: 'Tron Nile',
        account: MOCK_ACCOUNT_TRON_NILE,
        asset: MultichainNativeAssets.TRON_NILE,
        chainId: TrxScope.Nile,
      },
      {
        network: 'Tron Shasta',
        account: MOCK_ACCOUNT_TRON_SHASTA,
        asset: MultichainNativeAssets.TRON_SHASTA,
        chainId: TrxScope.Shasta,
      },
    ] as const)(
      'returns cached balance if account is Tron: $network',
      ({
        account,
        asset,
        chainId,
      }: {
        account: InternalAccount;
        asset: MultichainNativeAssets;
        chainId: SupportedCaipChainId;
      }) => {
        const state = getTronState(account, chainId);
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

  describe('getMultichainIsTron', () => {
    it('returns false if account is EVM', () => {
      const state = getEvmState();
      expect(getMultichainIsTron(state)).toBe(false);
    });

    it('returns false if account is Bitcoin', () => {
      const state = getNonEvmState(MOCK_ACCOUNT_BIP122_P2WPKH);
      expect(getMultichainIsTron(state)).toBe(false);
    });

    it('returns true if account is Tron mainnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);
      expect(getMultichainIsTron(state)).toBe(true);
    });

    it('returns true if account is Tron Nile testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_NILE, TrxScope.Nile);
      expect(getMultichainIsTron(state)).toBe(true);
    });

    it('returns true if account is Tron Shasta testnet', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_SHASTA, TrxScope.Shasta);
      expect(getMultichainIsTron(state)).toBe(true);
    });
  });

  describe('getLastSelectedTronAccount', () => {
    it('returns undefined if no Tron accounts exist', () => {
      const state = getEvmState();
      // Remove Tron accounts from the state to test the case where no Tron accounts exist
      const {
        [MOCK_ACCOUNT_TRON_MAINNET.id]: _tronMainnet,
        [MOCK_ACCOUNT_TRON_NILE.id]: _tronNile,
        [MOCK_ACCOUNT_TRON_SHASTA.id]: _tronShasta,
        ...accountsWithoutTron
      } = state.metamask.internalAccounts.accounts;
      state.metamask.internalAccounts.accounts = accountsWithoutTron;

      expect(getLastSelectedTronAccount(state)).toBeUndefined();
    });

    it('returns the last selected Tron account', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);
      const result = getLastSelectedTronAccount(state);
      expect(result).toBeDefined();
      expect(result?.id).toBe(MOCK_ACCOUNT_TRON_MAINNET.id);
    });

    it('returns the most recently selected Tron account when multiple exist', () => {
      const state = getTronState(MOCK_ACCOUNT_TRON_MAINNET);

      // Modify the mock to have multiple Tron accounts with different lastSelected times
      const olderTronAccount = {
        ...MOCK_ACCOUNT_TRON_NILE,
        metadata: {
          ...MOCK_ACCOUNT_TRON_NILE.metadata,
          lastSelected: 1000000000000, // Older timestamp
        },
      };

      const newerTronAccount = {
        ...MOCK_ACCOUNT_TRON_MAINNET,
        metadata: {
          ...MOCK_ACCOUNT_TRON_MAINNET.metadata,
          lastSelected: 2000000000000, // Newer timestamp
        },
      };

      state.metamask.internalAccounts.accounts = {
        ...state.metamask.internalAccounts.accounts,
        [olderTronAccount.id]: olderTronAccount,
        [newerTronAccount.id]: newerTronAccount,
      };

      const result = getLastSelectedTronAccount(state);
      expect(result?.id).toBe(newerTronAccount.id);
    });
  });
});
