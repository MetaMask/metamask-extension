/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import type { PaymentMethod, Quote } from '@metamask/ramps-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { RampsPaymentMethodScreen } from './payment-method';

const mockNavigate = jest.fn();
const mockSetSelectedPaymentMethod = jest.fn().mockResolvedValue(undefined);
const mockUseRampsQuotes = jest.fn();
let mockLocationState: { amount?: number } | null = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/ramps/payment-method',
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

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(() => null),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
);
const { getInternalAccountBySelectedAccountGroupAndCaip } = jest.requireMock(
  '../../../selectors/multichain-accounts/account-tree',
);

const createStore = (orders: unknown[] = []) =>
  configureStore({
    metamask: {
      orders,
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

const bankTransfer: PaymentMethod = {
  id: 'bank-transfer',
  paymentType: 'bank-transfer',
  name: 'Bank transfer',
  score: 0,
  icon: 'bank',
  delay: [0, 0],
};

const selectedToken = {
  assetId: 'eip155:1/slip44:60',
  symbol: 'ETH',
  chainId: 'eip155:1',
};

const selectedProvider = {
  id: '/providers/test',
  name: 'Test Provider',
};

const debitQuote: Quote = {
  provider: selectedProvider.id,
  quote: {
    amountIn: 100,
    amountOut: '0.05',
    paymentMethod: debitCard.id,
    amountOutInFiat: 99.5,
  },
};

const defaultControllerState = {
  paymentMethods: [debitCard, bankTransfer],
  paymentMethodsLoading: false,
  paymentMethodsStatus: 'success',
  paymentMethodsError: null,
  selectedPaymentMethod: debitCard,
  providers: [],
  providersLoading: false,
  providersError: null,
  setSelectedProvider: jest.fn().mockResolvedValue(undefined),
  selectedProvider,
  selectedToken,
  userRegion: {
    regionCode: 'us',
    country: { currency: 'USD' },
  },
  setSelectedPaymentMethod: mockSetSelectedPaymentMethod,
};

describe('RampsPaymentMethodScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    mockSetSelectedPaymentMethod.mockResolvedValue(undefined);
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

  it('matches snapshot with payment methods', () => {
    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('tags only payment methods used by a completed order', () => {
    const orders = [
      {
        walletAddress: '0xABC123',
        status: 'COMPLETED',
        paymentMethod: { id: 'debit-credit-card' },
      },
      {
        walletAddress: '0xabc123',
        status: 'PENDING',
        paymentMethod: { id: 'bank-transfer' },
      },
      {
        walletAddress: '0xsomeoneelse',
        status: 'COMPLETED',
        paymentMethod: { id: 'bank-transfer' },
      },
    ];

    const { queryByTestId } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(orders),
      '/ramps/payment-method',
    );

    expect(
      queryByTestId('ramps-payment-method-item-tag-debit-credit-card'),
    ).toBeInTheDocument();
    // Pending order, and another account's completed order, do not count.
    expect(
      queryByTestId('ramps-payment-method-item-tag-bank-transfer'),
    ).not.toBeInTheDocument();
  });

  it('matches snapshot while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: true,
      paymentMethodsStatus: 'loading',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when payment methods query is idle', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: false,
      paymentMethodsStatus: 'idle',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps back navigation available while loading', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: true,
      paymentMethodsStatus: 'loading',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-back'));
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('keeps back navigation available when idle', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsLoading: false,
      paymentMethodsStatus: 'idle',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-back'));
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('matches snapshot when payment methods fail to load', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      paymentMethodsStatus: 'error',
      paymentMethodsError: 'Failed to load payment methods',
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when no payment methods are available', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethods: [],
      selectedPaymentMethod: null,
      userRegion: null,
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps cached methods visible when a refetch errors', () => {
    useRampsController.mockReturnValue({
      ...defaultControllerState,
      paymentMethodsStatus: 'error',
      paymentMethodsError: 'Failed to load payment methods',
    });

    const { container } = renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(
      screen.getByTestId('ramps-payment-method-screen'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('ramps-payment-method-error'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('ramps-change-provider-button'),
    ).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('fetches quotes for all payment method ids when amount is provided', () => {
    mockLocationState = { amount: 100 };

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(mockUseRampsQuotes).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 100,
        walletAddress: '0xabc123',
        region: 'us',
        fiat: 'USD',
        paymentMethods: [debitCard.id, bankTransfer.id],
        providers: [selectedProvider.id],
      }),
    );
  });

  it('matches snapshot with per-method quotes', () => {
    mockLocationState = { amount: 100 };
    mockUseRampsQuotes.mockReturnValue({
      data: {
        success: [debitQuote],
        sorted: [],
        error: [],
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
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(container).toMatchSnapshot();
  });

  it('keeps payment methods selectable when they have no success quote', async () => {
    mockLocationState = { amount: 100 };
    mockUseRampsQuotes.mockReturnValue({
      data: {
        success: [debitQuote],
        sorted: [],
        error: [],
        customActions: [],
      },
      loading: false,
      status: 'success',
      isSuccess: true,
      error: null,
      getQuotes: jest.fn(),
      getBuyWidgetData: jest.fn(),
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    const bankRow = screen.getByTestId(
      'ramps-payment-method-item-bank-transfer',
    );
    expect(bankRow).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(bankRow);
    });

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith(bankTransfer);
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('selects a payment method and navigates back', async () => {
    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-payment-method-item-bank-transfer'),
      );
    });

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith(bankTransfer);
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('ignores a second tap while selection is in flight', async () => {
    let resolveSelect: (() => void) | undefined;
    mockSetSelectedPaymentMethod.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSelect = resolve;
        }),
    );

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(
      screen.getByTestId('ramps-payment-method-item-bank-transfer'),
    );
    fireEvent.click(
      screen.getByTestId('ramps-payment-method-item-debit-credit-card'),
    );

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSelect?.();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('does not navigate back when selection fails', async () => {
    mockSetSelectedPaymentMethod.mockRejectedValue(new Error('failed'));

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('ramps-payment-method-item-bank-transfer'),
      );
    });

    expect(mockSetSelectedPaymentMethod).toHaveBeenCalledWith(bankTransfer);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to provider selection when change provider is clicked', () => {
    mockLocationState = { amount: 100 };

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    fireEvent.click(screen.getByTestId('ramps-change-provider-button'));

    expect(mockNavigate).toHaveBeenCalledWith('/ramps/provider-selection', {
      state: { amount: 100 },
    });
  });

  it('uses the chain-matching account address for non-EVM assets', () => {
    mockLocationState = { amount: 100 };

    const solanaAccount = {
      id: 'sol-account-1',
      address: '7NpQ2kKqLhB5rJ3mF8vXcYaZ9wEd1tGsR2VnQ4bHkU',
      metadata: { name: 'Solana Account' },
    };
    const solanaToken = {
      assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      symbol: 'SOL',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    };

    jest
      .mocked(getInternalAccountBySelectedAccountGroupAndCaip)
      .mockReturnValue(solanaAccount);

    useRampsController.mockReturnValue({
      ...defaultControllerState,
      selectedToken: solanaToken,
    });

    renderWithProvider(
      <RampsPaymentMethodScreen />,
      createStore(),
      '/ramps/payment-method',
    );

    expect(mockUseRampsQuotes).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '7NpQ2kKqLhB5rJ3mF8vXcYaZ9wEd1tGsR2VnQ4bHkU',
      }),
    );
  });
});
