import React from 'react';
import { createEvent, fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
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

  describe('keyboard interaction', () => {
    const getInput = () =>
      screen
        .getByTestId('leverage-input')
        .querySelector('input') as HTMLInputElement;

    it('selects the existing value when the input is focused', () => {
      renderWithProvider(
        <LeverageSlider {...defaultProps} leverage={7} />,
        mockStore,
      );
      const input = getInput();
      input.focus();
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(String(7).length);
    });

    it('increments leverage by 1 on ArrowUp and clamps at maxLeverage', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={3}
          maxLeverage={5}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(onLeverageChange).toHaveBeenLastCalledWith(4);
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(onLeverageChange).toHaveBeenLastCalledWith(5);
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(onLeverageChange).toHaveBeenLastCalledWith(5);
    });

    it('decrements leverage by 1 on ArrowDown and clamps at minLeverage', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={2}
          minLeverage={1}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(onLeverageChange).toHaveBeenLastCalledWith(1);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(onLeverageChange).toHaveBeenLastCalledWith(1);
    });

    it('ignores non-arrow keys', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={3}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.keyDown(input, { key: 'a' });
      expect(onLeverageChange).not.toHaveBeenCalled();
    });

    it('swallows Enter so it does not bubble to an outer form', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={3}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      const event = createEvent.keyDown(input, { key: 'Enter' });
      fireEvent(input, event);
      expect(event.defaultPrevented).toBe(true);
      expect(onLeverageChange).not.toHaveBeenCalled();
    });

    it('commits typed digits within range via onChange', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={1}
          minLeverage={1}
          maxLeverage={20}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      fireEvent.change(input, { target: { value: '5' } });
      expect(onLeverageChange).toHaveBeenLastCalledWith(5);
    });

    it('clamps to minLeverage when blurred with empty/invalid value', () => {
      const onLeverageChange = jest.fn();
      renderWithProvider(
        <LeverageSlider
          {...defaultProps}
          leverage={3}
          minLeverage={1}
          maxLeverage={20}
          onLeverageChange={onLeverageChange}
        />,
        mockStore,
      );
      const input = getInput();
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
      expect(onLeverageChange).toHaveBeenLastCalledWith(1);
      expect(input).toHaveValue('1');
    });
  });
});
