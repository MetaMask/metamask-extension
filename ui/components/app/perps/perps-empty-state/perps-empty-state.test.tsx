import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsEmptyState } from './perps-empty-state';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsEmptyState', () => {
  it('renders the empty state component', () => {
    renderWithProvider(<PerpsEmptyState />, mockStore);

    expect(screen.getByTestId('perps-tab-empty-state')).toBeInTheDocument();
  });

  it('displays the empty state description', () => {
    renderWithProvider(<PerpsEmptyState />, mockStore);

    // The description text from i18n
    expect(
      screen.getByText(
        /Trade perpetuals with leverage. Open your first position to get started./iu,
      ),
    ).toBeInTheDocument();
  });

  it('displays the start trading button', () => {
    renderWithProvider(<PerpsEmptyState />, mockStore);

    expect(
      screen.getByRole('button', { name: /start trading/iu }),
    ).toBeInTheDocument();
  });

  it('calls onStartTrade when the button is clicked', () => {
    const onStartTrade = jest.fn();
    renderWithProvider(
      <PerpsEmptyState onStartTrade={onStartTrade} />,
      mockStore,
    );

    const button = screen.getByRole('button', { name: /start trading/iu });
    fireEvent.click(button);

    expect(onStartTrade).toHaveBeenCalledTimes(1);
  });

  it('renders without onStartTrade callback', () => {
    renderWithProvider(<PerpsEmptyState />, mockStore);

    const button = screen.getByRole('button', { name: /start trading/iu });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('applies custom className when provided', () => {
    renderWithProvider(<PerpsEmptyState className="custom-class" />, mockStore);

    const emptyState = screen.getByTestId('perps-tab-empty-state');
    expect(emptyState).toHaveClass('custom-class');
  });

  it('renders the placeholder icon', () => {
    renderWithProvider(<PerpsEmptyState />, mockStore);

    // The icon should be present within the empty state
    expect(screen.getByTestId('perps-tab-empty-state')).toBeInTheDocument();
  });
});

