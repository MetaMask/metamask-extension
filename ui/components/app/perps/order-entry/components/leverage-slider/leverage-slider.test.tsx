import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { LeverageSlider } from './leverage-slider';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('LeverageSlider', () => {
  const defaultProps = {
    leverage: 1,
    onLeverageChange: jest.fn(),
    maxLeverage: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the leverage label', () => {
      renderWithProvider(<LeverageSlider {...defaultProps} />, mockStore);

      expect(screen.getByText('Leverage')).toBeInTheDocument();
    });

    it('displays current leverage value', () => {
      renderWithProvider(
        <LeverageSlider {...defaultProps} leverage={3} />,
        mockStore,
      );

      expect(screen.getByText('3x')).toBeInTheDocument();
    });

    it('renders the slider container', () => {
      renderWithProvider(<LeverageSlider {...defaultProps} />, mockStore);

      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    });
  });
});
