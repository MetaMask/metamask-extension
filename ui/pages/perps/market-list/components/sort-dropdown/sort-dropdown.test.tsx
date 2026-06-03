import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { SortDropdown, SORT_FIELD_OPTIONS } from './sort-dropdown';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('SortDropdown', () => {
  const defaultProps = {
    selectedField: 'volume' as const,
    direction: 'desc' as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the sort dropdown trigger button', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      expect(screen.getByTestId('sort-dropdown-button')).toBeInTheDocument();
    });

    it('displays current field label on trigger button', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      // Should show the translated label for volume field
      expect(screen.getByTestId('sort-dropdown-button').textContent).toContain(
        'Volume',
      );
    });

    it('opens sort modal when trigger button is clicked', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      expect(screen.getByTestId('sort-field-modal')).toBeInTheDocument();
    });

    it('renders all sort field options in modal', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      SORT_FIELD_OPTIONS.forEach((option) => {
        expect(
          screen.getByTestId(`sort-field-option-${option.id}`),
        ).toBeInTheDocument();
      });
    });

    it('renders direction options in modal', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      expect(screen.getByTestId('sort-direction-desc')).toBeInTheDocument();
      expect(screen.getByTestId('sort-direction-asc')).toBeInTheDocument();
    });

    it('renders apply and cancel buttons', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      expect(screen.getByTestId('sort-modal-apply')).toBeInTheDocument();
      expect(screen.getByTestId('sort-modal-cancel')).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('calls onChange with selected field and direction when Apply is clicked', () => {
      const onChange = jest.fn();
      renderWithProvider(
        <SortDropdown {...defaultProps} onChange={onChange} />,
        mockStore,
      );

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      fireEvent.click(screen.getByTestId('sort-field-option-priceChange'));
      fireEvent.click(screen.getByTestId('sort-direction-asc'));
      fireEvent.click(screen.getByTestId('sort-modal-apply'));

      expect(onChange).toHaveBeenCalledWith('priceChange', 'asc');
    });

    it('does not call onChange when Cancel is clicked', () => {
      const onChange = jest.fn();
      renderWithProvider(
        <SortDropdown {...defaultProps} onChange={onChange} />,
        mockStore,
      );

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);

      fireEvent.click(screen.getByTestId('sort-field-option-openInterest'));
      fireEvent.click(screen.getByTestId('sort-modal-cancel'));

      expect(onChange).not.toHaveBeenCalled();
    });

    it('closes modal after Apply', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);
      fireEvent.click(screen.getByTestId('sort-modal-apply'));

      expect(screen.queryByTestId('sort-field-modal')).not.toBeInTheDocument();
    });

    it('closes modal after Cancel', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(button);
      fireEvent.click(screen.getByTestId('sort-modal-cancel'));

      expect(screen.queryByTestId('sort-field-modal')).not.toBeInTheDocument();
    });
  });

  describe('SORT_FIELD_OPTIONS configuration', () => {
    it('has 4 sort field options', () => {
      expect(SORT_FIELD_OPTIONS).toHaveLength(4);
    });

    it('includes volume option', () => {
      const option = SORT_FIELD_OPTIONS.find((opt) => opt.id === 'volume');
      expect(option).toBeDefined();
      expect(option?.id).toBe('volume');
    });

    it('includes priceChange option', () => {
      const option = SORT_FIELD_OPTIONS.find((opt) => opt.id === 'priceChange');
      expect(option).toBeDefined();
      expect(option?.id).toBe('priceChange');
    });

    it('includes openInterest option', () => {
      const option = SORT_FIELD_OPTIONS.find(
        (opt) => opt.id === 'openInterest',
      );
      expect(option).toBeDefined();
      expect(option?.id).toBe('openInterest');
    });

    it('includes fundingRate option', () => {
      const option = SORT_FIELD_OPTIONS.find((opt) => opt.id === 'fundingRate');
      expect(option).toBeDefined();
      expect(option?.id).toBe('fundingRate');
    });

    it('all options have labelKey for i18n', () => {
      SORT_FIELD_OPTIONS.forEach((option) => {
        expect(option.labelKey).toBeDefined();
        expect(option.labelKey.startsWith('perpsSortBy')).toBe(true);
      });
    });
  });
});
