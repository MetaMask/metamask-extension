import { screen, fireEvent } from '@testing-library/react';
import React from 'react';

import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import { DirectionTabs } from './direction-tabs';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('DirectionTabs', () => {
  const defaultProps = {
    direction: 'long' as const,
    onDirectionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders Long and Short tabs', () => {
      renderWithProvider(<DirectionTabs {...defaultProps} />, mockStore);

      expect(screen.getByText(messages.perpsLong.message)).toBeInTheDocument();
      expect(screen.getByText(messages.perpsShort.message)).toBeInTheDocument();
    });

    it('renders both tabs with correct test ids', () => {
      renderWithProvider(<DirectionTabs {...defaultProps} />, mockStore);

      expect(screen.getByTestId('direction-tab-long')).toBeInTheDocument();
      expect(screen.getByTestId('direction-tab-short')).toBeInTheDocument();
    });
  });

  describe('direction switching', () => {
    it('calls onDirectionChange when the inactive tab is clicked', () => {
      renderWithProvider(<DirectionTabs {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('direction-tab-short'));

      expect(defaultProps.onDirectionChange).toHaveBeenCalledWith('short');
    });

    it('does not call onDirectionChange when the active tab is clicked', () => {
      renderWithProvider(<DirectionTabs {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('direction-tab-long'));

      expect(defaultProps.onDirectionChange).not.toHaveBeenCalled();
    });
  });
});
