import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { LeverageSlider } from './leverage-slider';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_EVENT_PROPERTY: {
    TIMESTAMP: 'perps_timestamp',
    SCREEN_TYPE: 'screen_type',
    INTERACTION_TYPE: 'interaction_type',
    PREVIOUS_SCREEN: 'previous_screen',
    CURRENT_SCREEN: 'current_screen',
    TAB_NAME: 'tab_name',
    ASSET: 'asset',
    BUTTON_CLICKED: 'button_clicked',
    CANDLE_PERIOD: 'candle_period',
    STATUS: 'status',
    FAILURE_REASON: 'failure_reason',
    ORDER_TYPE: 'order_type',
    DIRECTION: 'direction',
    SELECTED_ORDER_TYPE: 'selected_order_type',
    PERCENTAGE_CLOSED: 'percentage_closed',
    ERROR_TYPE: 'error_type',
    ERROR_MESSAGE: 'error_message',
    LEVERAGE: 'leverage',
  },
  PERPS_EVENT_VALUE: {
    SCREEN_TYPE: {
      MARKET_LIST: 'market_list',
      TRADING: 'trading',
      ASSET_DETAILS: 'asset_details',
      ACTIVITY: 'activity',
      TUTORIAL: 'tutorial',
      POSITION_CLOSE: 'position_close',
      ADD_MARGIN: 'add_margin',
      REMOVE_MARGIN: 'remove_margin',
      INCREASE_EXPOSURE: 'increase_exposure',
    },
    INTERACTION_TYPE: {
      ORDER_TYPE_SELECTED: 'order_type_selected',
      TAP: 'tap',
      BUTTON_CLICKED: 'button_clicked',
      LEVERAGE_CHANGED: 'leverage_changed',
      CANDLE_PERIOD_CHANGED: 'candle_period_changed',
      FAVORITE_TOGGLED: 'favorite_toggled',
      SEARCH_CLICKED: 'search_clicked',
      TUTORIAL_STARTED: 'tutorial_started',
      TUTORIAL_COMPLETED: 'tutorial_completed',
      TUTORIAL_NAVIGATION: 'tutorial_navigation',
    },
    BUTTON_CLICKED: {
      DEPOSIT: 'deposit',
      WITHDRAW: 'withdraw',
    },
    DIRECTION: {
      LONG: 'long',
      SHORT: 'short',
    },
    STATUS: {
      FAILED: 'failed',
      SUCCESS: 'success',
    },
    ERROR_TYPE: {
      BACKEND: 'backend',
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
