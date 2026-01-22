import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { SearchInput } from './search-input';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('SearchInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the search input container', () => {
      renderWithProvider(<SearchInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('search-input-container')).toBeInTheDocument();
    });

    it('renders the input field', () => {
      renderWithProvider(<SearchInput {...defaultProps} />, mockStore);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('displays placeholder text', () => {
      renderWithProvider(<SearchInput {...defaultProps} />, mockStore);

      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('placeholder');
    });

    it('shows current value', () => {
      renderWithProvider(
        <SearchInput {...defaultProps} value="bitcoin" />,
        mockStore,
      );

      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('bitcoin');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when value is empty', () => {
      renderWithProvider(<SearchInput {...defaultProps} value="" />, mockStore);

      expect(
        screen.queryByTestId('text-field-search-clear-button'),
      ).not.toBeInTheDocument();
    });

    it('shows clear button when value is not empty', () => {
      renderWithProvider(
        <SearchInput {...defaultProps} value="test" />,
        mockStore,
      );

      expect(
        screen.getByTestId('text-field-search-clear-button'),
      ).toBeInTheDocument();
    });

    it('calls onClear when clear button is clicked', () => {
      const onClear = jest.fn();
      renderWithProvider(
        <SearchInput {...defaultProps} value="test" onClear={onClear} />,
        mockStore,
      );

      const clearButton = screen.getByTestId('text-field-search-clear-button');
      fireEvent.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('input changes', () => {
    it('calls onChange when typing', () => {
      const onChange = jest.fn();
      renderWithProvider(
        <SearchInput {...defaultProps} onChange={onChange} />,
        mockStore,
      );

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'btc' } });

      expect(onChange).toHaveBeenCalledWith('btc');
    });

    it('calls onClear when Escape is pressed', () => {
      const onClear = jest.fn();
      renderWithProvider(
        <SearchInput {...defaultProps} value="test" onClear={onClear} />,
        mockStore,
      );

      const input = screen.getByTestId('search-input');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto focus', () => {
    it('does not auto-focus by default', () => {
      renderWithProvider(<SearchInput {...defaultProps} />, mockStore);

      const input = screen.getByTestId('search-input');
      expect(document.activeElement).not.toBe(input);
    });

    it('auto-focuses when autoFocus prop is true', () => {
      renderWithProvider(
        <SearchInput {...defaultProps} autoFocus />,
        mockStore,
      );

      const input = screen.getByTestId('search-input');
      expect(document.activeElement).toBe(input);
    });
  });
});
