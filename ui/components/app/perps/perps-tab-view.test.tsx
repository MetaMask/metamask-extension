import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import * as mocks from './mocks';
import { PerpsTabView } from './perps-tab-view';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsTabView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with default mock data (positions and orders)', () => {
    it('renders the perps tab view', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-tab-view')).toBeInTheDocument();
    });

    it('renders the control bar', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-tab-control-bar')).toBeInTheDocument();
    });

    it('shows positions section when mock positions exist', () => {
      // Default mocks have positions
      expect(mocks.mockPositions.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-positions-section')).toBeInTheDocument();
    });

    it('shows orders section when mock orders exist', () => {
      // Default mocks have orders
      expect(mocks.mockOrders.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-orders-section')).toBeInTheDocument();
    });

    it('does not show empty state when there are positions or orders', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(
        screen.queryByTestId('perps-tab-empty-state'),
      ).not.toBeInTheDocument();
    });

    it('renders position cards for each position', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      // Check that at least the first position is rendered
      expect(screen.getByTestId('position-card-ETH')).toBeInTheDocument();
    });

    it('renders order cards for each order', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      // Check that at least the first order is rendered
      expect(screen.getByTestId('order-card-order-001')).toBeInTheDocument();
    });

    it('shows the start new trade CTA when there are positions', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('start-new-trade-cta')).toBeInTheDocument();
    });

    it('displays position section header', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByText(/positions/iu)).toBeInTheDocument();
    });

    it('displays orders section header', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByText(/open orders/iu)).toBeInTheDocument();
    });

    it('displays close all option in positions section', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      // There should be at least one "Close all" text (one in positions, one in orders)
      const closeAllElements = screen.getAllByText(/close all/iu);
      expect(closeAllElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('component structure', () => {
    it('renders positions before orders', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      const positionsSection = screen.getByTestId('perps-positions-section');
      const ordersSection = screen.getByTestId('perps-orders-section');

      // Both should exist
      expect(positionsSection).toBeInTheDocument();
      expect(ordersSection).toBeInTheDocument();

      // Positions should come before orders in the DOM
      const view = screen.getByTestId('perps-tab-view');
      const children = view.querySelectorAll('[data-testid]');
      const childTestIds = Array.from(children).map((child) =>
        child.getAttribute('data-testid'),
      );

      const positionsIndex = childTestIds.indexOf('perps-positions-section');
      const ordersIndex = childTestIds.indexOf('perps-orders-section');

      expect(positionsIndex).toBeLessThan(ordersIndex);
    });
  });
});
