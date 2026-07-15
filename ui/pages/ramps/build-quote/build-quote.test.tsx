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

    expect(
      screen.getByTestId('ramps-build-quote-provider-label'),
    ).toHaveTextContent(
      messages.rampsBuyingViaProvider.message.replace('$1', 'Transak'),
    );
    expect(screen.getByTestId('ramps-build-quote-continue')).toBeDisabled();
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
});
