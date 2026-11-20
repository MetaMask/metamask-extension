import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
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

    it('renders no leading icon on the trigger button', () => {
      // The trigger shows the field label and the direction arrow only.
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('sort-dropdown-button').querySelectorAll('svg'),
      ).toHaveLength(1);
    });

    it('names the trigger with purpose, field and direction', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      expect(screen.getByTestId('sort-dropdown-button')).toHaveAttribute(
        'aria-label',
        'Sort by, Volume, High to low',
      );
    });

    it('points the trigger arrow down for a descending sort and up for ascending', () => {
      // The SelectButton's trailing arrow reflects the direction in force
      // instead of a static dropdown chevron.
      const ARROW_PATH_PREFIX = {
        up: 'M20.03 15.53',
        down: 'm20.03 9.53',
      };
      const getArrowPath = () =>
        screen
          .getByTestId('sort-dropdown-direction-arrow')
          .querySelector('path')
          ?.getAttribute('d');

      const { rerender } = renderWithProvider(
        <SortDropdown {...defaultProps} />,
        mockStore,
      );
      expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.down);

      rerender(<SortDropdown {...defaultProps} direction="asc" />);
      expect(getArrowPath()).toContain(ARROW_PATH_PREFIX.up);
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

    it('shows the direction on the selected field rather than in its own section', () => {
      // Figma 12602:46701 folds the rank into the sort row: one list, and the
      // field in force carries its direction inline.
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('sort-dropdown-button'));

      const direction = screen.getByTestId('sort-field-direction');

      expect(direction).toHaveTextContent(
        messages.perpsSortByHighToLow.message,
      );
      expect(screen.getByTestId('sort-field-option-volume')).toContainElement(
        direction,
      );
      expect(
        screen.queryByTestId('sort-direction-desc'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('sort-direction-asc'),
      ).not.toBeInTheDocument();
    });

    it('shows the direction only on the field in force', () => {
      renderWithProvider(<SortDropdown {...defaultProps} />, mockStore);

      fireEvent.click(screen.getByTestId('sort-dropdown-button'));

      expect(screen.getAllByTestId('sort-field-direction')).toHaveLength(1);
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

      // Choosing another field keeps the direction; pressing the field already
      // in force reverses it.
      fireEvent.click(screen.getByTestId('sort-field-option-priceChange'));
      fireEvent.click(screen.getByTestId('sort-field-option-priceChange'));
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
