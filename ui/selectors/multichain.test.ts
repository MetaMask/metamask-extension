import { Cryptocurrency } from '@metamask/assets-controllers';
import { InternalAccount } from '@metamask/keyring-api';
import { Hex } from '@metamask/utils';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { getNativeCurrency } from '../ducks/metamask/metamask';
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
import { CHAIN_IDS } from '../../shared/constants/network';
import { MultichainNativeAssets } from '../../shared/constants/multichain/assets';
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
} from './multichain';
import {
  getCurrentCurrency,
  getCurrentNetwork,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
} from '.';
// import { NetworkConfiguration,  } from '@metamask/network-controller';

type TestState = MultichainState &
  AccountsState & {
    metamask: {
      selectedNetworkClientId: string;
      preferences: { showFiatInTestnets: boolean };
      accountsByChainId: Record<string, Record<string, { balance: string }>>;
      networkConfigurationsByChainId: Record<Hex, NetworkConfiguration>;
      currentCurrency: string;
      currencyRates: Record<string, { conversionRate: string }>;
      completedOnboarding: boolean;
    };
  };

function getEvmState(): TestState {
  return {
    metamask: {
      preferences: {
        showFiatInTestnets: false,
      },
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          chainId: CHAIN_IDS.MAINNET,
          defaultRpcEndpointUrl: 'https://infura.io/mainnet',
          name: 'mainnet',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              type: RpcEndpointType.Infura,
              networkClientId: 'mainnet',
              name: 'Ethereum Mainnet',
              url: 'https://infura.io/mainnet',
            },
          ],
        },
        [CHAIN_IDS.SEPOLIA]: {
          chainId: CHAIN_IDS.SEPOLIA,
          defaultRpcEndpointUrl: 'https://infura.io/sepolia',
          name: 'sepolia',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              type: RpcEndpointType.Infura,
              networkClientId: 'sepolia',
              name: 'Sepolia',
              url: 'https://infura.io/sepolia',
            },
          ],
        },
      },
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
          conversionRate: '100000',
        },
      },
    },
  };
}

function getNonEvmState(account = MOCK_ACCOUNT_BIP122_P2WPKH): TestState {
  return {
    metamask: {
      ...getEvmState().metamask,
      internalAccounts: {
        selectedAccount: account.id,
        accounts: MOCK_ACCOUNTS,
      },
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

      // NOTE: We do fallback to `getCurrentNetwork` (using the "original" list
      // of network) when using EVM context, so check against this value here
      const evmMainnetNetwork = getCurrentNetwork(state);
      expect(getMultichainProviderConfig(state)).toBe(evmMainnetNetwork);
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

    it('fallbacks to ticker as currency if account is non-EVM (bip122:*)', () => {
      const state = getNonEvmState(); // .currentCurrency = 'ETH'

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getCurrentCurrency(state).toLowerCase()).not.toBe('usd');
      expect(getMultichainCurrentCurrency(state)).toBe(
        bip122ProviderConfig.ticker,
      );
    });
  });

  describe('getMultichainShouldShowFiat', () => {
    it('returns same value as getShouldShowFiat if account is EVM', () => {
      const state = getEvmState();

      expect(getMultichainShouldShowFiat(state)).toBe(getShouldShowFiat(state));
    });

    it('returns true if account is non-EVM', () => {
      const state = getNonEvmState();

      expect(getMultichainShouldShowFiat(state)).toBe(true);
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
      const state = getEvmState();

      state.metamask.selectedNetworkClientId = 'sepolia';
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
      const state = getEvmState();

      state.metamask.selectedNetworkClientId = 'sepolia';
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
      },
      {
        network: 'testnet',
        account: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
        asset: MultichainNativeAssets.BITCOIN_TESTNET,
      },
    ])(
      'returns cached balance if account is non-EVM: $network',
      ({
        account,
        asset,
      }: {
        account: InternalAccount;
        asset: MultichainNativeAssets;
      }) => {
        const state = getNonEvmState(account);
        const balance = state.metamask.balances[account.id][asset].amount;

        state.metamask.internalAccounts.selectedAccount = account.id;
        expect(getMultichainSelectedAccountCachedBalance(state)).toBe(balance);
      },
    );
  });
});
