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
import { RampsProviderSelectionModal } from './provider-selection';

const mockOnClose = jest.fn();
const mockSetSelectedProvider = jest.fn().mockResolvedValue(undefined);
const mockUseRampsQuotes = jest.fn();

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
} as unknown as Provider;

const moonpay = {
  id: '/providers/moonpay',
  name: 'MoonPay',
  supportedCryptoCurrencies: { 'eip155:1/slip44:60': true },
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

describe('RampsProviderSelectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const { baseElement } = renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={0} />,
      createStore(),
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      providers: [],
      providersLoading: true,
      selectedProvider: null,
    });

    const { baseElement } = renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={0} />,
      createStore(),
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot when empty', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      providers: [],
      selectedProvider: null,
    });

    const { baseElement } = renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={0} />,
      createStore(),
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('renders nothing when closed', () => {
    renderWithProvider(
      <RampsProviderSelectionModal
        isOpen={false}
        onClose={mockOnClose}
        amount={0}
      />,
      createStore(),
    );

    expect(
      screen.queryByTestId('ramps-provider-selection-screen'),
    ).not.toBeInTheDocument();
  });

  it('fetches quotes for all providers when amount and payment method exist', () => {
    renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={100} />,
      createStore(),
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
    mockUseRampsQuotes.mockReturnValue({
      data: null,
      loading: true,
      status: 'loading',
      isSuccess: false,
      error: null,
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
    });

    const { baseElement } = renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={100} />,
      createStore(),
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
    expect(baseElement).toMatchSnapshot();
  });

  it('matches snapshot with provider quotes', () => {
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

    const { baseElement } = renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={100} />,
      createStore(),
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('selects a provider and closes the modal', async () => {
    renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={0} />,
      createStore(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-provider-item-/providers/moonpay'),
      );
    });

    expect(mockSetSelectedProvider).toHaveBeenCalledWith(moonpay);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes when the close button is clicked', () => {
    renderWithProvider(
      <RampsProviderSelectionModal isOpen onClose={mockOnClose} amount={0} />,
      createStore(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
