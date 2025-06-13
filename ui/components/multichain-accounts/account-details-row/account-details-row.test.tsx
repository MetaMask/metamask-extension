import React from 'react';
import { render, screen } from '@testing-library/react';
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
  });
});
