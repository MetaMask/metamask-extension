/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { RampsBuildQuoteScreen } from './build-quote';

const QUOTE_DEBOUNCE_MS = 500;

const mockNavigate = jest.fn();
const mockGetBuyWidgetData = jest.fn();
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

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(() => null),
}));

jest.mock('../../../store/controller-actions/ramps-controller', () => ({
  watchRampsCheckoutTab: (...args: unknown[]) =>
    mockWatchRampsCheckoutTab(...args),
}));

jest.mock('../../../helpers/utils/show-buy-tab-opened-toast', () => ({
  showBuyTabOpenedToast: (...args: unknown[]) =>
    mockShowBuyTabOpenedToast(...args),
}));

const mockUseRampsScreenViewed = jest.fn();
jest.mock('../../../hooks/ramps/useRampsScreenViewed', () => ({
  useRampsScreenViewed: (...args: unknown[]) =>
    mockUseRampsScreenViewed(...args),
}));

const { useRampsController } = jest.requireMock(
  '../../../hooks/ramps/useRampsController',
);
const { useRampsQuotes } = jest.requireMock(
  '../../../hooks/ramps/useRampsQuotes',
);
const { getInternalAccountBySelectedAccountGroupAndCaip } = jest.requireMock(
  '../../../selectors/multichain-accounts/account-tree',
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
  providers: [],
  providersLoading: false,
  providersError: null,
  setSelectedProvider: jest.fn().mockResolvedValue(undefined),
  selectedProvider: { id: 'transak', name: 'Transak' },
  selectedPaymentMethod: { id: 'debit-credit-card', name: 'Debit card' },
  paymentMethods: [{ id: 'debit-credit-card', name: 'Debit card' }],
  paymentMethodsStatus: 'success',
  getBuyWidgetData: mockGetBuyWidgetData,
});

describe('RampsBuildQuoteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = null;
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

  it('opens the provider widget via background watch and returns home on continue', async () => {
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
      orderId: 'order-123',
    });
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
    expect(mockWatchRampsCheckoutTab).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://provider.example/checkout',
        providerCode: 'transak',
        walletAddress: '0xabc123',
        orderCode: 'order-123',
        checkoutSessionId: expect.any(String),
        region: 'us-ca',
        providerName: 'Transak',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('watches redirect-only checkouts without an order code', async () => {
    mockGetBuyWidgetData.mockResolvedValue({
      url: 'https://provider.example/checkout',
    });
    mockWatchRampsCheckoutTab.mockResolvedValue(undefined);

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('ramps-build-quote-continue'));
    });

    expect(mockWatchRampsCheckoutTab).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://provider.example/checkout',
        providerCode: 'transak',
        walletAddress: '0xabc123',
        orderCode: undefined,
        checkoutSessionId: expect.any(String),
        region: 'us-ca',
        providerName: 'Transak',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
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

    expect(mockWatchRampsCheckoutTab).not.toHaveBeenCalled();
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

  it('does not fire screen-viewed on the redirect path', () => {
    mockLocationState = null;
    useRampsController.mockReturnValue(
      mockControllerState({
        selectedToken: null,
        tokensLoading: false,
      }),
    );

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(mockUseRampsScreenViewed).not.toHaveBeenCalled();
  });

  it('fires screen-viewed when the amount input is shown', () => {
    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(mockUseRampsScreenViewed).toHaveBeenCalledWith('Amount Input');
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

  it('uses the chain-matching account address for non-EVM assets', () => {
    const solanaAccount = {
      id: 'sol-account-1',
      address: '7NpQ2kKqLhB5rJ3mF8vXcYaZ9wEd1tGsR2VnQ4bHkU',
      metadata: { name: 'Solana Account' },
    };
    const solanaToken = {
      assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      iconUrl: 'https://example.com/sol.png',
      tokenSupported: true,
    };

    jest
      .mocked(getInternalAccountBySelectedAccountGroupAndCaip)
      .mockReturnValue(solanaAccount);

    useRampsController.mockReturnValue(
      mockControllerState({ selectedToken: solanaToken }),
    );

    renderWithProvider(
      <RampsBuildQuoteScreen />,
      createStore(),
      '/ramps/build-quote',
    );

    expect(useRampsQuotes).toHaveBeenCalledWith(
      expect.objectContaining({
        walletAddress: '7NpQ2kKqLhB5rJ3mF8vXcYaZ9wEd1tGsR2VnQ4bHkU',
        assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      }),
    );
  });
});
