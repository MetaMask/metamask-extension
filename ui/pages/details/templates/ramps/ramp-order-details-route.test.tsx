import React from 'react';
import { render } from '@testing-library/react';
import { useRampsDetailsItem } from './hooks';
import { RampOrderDetailsRoute } from './ramp-order-details-route';

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

describe('RampOrderDetailsRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRampsDetailsItem.mockReturnValue(undefined);
  });

  it('renders children when no ramps order matches', () => {
    const { getByTestId, queryByTestId } = render(
      <RampOrderDetailsRoute
        chainId="eip155:1"
        txIdentifier="0xabc"
        onBack={jest.fn()}
      >
        <div data-testid="generic-details" />
      </RampOrderDetailsRoute>,
    );

    expect(getByTestId('generic-details')).toBeInTheDocument();
    expect(queryByTestId('ramp-order-details')).not.toBeInTheDocument();
  });

  it('renders ramps details instead of children when an order matches', () => {
    mockUseRampsDetailsItem.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { getByTestId, queryByTestId } = render(
      <RampOrderDetailsRoute
        chainId="eip155:1"
        txIdentifier="order-1"
        onBack={jest.fn()}
      >
        <div data-testid="generic-details" />
      </RampOrderDetailsRoute>,
    );

    expect(queryByTestId('generic-details')).not.toBeInTheDocument();
    expect(getByTestId('header')).toMatchSnapshot();
    expect(getByTestId('ramp-order-details')).toMatchSnapshot();
  });
});
