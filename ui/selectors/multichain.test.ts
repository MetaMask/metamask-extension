import {
  getNativeCurrency,
  getProviderConfig,
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
} from '../../test/data/mock-accounts';
import { AccountsState } from './accounts';
import {
  getMultichainCurrentCurrency,
  getMultichainDefaultToken,
  getMultichainIsEvm,
  getMultichainNativeCurrency,
  getMultichainNetwork,
  getMultichainNetworkProviders,
  getMultichainProviderConfig,
  getMultichainShouldShowFiat,
} from './multichain';
import { getCurrentCurrency, getShouldShowFiat } from '.';

type TestState = AccountsState & {
  metamask: {
    preferences: { showFiatInTestnets: boolean };
    providerConfig: { ticker: string; chainId: string };
    currentCurrency: string;
    currencyRates: Record<string, { conversionRate: string }>;
    completedOnboarding: boolean;
  };
};

const MOCK_EVM_STATE: TestState = {
  metamask: {
    preferences: {
      showFiatInTestnets: false,
    },
    providerConfig: {
      ticker: 'ETH',
      chainId: '0x1',
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
  },
};

const MOCK_NON_EVM_STATE: AccountsState = {
  metamask: {
    ...MOCK_EVM_STATE.metamask,
    internalAccounts: {
      selectedAccount: MOCK_ACCOUNT_BIP122_P2WPKH.id,
      accounts: MOCK_ACCOUNTS,
    },
  },
};

function getBip122ProviderConfig(): MultichainProviderConfig {
  // For now, we only have Bitcoin non-EVM network, so we are expecting to have
  // this one with `bip122:*` account type
  return MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN];
}

describe('Multichain Selectors', () => {
  describe('getMultichainNetworkProviders', () => {
    it('has some providers', () => {
      const state = MOCK_EVM_STATE;

      const networkProviders = getMultichainNetworkProviders(state);
      expect(Array.isArray(networkProviders)).toBe(true);
      expect(networkProviders.length).toBeGreaterThan(0);
    });
  });

  describe('getMultichainNetwork', () => {
    it('returns an EVM network provider if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(true);
    });

    it('returns an non-EVM network provider if account is non-EVM', () => {
      const state = MOCK_NON_EVM_STATE;

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(false);
    });

    it('returns an EVM network provider if user is not onboarded', () => {
      const state = MOCK_EVM_STATE;
      state.metamask.completedOnboarding = false;
      state.metamask.internalAccounts.selectedAccount = '';

      const network = getMultichainNetwork(state);
      expect(network.isEvmNetwork).toBe(true);
    });
  });

  describe('getMultichainIsEvm', () => {
    it('returns true if selected account is EVM compatible', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainIsEvm(state)).toBe(true);
    });

    it('returns false if selected account is not EVM compatible', () => {
      const state = MOCK_NON_EVM_STATE;

      expect(getMultichainIsEvm(state)).toBe(false);
    });
  });

  describe('getMultichain{ProviderConfig,CurrentNetwork}', () => {
    it('returns a ProviderConfig if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainProviderConfig(state)).toBe(getProviderConfig(state));
    });

    it('returns a MultichainProviderConfig if account is non-EVM (bip122:*)', () => {
      const state = MOCK_NON_EVM_STATE;

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainProviderConfig(state)).toBe(bip122ProviderConfig);
    });
  });

  describe('getMultichainNativeCurrency', () => {
    it('returns same native currency if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainNativeCurrency(state)).toBe(getNativeCurrency(state));
    });

    it('returns MultichainProviderConfig.ticker if account is non-EVM (bip122:*)', () => {
      const state = MOCK_NON_EVM_STATE;

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainNativeCurrency(state)).toBe(
        bip122ProviderConfig.ticker,
      );
    });
  });

  describe('getMultichainCurrentCurrency', () => {
    it('returns same currency currency if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainCurrentCurrency(state)).toBe(
        getCurrentCurrency(state),
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(['usd', 'ETH'])(
      "returns current currency '%s' if account is EVM",
      (currency: string) => {
        const state = MOCK_EVM_STATE;

        state.metamask.currentCurrency = currency;
        expect(getCurrentCurrency(state)).toBe(currency);
        expect(getMultichainCurrentCurrency(state)).toBe(currency);
      },
    );

    it('fallbacks to ticker as currency if account is non-EVM (bip122:*)', () => {
      const state = MOCK_NON_EVM_STATE; // .currentCurrency = 'ETH'

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getCurrentCurrency(state).toLowerCase()).not.toBe('usd');
      expect(getMultichainCurrentCurrency(state)).toBe(
        bip122ProviderConfig.ticker,
      );
    });
  });

  describe('getMultichainShouldShowFiat', () => {
    it('returns same value as getShouldShowFiat if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainShouldShowFiat(state)).toBe(getShouldShowFiat(state));
    });

    it('returns true if account is non-EVM', () => {
      const state = MOCK_NON_EVM_STATE;

      expect(getMultichainShouldShowFiat(state)).toBe(true);
    });
  });

  describe('getMultichainDefaultToken', () => {
    it('returns ETH if account is EVM', () => {
      const state = MOCK_EVM_STATE;

      expect(getMultichainDefaultToken(state)).toEqual({
        symbol: 'ETH',
      });
    });

    it('returns true if account is non-EVM (bip122:*)', () => {
      const state = MOCK_NON_EVM_STATE;

      const bip122ProviderConfig = getBip122ProviderConfig();
      expect(getMultichainDefaultToken(state)).toEqual({
        symbol: bip122ProviderConfig.ticker,
      });
    });
  });
});
