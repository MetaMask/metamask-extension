import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { LeverageSlider } from './leverage-slider';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_EVENT_PROPERTY: {
    INTERACTION_TYPE: 'interaction_type',
    LEVERAGE: 'leverage',
  },
  PERPS_EVENT_VALUE: {
    INTERACTION_TYPE: {
      LEVERAGE_CHANGED: 'leverage_changed',
    },
  },
}));

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

      expect(
        screen.getByText(messages.perpsLeverage.message),
      ).toBeInTheDocument();
    });

    it('displays current leverage value', () => {
      renderWithProvider(
        <LeverageSlider {...defaultProps} leverage={3} />,
        mockStore,
      );

      const container = screen.getByTestId('leverage-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('3');
      expect(screen.getByText('x')).toBeInTheDocument();
    });

    it('renders the slider container', () => {
      renderWithProvider(<LeverageSlider {...defaultProps} />, mockStore);

      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    });
  });
});
