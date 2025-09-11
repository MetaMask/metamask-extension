import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import {
  MultichainAccountCell,
  MultichainAccountCellProps,
} from './multichain-account-cell';

describe('MultichainAccountCell', () => {
  const store = configureStore(mockDefaultState);
  const defaultProps: MultichainAccountCellProps = {
    accountId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/default',
    accountName: 'Test Account',
    balance: '$2,400.00',
    endAccessory: <span data-testid="end-accessory">More</span>,
  };

  it('renders with all required props and displays account information correctly', () => {
    renderWithProvider(<MultichainAccountCell {...defaultProps} />, store);

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement).toBeInTheDocument();

    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-icon`,
      ),
    ).not.toBeInTheDocument();
  });

  it('shows selection state correctly and applies proper styling', () => {
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} selected={true} />,
      store,
    );

    expect(
      screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-icon`,
      ),
    ).toBeInTheDocument();

    const selectedAvatarContainer = document.querySelector(
      '.multichain-account-cell__account-avatar',
    );
    expect(selectedAvatarContainer).toHaveClass(
      'mm-box--border-color-primary-default',
    );
    expect(selectedAvatarContainer).not.toHaveClass(
      'mm-box--border-color-transparent',
    );
  });

  it('handles click events and applies pointer cursor when onClick is provided', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <MultichainAccountCell {...defaultProps} onClick={handleClick} />,
      store,
    );

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );

    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders correctly without optional props', () => {
    renderWithProvider(
      <MultichainAccountCell
        accountId={defaultProps.accountId}
        accountName="Minimal Account"
        balance="$100"
      />,
      store,
    );

    expect(screen.getByText('Minimal Account')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();

    const endAccessoryContainer = document.querySelector(
      '.multichain-account-cell__end_accessory',
    );
    expect(endAccessoryContainer).toBeInTheDocument();
    expect(endAccessoryContainer?.children.length).toBe(0);

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement.style.cursor).toBe('default');
  });

  it('renders a complete cell with all features enabled', () => {
    const handleClick = jest.fn();
    renderWithProvider(
      <MultichainAccountCell
        accountId={defaultProps.accountId}
        accountName="Complete Account"
        balance="$1,234.56"
        onClick={handleClick}
        endAccessory={<span data-testid="end-accessory">More</span>}
        selected={true}
      />,
      store,
    );

    expect(screen.getByText('Complete Account')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `multichain-account-cell-${defaultProps.accountId}-selected-icon`,
      ),
    ).toBeInTheDocument();

    const avatarContainer = document.querySelector(
      '.multichain-account-cell__account-avatar',
    );
    expect(avatarContainer).toHaveClass('mm-box--border-color-primary-default');

    const cellElement = screen.getByTestId(
      `multichain-account-cell-${defaultProps.accountId}`,
    );
    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
