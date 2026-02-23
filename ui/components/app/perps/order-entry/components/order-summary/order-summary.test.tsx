import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { OrderSummary } from './order-summary';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderSummary', () => {
  describe('rendering', () => {
    it('renders all labels', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(screen.getByText('Margin')).toBeInTheDocument();
      expect(screen.getByText('Fees')).toBeInTheDocument();
      expect(screen.getByText('Liquidation Price Est.')).toBeInTheDocument();
    });

    it('displays dash when values are null', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements).toHaveLength(3);
    });

    it('displays margin required value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });

    it('displays estimated fees value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees="$0.50"
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });

    it('displays liquidation price value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(screen.getByText('$42,500.00')).toBeInTheDocument();
    });

    it('displays all values when provided', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees="$0.50"
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$0.50')).toBeInTheDocument();
      expect(screen.getByText('$42,500.00')).toBeInTheDocument();
    });
  });
});
