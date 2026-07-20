/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { RampsOrderDetailsScreen } from './order-details';

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
      screen.getByTestId('ramps-order-details-not-found'),
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
});
