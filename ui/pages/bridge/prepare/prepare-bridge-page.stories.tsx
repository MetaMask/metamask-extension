import React from 'react';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import configureStore from '../../../store/store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';

import CrossChainSwap from '../index';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import mockBridgeQuotesErc20Erc20 from '../../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import {
  formatChainIdToCaip,
  QuoteResponse,
  RequestStatus,
} from '@metamask/bridge-controller';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { KeyringTypes } from '@metamask/keyring-controller';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

const storybook = {
  title: 'Pages/Bridge/CrossChainSwapPage',
  component: CrossChainSwap,
};

// Navigate to the correct route on mount
const RouteNavigator = ({ to, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return children;
};

const Wrapper = ({ children }) => (
  <div style={{ width: '400px', height: '600px' }}>
    <RouteNavigator to={CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE}>
      {children}
    </RouteNavigator>
  </div>
);

const mockFeatureFlags = {
  extensionSupport: true,
  bridgeConfig: {
    refreshRate: 30000,
    priceImpactThreshold: {
      normal: 1,
      gasless: 2,
    },
    maxRefreshCount: 5,
    chainRanking: [
      { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
      { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
      { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
      { chainId: MultichainNetworks.SOLANA },
      { chainId: MultichainNetworks.BITCOIN },
      { chainId: MultichainNetworks.TRON },
    ],
  },
};
const mockBridgeSlice = {
  toChainId: CHAIN_IDS.LINEA_MAINNET,
  fromTokenInputValue: '1',
};
export const DefaultStory = () => {
  return <CrossChainSwap location={{ search: '' }} />;
};
DefaultStory.storyName = 'Default';
DefaultStory.decorators = [
  (Story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          featureFlagOverrides: mockFeatureFlags,
          bridgeSliceOverrides: mockBridgeSlice,
          bridgeStateOverrides: {
            quotes: [],
            quotesLastFetched: Date.now(),
          },
        }),
      )}
    >
      <Wrapper>
        <Story />
      </Wrapper>
    </Provider>
  ),
];

export const LoadingStory = () => {
  return <CrossChainSwap location={{ search: '' }} />;
};
LoadingStory.storyName = 'Loading Quotes';
LoadingStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: mockBridgeSlice,
            bridgeStateOverrides: {
              quotes: [],
              quotesLastFetched: 134,
              quotesLoadingStatus: RequestStatus.LOADING,
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export const NoQuotesStory = () => {
  return <CrossChainSwap location={{ search: '' }} />;
};
NoQuotesStory.storyName = 'No Quotes';
NoQuotesStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: {
              fromTokenInputValue: '1',
              fromToken: {
                address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                assetId:
                  'eip155:1/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                chainId: CHAIN_IDS.MAINNET,
                decimals: 6,
                symbol: 'USDC',
                name: 'USD Coin',
              },
              toToken: {
                address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                assetId:
                  'eip155:59144/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
                chainId: CHAIN_IDS.LINEA_MAINNET,
                decimals: 6,
                symbol: 'USDC',
                name: 'Native USD Coin (POS)',
              },
              toChainId: CHAIN_IDS.LINEA_MAINNET,
            },
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
              quotesLastFetched: Date.now(),
              quotesLoadingStatus: RequestStatus.FETCHED,
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export const QuotesFetchedStory = () => {
  return <CrossChainSwap location={{ search: '' }} />;
};
QuotesFetchedStory.storyName = 'Quotes Available';
QuotesFetchedStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: mockBridgeSlice,
            bridgeStateOverrides: {
              quotes: mockBridgeQuotesErc20Erc20 as unknown as QuoteResponse[],
              quotesLastFetched: Date.now(),
              quotesLoadingStatus: RequestStatus.FETCHED,
            },
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

const mockHardwareAccount = createMockInternalAccount({
  address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  keyringType: KeyringTypes.ledger,
});
export const AlertsPresentStory = () => {
  return <CrossChainSwap location={{ search: '' }} />;
};
AlertsPresentStory.storyName = 'Alerts present';
AlertsPresentStory.decorators = [
  (Story) => (
    <Wrapper>
      <Provider
        store={configureStore(
          createBridgeMockStore({
            featureFlagOverrides: mockFeatureFlags,
            bridgeSliceOverrides: {
              ...mockBridgeSlice,
              txAlert: {
                titleId: 'txAlertTitle',
                description: 'The transaction is going to fail',
                descriptionId: 'bridgeSelectDifferentQuote',
              },
              toChainId: formatChainIdToCaip(CHAIN_IDS.POLYGON),
              toToken: {
                address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
                occurrences: 1,
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
          }),
        )}
      >
        <Story />
      </Provider>
    </Wrapper>
  ),
];

export default storybook;
