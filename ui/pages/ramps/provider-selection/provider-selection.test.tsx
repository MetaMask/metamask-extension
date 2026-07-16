/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import type {
  PaymentMethod,
  Provider,
  Quote,
} from '@metamask/ramps-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { RampsProviderSelectionScreen } from './provider-selection';

const mockNavigate = jest.fn();
const mockSetSelectedProvider = jest.fn().mockResolvedValue(undefined);
const mockUseRampsQuotes = jest.fn();
let mockLocationState: { amount?: number } | null = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/ramps/provider-selection',
    search: '',
    hash: '',
    state: mockLocationState,
    key: 'default',
  }),
}));

jest.mock('../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

jest.mock('../../../hooks/ramps/useRampsQuotes', () => ({
  useRampsQuotes: (...args: unknown[]) => mockUseRampsQuotes(...args),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
);

const createStore = () =>
  configureStore({
    metamask: {
      selectedNetworkClientId: 'mainnet',
      currentCurrency: 'usd',
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

const debitCard: PaymentMethod = {
  id: 'debit-credit-card',
  paymentType: 'debit-credit-card',
  name: 'Debit card',
  score: 1,
  icon: 'card',
  delay: [5, 10],
};

const transak = {
  id: '/providers/transak',
  name: 'Transak',
  supportedCryptoCurrencies: { 'eip155:1/slip44:60': true },
  logos: {
    light: 'https://example.com/transak-light.png',
    dark: 'https://example.com/transak-dark.png',
    height: 24,
    width: 90,
  },
} as unknown as Provider;

const moonpay = {
  id: '/providers/moonpay',
  name: 'MoonPay',
  supportedCryptoCurrencies: { 'eip155:1/slip44:60': true },
  logos: {
    light: 'https://example.com/moonpay-light.png',
    dark: 'https://example.com/moonpay-dark.png',
    height: 24,
    width: 90,
  },
} as unknown as Provider;

const selectedToken = {
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  chainId: 'eip155:1',
};

const transakQuote: Quote = {
  provider: transak.id,
  quote: {
    amountIn: 100,
    amountOut: '0.05',
    paymentMethod: debitCard.id,
    amountOutInFiat: 99.5,
  },
};

const defaultControllerState = {
  providers: [transak, moonpay],
  providersLoading: false,
  providersError: null,
  selectedProvider: transak,
  setSelectedProvider: mockSetSelectedProvider,
  selectedPaymentMethod: debitCard,
  selectedToken,
  userRegion: {
    regionCode: 'US',
    country: { currency: 'USD' },
  },
};

describe('RampsProviderSelectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    mockSetSelectedProvider.mockResolvedValue(undefined);
    useRampsController.mockReturnValue(defaultControllerState);
    mockUseRampsQuotes.mockReturnValue({
      data: null,
      loading: false,
      status: 'idle',
      isSuccess: false,
      error: null,
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
    });
  });

  it('matches snapshot with providers', () => {
    const { container } = renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      providers: [],
      providersLoading: true,
      selectedProvider: null,
    });

    const { container } = renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when empty', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      providers: [],
      selectedProvider: null,
    });

    const { container } = renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('fetches quotes for all providers when amount and payment method exist', () => {
    mockLocationState = { amount: 100 };

    renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(mockUseRampsQuotes).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        walletAddress: '0xabc123',
        providers: [transak.id, moonpay.id],
        paymentMethods: [debitCard.id],
      }),
    );
  });

  it('keeps the provider list visible while quotes load', () => {
    mockLocationState = { amount: 100 };
    mockUseRampsQuotes.mockReturnValue({
      data: null,
      loading: true,
      status: 'loading',
      isSuccess: false,
      error: null,
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
    });

    const { container } = renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(
      screen.getByTestId('ramps-provider-item-/providers/transak'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('ramps-provider-item-/providers/moonpay'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('ramps-quote-display-loading')).toHaveLength(
      2,
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with provider quotes', () => {
    mockLocationState = { amount: 100 };
    mockUseRampsQuotes.mockReturnValue({
      data: {
        success: [transakQuote],
        sorted: [{ sortBy: 'reliability', ids: [transak.id, moonpay.id] }],
        error: [
          {
            provider: moonpay.id,
            error: 'Quote unavailable',
          },
        ],
        customActions: [],
      },
      loading: false,
      status: 'success',
      isSuccess: true,
      error: null,
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
    });

    const { container } = renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    expect(container).toMatchSnapshot();
  });

  it('selects a provider and navigates back', async () => {
    renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-provider-item-/providers/moonpay'),
      );
    });

    expect(mockSetSelectedProvider).toHaveBeenCalledWith(moonpay);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates back from the header', () => {
    renderWithProvider(
      <RampsProviderSelectionScreen />,
      createStore(),
      '/ramps/provider-selection',
    );

    fireEvent.click(screen.getByTestId('ramps-provider-selection-back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
