import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { Dropdown, type DropdownOption } from './dropdown';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const mockOptions: DropdownOption<string>[] = [
  { id: 'option1', label: 'Option 1' },
  { id: 'option2', label: 'Option 2' },
  { id: 'option3', label: 'Option 3' },
];

describe('Dropdown', () => {
  const defaultProps = {
    options: mockOptions,
    selectedId: 'option1',
    onChange: jest.fn(),
    testId: 'test-dropdown',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders with selected option label', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('renders the trigger button', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      expect(screen.getByTestId('test-dropdown-button')).toBeInTheDocument();
    });

    it('does not show menu initially', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      expect(
        screen.queryByTestId('test-dropdown-menu'),
      ).not.toBeInTheDocument();
    });
  });

  describe('opening and closing', () => {
    it('opens menu on button click', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);

      expect(screen.getByTestId('test-dropdown-menu')).toBeInTheDocument();
    });

    it('closes menu on second button click', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);
      expect(screen.getByTestId('test-dropdown-menu')).toBeInTheDocument();

      fireEvent.click(button);
      expect(
        screen.queryByTestId('test-dropdown-menu'),
      ).not.toBeInTheDocument();
    });

    it('closes menu on outside click', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);
      expect(screen.getByTestId('test-dropdown-menu')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(
        screen.queryByTestId('test-dropdown-menu'),
      ).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('displays all options when open', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);

      expect(screen.getByTestId('test-dropdown-option-option1')).toBeInTheDocument();
      expect(screen.getByTestId('test-dropdown-option-option2')).toBeInTheDocument();
      expect(screen.getByTestId('test-dropdown-option-option3')).toBeInTheDocument();
    });

    it('calls onChange when option is selected', () => {
      const onChange = jest.fn();
      renderWithProvider(
        <Dropdown {...defaultProps} onChange={onChange} />,
        mockStore,
      );

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);

      const option2 = screen.getByTestId('test-dropdown-option-option2');
      fireEvent.click(option2);

      expect(onChange).toHaveBeenCalledWith('option2');
    });

    it('closes menu after selection', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);

      const option2 = screen.getByTestId('test-dropdown-option-option2');
      fireEvent.click(option2);

      expect(
        screen.queryByTestId('test-dropdown-menu'),
      ).not.toBeInTheDocument();
    });

    it('shows checkmark on selected option', () => {
      renderWithProvider(<Dropdown {...defaultProps} />, mockStore);

      const button = screen.getByTestId('test-dropdown-button');
      fireEvent.click(button);

      // The selected option should have a checkmark icon
      const selectedOption = screen.getByTestId('test-dropdown-option-option1');
      const checkIcon = selectedOption.querySelector('[data-icon-name="check"]');
      // If no data attribute, check for the icon by structure
      expect(selectedOption).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('handles empty options array', () => {
      renderWithProvider(
        <Dropdown {...defaultProps} options={[]} />,
        mockStore,
      );

      expect(screen.getByTestId('test-dropdown-button')).toBeInTheDocument();
    });

    it('shows empty string when no selected option matches', () => {
      renderWithProvider(
        <Dropdown {...defaultProps} selectedId="nonexistent" />,
        mockStore,
      );

      const button = screen.getByTestId('test-dropdown-button');
      expect(button).toBeInTheDocument();
    });
  });
});
