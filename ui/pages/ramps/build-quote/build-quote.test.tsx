/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { getPendingOrderPreview } from '../../../hooks/ramps/utils/pendingOrderPreview';
import { RampsBuildQuoteScreen } from './build-quote';

const QUOTE_DEBOUNCE_MS = 500;

const mockNavigate = jest.fn();
const mockGetBuyWidgetData = jest.fn();
const mockAddPrecreatedOrder = jest.fn();
const mockRemoveOrder = jest.fn();
const mockOpenTab = jest.fn();
const mockWatchRampsCheckoutTab = jest.fn();
const mockShowBuyTabOpenedToast = jest.fn();
let mockLocationState: { assetId?: string } | null = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: '/ramps/build-quote',
    state: mockLocationState,
  }),
}));

jest.mock('../../../../shared/lib/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/lib/selectors/networks'),
  getAllNetworkConfigurationsByCaipChainId: jest.fn(() => ({
    'eip155:1': { chainId: 'eip155:1', name: 'Ethereum' },
  })),
}));

jest.mock('../../../hooks/ramps/useRampsController', () => ({
  useRampsController: jest.fn(),
}));

jest.mock('../../../hooks/ramps/useRampsQuotes', () => ({
  useRampsQuotes: jest.fn(),
}));

jest.mock('../../../store/controller-actions/ramps-controller', () => ({
  watchRampsCheckoutTab: (...args: unknown[]) =>
    mockWatchRampsCheckoutTab(...args),
}));

jest.mock('../../../helpers/utils/show-buy-tab-opened-toast', () => ({
  showBuyTabOpenedToast: (...args: unknown[]) =>
    mockShowBuyTabOpenedToast(...args),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
);
const { useRampsQuotes } = jest.requireMock(
  '../../../hooks/ramps/useRampsQuotes',
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

type MockSelectedToken = typeof mockSelectedToken;

type MockControllerStateOptions = {
  userRegion?: {
    regionCode: string;
    country: {
      currency: string;
      isoCode: string;
      name: string;
      defaultAmount?: number;
    };
  };
  selectedToken?: MockSelectedToken | null;
  tokensLoading?: boolean;
};

const mockControllerState = ({
  userRegion = {
    regionCode: 'us-ca',
    country: {
      currency: 'USD',
      isoCode: 'US',
      name: 'United States',
      defaultAmount: 100,
    },
  },
  selectedToken = mockSelectedToken,
  tokensLoading = false,
}: MockControllerStateOptions = {}) => ({
  userRegion,
  selectedToken,
  tokensLoading,
  selectedProvider: { id: 'transak', name: 'Transak' },
  selectedPaymentMethod: { id: 'debit-credit-card', name: 'Debit card' },
  paymentMethods: [{ id: 'debit-credit-card', name: 'Debit card' }],
  paymentMethodsStatus: 'success',
  getBuyWidgetData: mockGetBuyWidgetData,
  addPrecreatedOrder: mockAddPrecreatedOrder,
  removeOrder: mockRemoveOrder,
});

describe('RampsBuildQuoteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
    (global as unknown as { platform: { openTab: jest.Mock } }).platform = {
      openTab: mockOpenTab,
    };
    useRampsController.mockReturnValue(mockControllerState());
    useRampsQuotes.mockReturnValue({
      data: {
        success: [{ provider: 'transak', id: 'quote-1' }],
        error: [],
      },
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('disables continue while amount debounce has not settled', () => {
    jest.useFakeTimers();

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(screen.getByTestId('ramps-build-quote-continue')).toBeEnabled();

    fireEvent.change(screen.getByTestId('ramps-build-quote-amount-input'), {
      target: { value: '25' },
    });

    expect(screen.getByTestId('ramps-build-quote-continue')).toBeDisabled();
  });

  it('opens the provider widget, watches the tab, and returns home on continue', async () => {
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
      orderId: 'order-123',
    });
    mockAddPrecreatedOrder.mockResolvedValue(undefined);
    mockOpenTab.mockResolvedValue({ id: 42 });
    mockWatchRampsCheckoutTab.mockResolvedValue(undefined);

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockGetBuyWidgetData).toHaveBeenCalledWith({
      provider: 'transak',
      id: 'quote-1',
    });
    expect(mockAddPrecreatedOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-123',
        walletAddress: '0xabc123',
        chainId: 'eip155:1',
      }),
    );
    expect(mockOpenTab).toHaveBeenCalledWith({
      url: 'https://provider.example/checkout',
    });
    expect(mockWatchRampsCheckoutTab).toHaveBeenCalledWith({
      tabId: 42,
      providerCode: 'transak',
      walletAddress: '0xabc123',
      orderAlreadyPrecreated: true,
      orderCode: 'order-123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('stashes the selected token/fiat amount as a best-effort preview for the pending order', async () => {
    // A freshly precreated order has no token/amount/fees until the provider
    // fills it in — the details view falls back to what was picked here.
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
      orderId: 'order-123',
    });
    mockAddPrecreatedOrder.mockResolvedValue(undefined);
    mockOpenTab.mockResolvedValue({ id: 42 });

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(getPendingOrderPreview('order-123')).toMatchObject({
      cryptoCurrency: {
        symbol: mockSelectedToken.symbol,
        assetId: mockSelectedToken.assetId,
        decimals: mockSelectedToken.decimals,
      },
      fiatCurrency: { symbol: 'USD' },
    });
  });

  it('watches redirect-only checkouts without precreating an order', async () => {
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
    });
    mockOpenTab.mockResolvedValue({ id: 7 });
    mockWatchRampsCheckoutTab.mockResolvedValue(undefined);

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockAddPrecreatedOrder).not.toHaveBeenCalled();
    expect(mockWatchRampsCheckoutTab).toHaveBeenCalledWith({
      tabId: 7,
      providerCode: 'transak',
      walletAddress: '0xabc123',
      orderAlreadyPrecreated: false,
      orderCode: undefined,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('normalizes a full-path orderId when stashing the pending-order preview', async () => {
    // Some providers (e.g. MoonPay) return orderId as a full path
    // ("providers/moonpay-staging/orders/c-abc123") rather than a bare code.
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
      orderId: 'providers/moonpay-staging/orders/c-abc123',
    });
    mockAddPrecreatedOrder.mockResolvedValue(undefined);
    mockOpenTab.mockResolvedValue({ id: 42 });

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(getPendingOrderPreview('c-abc123')).toMatchObject({
      fiatCurrency: { symbol: 'USD' },
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('surfaces an error and does not navigate when the opened tab has no id', async () => {
    // Without a tab id the background watcher cannot resolve the order, so the
    // user must not be sent home believing checkout is being tracked.
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
    });
    mockOpenTab.mockResolvedValue({});

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockWatchRampsCheckoutTab).not.toHaveBeenCalled();
    expect(mockShowBuyTabOpenedToast).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('ramps-build-quote-error')).toHaveTextContent(
      messages.rampsBuyWidgetError.message,
    );
  });

  it('cleans up precreated data when the opened tab has no id', async () => {
    const precreatedOrderId = 'providers/transak/orders/order-no-tab-id';
    const precreatedOrderCode = 'order-no-tab-id';
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
      orderId: precreatedOrderId,
    });
    mockOpenTab.mockResolvedValue({});

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockAddPrecreatedOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: precreatedOrderId,
      }),
    );
    expect(mockRemoveOrder).toHaveBeenCalledWith(precreatedOrderId);
    expect(getPendingOrderPreview(precreatedOrderCode)).toBeUndefined();
  });

  it('surfaces an error and does not navigate when the widget has no url', async () => {
    mockGetBuyWidgetData.mockResolvedValue(null);

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(mockAddPrecreatedOrder).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('ramps-build-quote-error')).toHaveTextContent(
      messages.rampsBuyWidgetError.message,
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
    useRampsController.mockReturnValue(
      mockControllerState({
        selectedToken: null,
        tokensLoading: true,
      }),
    );

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot redirecting when intent token never settles after load', () => {
    mockLocationState = {
      assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000001',
    };
    useRampsController.mockReturnValue(
      mockControllerState({
        selectedToken: null,
        tokensLoading: false,
      }),
    );

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot redirecting when settled token mismatches intent after load', () => {
    mockLocationState = {
      assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000001',
    };
    useRampsController.mockReturnValue(
      mockControllerState({
        selectedToken: {
          ...mockSelectedToken,
          assetId: 'eip155:1/slip44:60',
          symbol: 'ETH',
          name: 'Ether',
        },
        tokensLoading: false,
      }),
    );

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with regional default amount', () => {
    jest.useFakeTimers();
    useRampsController.mockReturnValue(
      mockControllerState({
        userRegion: {
          regionCode: 'gb',
          country: {
            currency: 'GBP',
            isoCode: 'GB',
            name: 'United Kingdom',
            defaultAmount: 50,
          },
        },
      }),
    );

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    act(() => {
      jest.advanceTimersByTime(QUOTE_DEBOUNCE_MS);
    });

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when falling back without regional default amount', () => {
    useRampsController.mockReturnValue(
      mockControllerState({
        userRegion: {
          regionCode: 'us-ca',
          country: {
            currency: 'USD',
            isoCode: 'US',
            name: 'United States',
          },
        },
      }),
    );

    const { container } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(container).toMatchSnapshot();
  });

  it('matches snapshot after user edits amount before regional default applies', () => {
    jest.useFakeTimers();
    useRampsController.mockReturnValue(
      mockControllerState({
        userRegion: {
          regionCode: 'us-ca',
          country: {
            currency: 'USD',
            isoCode: 'US',
            name: 'United States',
          },
        },
      }),
    );

    const { container, rerender } = renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    fireEvent.change(screen.getByTestId('ramps-build-quote-amount-input'), {
      target: { value: '25' },
    });

    useRampsController.mockReturnValue(
      mockControllerState({
        userRegion: {
          regionCode: 'gb',
          country: {
            currency: 'GBP',
            isoCode: 'GB',
            name: 'United Kingdom',
            defaultAmount: 50,
          },
        },
      }),
    );

    rerender(<RampsBuildQuoteScreen />);

    act(() => {
      jest.advanceTimersByTime(QUOTE_DEBOUNCE_MS);
    });

    expect(container).toMatchSnapshot();
  });

  it('navigates to payment method selection when the pill is clicked', () => {
    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    fireEvent.click(screen.getByTestId('ramps-payment-method-pill'));

    expect(mockNavigate).toHaveBeenCalledWith('/ramps/payment-method', {
      state: { amount: expect.any(Number) },
    });
  });
});
