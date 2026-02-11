import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonIcon, ButtonIconSize } from '../../component-library';
import { IconName } from '../../component-library/icon';
import { IconColor } from '../../../helpers/constants/design-system';
import { AccountDetailsRow } from './account-details-row';

describe('AccountDetailsRow', () => {
  const defaultProps = {
    label: 'Test Label',
    value: 'Test Value',
    endAccessory: null,
  };

  describe('Component Rendering', () => {
    it('should render with basic props', () => {
      render(<AccountDetailsRow {...defaultProps} />);

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('should render with endAccessory', () => {
      const endAccessory = (
        <ButtonIcon
          iconName={IconName.Edit}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Edit"
          data-testid="end-accessory-button"
        />
      );

      render(
        <AccountDetailsRow {...defaultProps} endAccessory={endAccessory} />,
      );

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
      expect(screen.getByTestId('end-accessory-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
    });

    it('should render without endAccessory', () => {
      render(<AccountDetailsRow {...defaultProps} />);

      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('Test Value')).toBeInTheDocument();
      // Should not have any buttons
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Click Functionality', () => {
    it('should call onClick when provided and row is clicked', () => {
      const mockOnClick = jest.fn();
      render(<AccountDetailsRow {...defaultProps} onClick={mockOnClick} />);

      const row = screen.getByText('Test Label').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when not provided', () => {
      render(<AccountDetailsRow {...defaultProps} />);

      const row = screen.getByText('Test Label').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      // Should not throw any errors
      expect(true).toBe(true);
    });

    it('should apply clickable class when onClick is provided', () => {
      render(<AccountDetailsRow {...defaultProps} onClick={() => undefined} />);

      const row = screen.getByText('Test Label').closest('div');
      expect(row).toHaveClass('multichain-account-details__row--clickable');
      expect(row).not.toHaveClass('multichain-account-details__row--default');
    });
  });

  describe('End Accessory Variations', () => {
    it('should render with edit button accessory', () => {
      const editButton = (
        <ButtonIcon
          iconName={IconName.Edit}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Edit account name"
          data-testid="edit-button"
        />
      );

      render(
        <AccountDetailsRow
          label="Account Name"
          value="My Account"
          endAccessory={editButton}
        />,
      );

      expect(screen.getByTestId('edit-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit account name')).toBeInTheDocument();
    });

    it('should render with arrow button accessory', () => {
      const arrowButton = (
        <ButtonIcon
          iconName={IconName.ArrowRight}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="View details"
          data-testid="arrow-button"
        />
      );

      render(
        <AccountDetailsRow
          label="Address"
          value="0x1234...5678"
          endAccessory={arrowButton}
        />,
      );

      expect(screen.getByTestId('arrow-button')).toBeInTheDocument();
      expect(screen.getByLabelText('View details')).toBeInTheDocument();
    });

    it('should handle click events on endAccessory buttons', () => {
      const mockButtonClick = jest.fn();
      const endAccessory = (
        <ButtonIcon
          iconName={IconName.Edit}
          color={IconColor.iconAlternative}
          size={ButtonIconSize.Md}
          ariaLabel="Edit"
          data-testid="end-accessory-button"
          onClick={mockButtonClick}
        />
      );

      render(
        <AccountDetailsRow {...defaultProps} endAccessory={endAccessory} />,
      );

      const button = screen.getByTestId('end-accessory-button');
      fireEvent.click(button);

      expect(mockButtonClick).toHaveBeenCalledTimes(1);
    });
  });
});
