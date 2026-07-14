/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { RampsBuildQuoteScreen } from './build-quote';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../../shared/lib/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': { chainId: 'eip155:1', name: 'Ethereum' },
  })),
}));

jest.mock('../../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

jest.mock('../../../../hooks/ramps/useRampsQuotes', () => ({
  useRampsQuotes: jest.fn(),
}));

const { useRampsController } = jest.requireMock(
  '../../../../hooks/ramps/useRampsController',
);
const { useRampsQuotes } = jest.requireMock(
  '../../../../hooks/ramps/useRampsQuotes',
);

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': {
            id: 'account-1',
            address: '0xabc123',
            metadata: { name: 'Account 1' },
          },
        },
      },
    },
  });

const mockSelectedToken = {
  assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000001',
  chainId: 'eip155:1',
  name: 'MetaMask USD',
  symbol: 'mUSD',
  decimals: 18,
  iconUrl: 'https://example.com/musd.png',
  tokenSupported: true,
};

describe('RampsBuildQuoteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRampsController.mockReturnValue({
      userRegion: {
        regionCode: 'us-ca',
        country: { currency: 'USD', isoCode: 'US', name: 'United States' },
      },
      selectedToken: mockSelectedToken,
      setSelectedToken: jest.fn(),
      tokensLoading: false,
      selectedProvider: { id: 'transak', name: 'Transak' },
      selectedPaymentMethod: { id: 'debit-credit-card', name: 'Debit card' },
      paymentMethods: [{ id: 'debit-credit-card', name: 'Debit card' }],
      paymentMethodsStatus: 'success',
    });
    useRampsQuotes.mockReturnValue({
      data: {
        success: [{ provider: 'transak', id: 'quote-1' }],
        error: [],
      },
      loading: false,
      error: null,
    });
  });

  it('matches snapshot when quote is available', () => {
    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while quote is loading', () => {
    useRampsQuotes.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when quote fetch fails', () => {
    useRampsQuotes.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('quote failed'),
    });

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('disables continue until a quote is available', () => {
    useRampsQuotes.mockReturnValue({
      data: { success: [], error: [] },
      loading: false,
      error: null,
    });

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(screen.getByTestId('ramps-build-quote-continue')).toBeDisabled();
    expect(
      screen.getByTestId('ramps-build-quote-provider-label'),
    ).toHaveTextContent(
      messages.rampsBuyingViaProvider.message.replace('$1', 'Transak'),
    );
  });

  it('matches snapshot with provider quote error', () => {
    useRampsQuotes.mockReturnValue({
      data: {
        success: [],
        error: [{ provider: 'transak', error: 'Minimum purchase is $5 USD' }],
      },
      loading: false,
      error: null,
    });

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while waiting for goToBuy preloaded token to settle', () => {
    useRampsController.mockReturnValue({
      userRegion: {
        regionCode: 'us-ca',
        country: { currency: 'USD', isoCode: 'US', name: 'United States' },
      },
      selectedToken: null,
      setSelectedToken: jest.fn(),
      tokensLoading: true,
      selectedProvider: { id: 'transak', name: 'Transak' },
      selectedPaymentMethod: { id: 'debit-credit-card', name: 'Debit card' },
      paymentMethods: [{ id: 'debit-credit-card', name: 'Debit card' }],
      paymentMethodsStatus: 'success',
    });

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });
});
