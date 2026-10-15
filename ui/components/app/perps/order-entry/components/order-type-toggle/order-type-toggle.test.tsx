import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import { OrderTypeToggle } from './order-type-toggle';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderTypeToggle', () => {
  const onOrderTypeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Market and Limit controls', () => {
    renderWithProvider(
      <OrderTypeToggle
        orderType="market"
        onOrderTypeChange={onOrderTypeChange}
      />,
      mockStore,
    );

    expect(screen.getByText(messages.perpsMarket.message)).toBeInTheDocument();
    expect(screen.getByText(messages.perpsLimit.message)).toBeInTheDocument();
    expect(screen.getByTestId('order-type-market')).toBeInTheDocument();
    expect(screen.getByTestId('order-type-limit')).toBeInTheDocument();
  });

  it('changes to the inactive order type', () => {
    renderWithProvider(
      <OrderTypeToggle
        orderType="market"
        onOrderTypeChange={onOrderTypeChange}
      />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('order-type-limit'));

    expect(onOrderTypeChange).toHaveBeenCalledWith('limit');
  });

  it('does not emit a change for the selected order type', () => {
    renderWithProvider(
      <OrderTypeToggle
        orderType="market"
        onOrderTypeChange={onOrderTypeChange}
      />,
      mockStore,
    );

    fireEvent.click(screen.getByTestId('order-type-market'));

    expect(onOrderTypeChange).not.toHaveBeenCalled();
  });
});
