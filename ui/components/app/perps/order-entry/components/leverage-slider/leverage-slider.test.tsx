import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
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

      // Use 3x to avoid collision with preset buttons
      expect(screen.getByText('3x')).toBeInTheDocument();
    });

    it('renders the slider container', () => {
      renderWithProvider(<LeverageSlider {...defaultProps} />, mockStore);

      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    });

    it('renders preset buttons within allowed range', () => {
      // LEVERAGE_PRESETS = [5, 10, 25, 50], so with maxLeverage=50, all should render
      renderWithProvider(
        <LeverageSlider {...defaultProps} maxLeverage={50} />,
        mockStore,
      );

      expect(screen.getByTestId('leverage-preset-5')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-10')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-50')).toBeInTheDocument();
    });

    it('filters preset buttons based on maxLeverage', () => {
      // LEVERAGE_PRESETS = [5, 10, 25, 50], so with maxLeverage=10, only 5 and 10 should render
      renderWithProvider(
        <LeverageSlider {...defaultProps} maxLeverage={10} />,
        mockStore,
      );

      expect(screen.getByTestId('leverage-preset-5')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-10')).toBeInTheDocument();
      expect(
        screen.queryByTestId('leverage-preset-25'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('leverage-preset-50'),
      ).not.toBeInTheDocument();
    });

    it('filters preset buttons based on minLeverage', () => {
      // LEVERAGE_PRESETS = [5, 10, 25, 50], so with minLeverage=10 and maxLeverage=50,
      // presets 10, 25, and 50 should render (5 is below minLeverage)
      renderWithProvider(
        <LeverageSlider {...defaultProps} minLeverage={10} maxLeverage={50} />,
        mockStore,
      );

      expect(screen.queryByTestId('leverage-preset-5')).not.toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-10')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-25')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-preset-50')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onLeverageChange when preset button is clicked', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('leverage-preset-10'));

      expect(onLeverageChange).toHaveBeenCalledWith(10);
    });

    it('calls onLeverageChange for each preset button', () => {
      const onLeverageChange = jest.fn();
      // LEVERAGE_PRESETS = [5, 10, 25, 50], use maxLeverage=50 to render all presets
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          maxLeverage={50}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('leverage-preset-5'));
      expect(onLeverageChange).toHaveBeenLastCalledWith(5);

      fireEvent.click(screen.getByTestId('leverage-preset-25'));
      expect(onLeverageChange).toHaveBeenLastCalledWith(25);

      fireEvent.click(screen.getByTestId('leverage-preset-50'));
      expect(onLeverageChange).toHaveBeenLastCalledWith(50);
    });

    it('applies active style to selected preset', () => {
      renderWithProvider(
        <LeverageSlider {...defaultProps} leverage={10} />,
        mockStore,
      );

      const activePreset = screen.getByTestId('leverage-preset-10');
      expect(activePreset).toHaveClass('bg-muted');
    });

    it('does not apply active style to non-selected presets', () => {
      renderWithProvider(
        <LeverageSlider {...defaultProps} leverage={10} />,
        mockStore,
      );

      const inactivePreset = screen.getByTestId('leverage-preset-5');
      expect(inactivePreset).not.toHaveClass('bg-muted');
    });
  });
});
