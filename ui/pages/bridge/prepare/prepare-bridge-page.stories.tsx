import React from 'react';
import { Provider } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  getNativeAssetForChainId,
  QuoteResponse,
  RequestStatus,
} from '@metamask/bridge-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import { HardwareWalletProvider } from '../../../contexts/hardware-wallets';
import { PREPARE_SWAP_ROUTE } from '../../../helpers/constants/routes';
import configureStore from '../../../store/store';
import PrepareBridgePage from './prepare-bridge-page';

const storybook = {
  title: 'Pages/Bridge/CrossChainSwapPage',
  component: PrepareBridgePage,
  parameters: {
    initialEntries: [`${PREPARE_SWAP_ROUTE}`],
  },
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <HardwareWalletProvider>
    <div style={{ width: '400px', height: '600px' }}>{children}</div>
  </HardwareWalletProvider>
);

const createStoreDecorator = (store: ReturnType<typeof configureStore>) => {
  return (Story: () => React.ReactElement) => (
    <Provider store={store}>
      <Wrapper>
        <Story />
      </Wrapper>
    </Provider>
  );
};

const mockFeatureFlags = {
  extensionSupport: true,
  bridgeConfig: {
    refreshRate: 30000,
    priceImpactThreshold: {
      normal: 1,
      gasless: 2,
    },
    maxRefreshCount: 5,
    support: true,
    chainRanking: [
      { chainId: 'eip155:1' as const, name: 'Ethereum' },
      { chainId: 'eip155:10' as const, name: 'Optimism' },
      { chainId: 'eip155:137' as const, name: 'Polygon' },
    ],
    chains: {
      '0x1': {
        isActiveSrc: true,
        isActiveDest: true,
        isSingleSwapBridgeButtonEnabled: true,
      },
      '0xa': {
        isActiveSrc: true,
        isActiveDest: true,
        isSingleSwapBridgeButtonEnabled: true,
      },
      '0x89': {
        isActiveSrc: true,
        isActiveDest: true,
        isSingleSwapBridgeButtonEnabled: true,
      },
    },
  },
};
const mockBridgeSlice = {
  fromToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.MAINNET)),
  toToken: toBridgeToken(getNativeAssetForChainId(CHAIN_IDS.LINEA_MAINNET)),
  fromTokenInputValue: '1',
};

const defaultStore = configureStore(
  createBridgeMockStore({
    featureFlagOverrides: mockFeatureFlags,
    bridgeSliceOverrides: mockBridgeSlice,
    bridgeStateOverrides: {
      quotes: [],
      quotesLastFetched: Date.now(),
    },
    metamaskStateOverrides: {
      useExternalServices: true,
      currencyRates: {
        ETH: { conversionRate: 2514.5 },
      },
      marketData: {
        '0x1': {
          ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
            price: 0.00039762010419237126,
            contractPercentChange1d: 0.004,
            priceChange1d: 0.00004,
          },
        },
      },
    },
  }),
);

const loadingStore = configureStore(
  createBridgeMockStore({
    featureFlagOverrides: mockFeatureFlags,
    bridgeSliceOverrides: mockBridgeSlice,
    bridgeStateOverrides: {
      quotes: [],
      quotesLastFetched: 134,
      quotesLoadingStatus: RequestStatus.LOADING,
    },
    metamaskStateOverrides: {
      useExternalServices: true,
      currencyRates: {
        ETH: { conversionRate: 2514.5 },
      },
      marketData: {
        '0x1': {
          ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
            price: 0.00039762010419237126,
            contractPercentChange1d: 0.004,
            priceChange1d: 0.00004,
          },
        },
      },
    },
  }),
);

const noQuotesStore = configureStore(
  createBridgeMockStore({
    featureFlagOverrides: mockFeatureFlags,
    bridgeSliceOverrides: mockBridgeSlice,
    bridgeStateOverrides: {
      quoteRequest: {
        srcChainId: CHAIN_IDS.MAINNET,
        destChainId: CHAIN_IDS.LINEA_MAINNET,
        srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        srcTokenAmount: '1',
        destTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        destWalletAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        slippage: 1,
        walletAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        gasIncluded: true,
        insufficientBal: false,
      },
      quotes: [],
      quotesLastFetched: 134,
      quotesLoadingStatus: RequestStatus.FETCHED,
    },
    metamaskStateOverrides: {
      useExternalServices: true,
      currencyRates: {
        ETH: { conversionRate: 2514.5 },
      },
      marketData: {
        '0x1': {
          ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
            price: 0.00039762010419237126,
            contractPercentChange1d: 0.004,
            priceChange1d: 0.00004,
          },
        },
      },
    },
  }),
);

const quotesFetchedStore = configureStore(
  createBridgeMockStore({
    featureFlagOverrides: mockFeatureFlags,
    bridgeSliceOverrides: mockBridgeSlice,
    bridgeStateOverrides: {
      quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
      quotesLastFetched: Date.now(),
      quotesLoadingStatus: RequestStatus.FETCHED,
    },
    metamaskStateOverrides: {
      useExternalServices: true,
      currencyRates: {
        ETH: { conversionRate: 2514.5 },
      },
      marketData: {
        '0x1': {
          ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
            price: 0.00039762010419237126,
            contractPercentChange1d: 0.004,
            priceChange1d: 0.00004,
          },
        },
      },
    },
  }),
);
export const DefaultStory = () => {
  return <PrepareBridgePage onOpenSettings={() => undefined} />;
};
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [createStoreDecorator(defaultStore)];

export const LoadingStory = () => {
  return <PrepareBridgePage onOpenSettings={() => undefined} />;
};
LoadingStory.storyName = 'Loading Quotes';
LoadingStory.decorators = [createStoreDecorator(loadingStore)];

export const NoQuotesStory = () => {
  return <PrepareBridgePage onOpenSettings={() => undefined} />;
};
NoQuotesStory.storyName = 'No Quotes';
NoQuotesStory.decorators = [createStoreDecorator(noQuotesStore)];

export const QuotesFetchedStory = () => {
  return <PrepareBridgePage onOpenSettings={() => undefined} />;
};
QuotesFetchedStory.storyName = 'Quotes Available';
QuotesFetchedStory.decorators = [createStoreDecorator(quotesFetchedStore)];

const mockHardwareAccount = createMockInternalAccount({
  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  keyringType: KeyringTypes.ledger,
});

const alertsPresentStore = configureStore(
  createBridgeMockStore({
    featureFlagOverrides: mockFeatureFlags,
    bridgeSliceOverrides: {
      ...mockBridgeSlice,
      txAlert: {
        titleId: 'txAlertTitle',
        description: 'The transaction is going to fail',
        descriptionId: 'bridgeSelectDifferentQuote',
      },
      toToken: {
        chainId: CHAIN_IDS.POLYGON,
        occurrences: 1,
        assetId: 'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      },
    },
    bridgeStateOverrides: {
      quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
      quotesLastFetched: Date.now(),
      quotesLoadingStatus: RequestStatus.FETCHED,
      quoteRequest: {
        srcChainId: CHAIN_IDS.OPTIMISM,
        destChainId: CHAIN_IDS.POLYGON,
        srcTokenAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        destTokenAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        srcTokenAmount: '1',
        destWalletAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        slippage: 1,
        walletAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        gasIncluded: true,
        insufficientBal: false,
      },
    },
    metamaskStateOverrides: {
      internalAccounts: {
        accounts: {
          [mockHardwareAccount.id]: mockHardwareAccount,
        },
        selectedAccount: mockHardwareAccount.id,
      },
      useExternalServices: true,
      currencyRates: {
        ETH: { conversionRate: 2514.5 },
      },
      marketData: {
        '0x1': {
          ['0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85']: {
            price: 0.00039762010419237126,
            contractPercentChange1d: 0.004,
            priceChange1d: 0.00004,
          },
        },
      },
    },
  }),
);
export const AlertsPresentStory = () => {
  return <PrepareBridgePage onOpenSettings={() => undefined} />;
};
AlertsPresentStory.storyName = 'Alerts present';
AlertsPresentStory.decorators = [createStoreDecorator(alertsPresentStore)];

export default storybook;
