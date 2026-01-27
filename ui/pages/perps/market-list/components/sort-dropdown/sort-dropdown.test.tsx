import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { SortDropdown, SORT_OPTIONS } from './sort-dropdown';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('SortDropdown', () => {
  const defaultProps = {
    selectedOptionId: 'volume' as const,
    onOptionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the sort dropdown', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      expect(screen.getByTestId('sort-dropdown-button')).toBeInTheDocument();
    });

    it('displays selected option with i18n label', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      // Should show the translated label for volume
      expect(screen.getByText(/volume/iu)).toBeInTheDocument();
    });

    it('renders all sort options when open', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      // Check that all options are rendered
      SORT_OPTIONS.forEach((option) => {
        expect(
          screen.getByTestId(`sort-dropdown-option-${option.id}`),
        ).toBeInTheDocument();
      });
    });
  });

  describe('selection', () => {
    it('calls onOptionChange with correct params when option selected', () => {
      const onOptionChange = jest.fn();
      renderWithProvider(
        <SortDropdown {...defaultProps} onOptionChange={onOptionChange} />,
        mockStore,
      );

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      const priceChangeOption = screen.getByTestId(
        'sort-dropdown-option-priceChangeHigh',
      );
      fireEvent.click(priceChangeOption);

      expect(onOptionChange).toHaveBeenCalledWith(
        'priceChangeHigh',
        'priceChange',
        'desc',
      );
    });

    it('calls onOptionChange with ascending direction for low to high', () => {
      const onOptionChange = jest.fn();
      renderWithProvider(
        <SortDropdown {...defaultProps} onOptionChange={onOptionChange} />,
        mockStore,
      );

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      const priceChangeLowOption = screen.getByTestId(
        'sort-dropdown-option-priceChangeLow',
      );
      fireEvent.click(priceChangeLowOption);

      expect(onOptionChange).toHaveBeenCalledWith(
        'priceChangeLow',
        'priceChange',
        'asc',
      );
    });
  });

  describe('SORT_OPTIONS configuration', () => {
    it('has correct number of sort options', () => {
      expect(SORT_OPTIONS).toHaveLength(5);
    });

    it('includes volume option', () => {
      const volumeOption = SORT_OPTIONS.find((opt) => opt.id === 'volume');
      expect(volumeOption).toBeDefined();
      expect(volumeOption?.field).toBe('volume');
      expect(volumeOption?.direction).toBe('desc');
    });

    it('includes price change high to low option', () => {
      const option = SORT_OPTIONS.find((opt) => opt.id === 'priceChangeHigh');
      expect(option).toBeDefined();
      expect(option?.field).toBe('priceChange');
      expect(option?.direction).toBe('desc');
    });

    it('includes price change low to high option', () => {
      const option = SORT_OPTIONS.find((opt) => opt.id === 'priceChangeLow');
      expect(option).toBeDefined();
      expect(option?.field).toBe('priceChange');
      expect(option?.direction).toBe('asc');
    });

    it('includes open interest option', () => {
      const option = SORT_OPTIONS.find((opt) => opt.id === 'openInterest');
      expect(option).toBeDefined();
      expect(option?.field).toBe('openInterest');
      expect(option?.direction).toBe('desc');
    });

    it('includes funding rate option', () => {
      const option = SORT_OPTIONS.find((opt) => opt.id === 'fundingRate');
      expect(option).toBeDefined();
      expect(option?.field).toBe('fundingRate');
      expect(option?.direction).toBe('desc');
    });

    it('all options have labelKey for i18n', () => {
      SORT_OPTIONS.forEach((option) => {
        expect(option.labelKey).toBeDefined();
        expect(option.labelKey.startsWith('perpsSort')).toBe(true);
      });
    });
  });
});
