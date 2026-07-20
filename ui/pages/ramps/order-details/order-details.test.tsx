/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { RampsOrderStatus, type RampsOrder } from '@metamask/ramps-controller';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { RampsOrderDetailsScreen } from './order-details';

const completedOrder = {
  providerOrderId: 'provider-order-1234567890',
  providerOrderLink: 'https://provider.example/order/1',
  status: RampsOrderStatus.Completed,
  createdAt: 1_700_000_000_000,
  cryptoAmount: '0.5',
  fiatAmount: 1000,
  totalFeesFiat: 12.5,
  cryptoCurrency: {
    symbol: 'ETH',
    iconUrl: 'https://x/eth.png',
    decimals: 18,
    chainId: 'eip155:1',
  },
  fiatCurrency: { symbol: 'USD', decimals: 2 },
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  provider: { id: 'transak', name: 'Transak' },
  walletAddress: '0xabc',
} as unknown as RampsOrder;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ orderId: 'order-1' }),
}));

jest.mock('../../../hooks/ramps/useRampsOrders', () => ({
  useRampsOrders: jest.fn(),
}));

const { useRampsOrders } = jest.requireMock(
  '../../../hooks/ramps/useRampsOrders',
);

const createStore = () => configureStore({ metamask: {} });

describe('RampsOrderDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue(undefined),
      refreshOrder: jest.fn(),
    });
  });

  it('renders the not-found state when the order is missing', () => {
    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    expect(
      screen.getByTestId('ramps-order-details-error'),
    ).toBeInTheDocument();
  });

  it('navigates to wallet overview when Done is clicked', () => {
    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-done'));
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('renders order content and the completed snapshot when an order exists', () => {
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue(completedOrder),
      refreshOrder: jest.fn(),
    });

    const { container } = renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    expect(screen.getByTestId('ramps-order-content')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('calls refreshOrder when retry is clicked for an existing order', async () => {
    const refreshOrder = jest.fn().mockResolvedValue(completedOrder);
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue({
        ...completedOrder,
        status: RampsOrderStatus.Pending,
      }),
      refreshOrder,
    });

    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-refresh'));

    expect(refreshOrder).toHaveBeenCalledWith(
      'transak',
      'provider-order-1234567890',
      '0xabc',
    );
  });

  it('shows the error state when refreshOrder throws', async () => {
    const refreshOrder = jest.fn().mockRejectedValue(new Error('boom'));
    useRampsOrders.mockReturnValue({
      getOrderById: jest.fn().mockReturnValue({
        ...completedOrder,
        status: RampsOrderStatus.Pending,
      }),
      refreshOrder,
    });

    renderWithProvider(
      <RampsOrderDetailsScreen />,
      createStore(),
      '/ramps/order-details/order-1',
    );

    fireEvent.click(screen.getByTestId('ramps-order-details-refresh'));

    expect(
      await screen.findByTestId('ramps-order-details-error'),
    ).toBeInTheDocument();
  });
});
