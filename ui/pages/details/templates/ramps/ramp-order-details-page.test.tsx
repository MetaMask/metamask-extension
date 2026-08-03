import React from 'react';
import { render } from '@testing-library/react';
import {
  MemoryRouter,
  type MemoryRouterProps,
  Route,
  Routes,
} from 'react-router-dom';
import { useRampsDetailsItem } from './hooks';
import RampOrderDetailsPage from './ramp-order-details-page';

const memoryRouterFuture = {
  ['v7_startTransition' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
  ['v7_relativeSplatPath' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
} as NonNullable<MemoryRouterProps['future']>;

jest.mock('../../components/header', () => ({
  Header: ({ item }: { item?: { type?: string; data?: { id?: string } } }) => (
    <div
      data-testid="header"
      data-item-type={item?.type}
      data-order-id={item?.data?.id}
    />
  ),
}));

jest.mock('./ramp-order-details', () => ({
  RampOrderDetails: ({
    item,
  }: {
    item?: { type?: string; data?: { id?: string } };
  }) => (
    <div
      data-testid="ramp-order-details"
      data-item-type={item?.type}
      data-order-id={item?.data?.id}
    />
  ),
}));

jest.mock('./hooks', () => ({
  useRampsDetailsItem: jest.fn(),
}));

const mockUseRampsDetailsItem = jest.mocked(useRampsDetailsItem);

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={memoryRouterFuture}>
      <Routes>
        <Route
          path="/ramps/order/:caipChainId/:txIdentifier"
          element={<RampOrderDetailsPage />}
        />
        <Route path="/activity" element={<div data-testid="activity" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RampOrderDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRampsDetailsItem.mockReturnValue(undefined);
  });

  it('redirects to activity when no ramps order matches', () => {
    const { getByTestId, queryByTestId } = renderPage(
      '/ramps/order/eip155:1/order-1',
    );

    expect(getByTestId('activity')).toBeInTheDocument();
    expect(queryByTestId('ramp-order-details')).not.toBeInTheDocument();
  });

  it('renders ramps details when an order matches', () => {
    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { getByTestId } = renderPage('/ramps/order/eip155:1/order-1');

    expect(mockUseRampsDetailsItem).toHaveBeenCalledWith('order-1', 'eip155:1');
    expect(getByTestId('header')).toHaveAttribute('data-item-type', 'rampBuy');
    expect(getByTestId('ramp-order-details')).toHaveAttribute(
      'data-order-id',
      'order-1',
    );
  });
});
