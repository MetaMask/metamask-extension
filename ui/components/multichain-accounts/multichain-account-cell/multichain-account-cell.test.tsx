import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultichainAccountCell } from './multichain-account-cell';

describe('MultichainAccountCell', () => {
  const defaultProps = {
    accountId: '0x1234567890abcdef',
    accountName: 'Test Account',
    balance: '$2,400.00',
    endAccessory: <span data-testid="end-accessory">More</span>,
  };

  it('renders with all required props and displays account information correctly', () => {
    render(<MultichainAccountCell {...defaultProps} />);

    const cellElement = screen.getByTestId(
      'multichain-account-cell-0x1234567890abcdef',
    );
    expect(cellElement).toBeInTheDocument();

    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('$2,400.00')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();

    expect(
      screen.queryByTestId(
        'multichain-account-cell-0x1234567890abcdef-selected-icon',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows selection state correctly and applies proper styling', () => {
    render(<MultichainAccountCell {...defaultProps} selected={true} />);

    expect(
      screen.getByTestId(
        'multichain-account-cell-0x1234567890abcdef-selected-icon',
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
    render(<MultichainAccountCell {...defaultProps} onClick={handleClick} />);

    const cellElement = screen.getByTestId(
      'multichain-account-cell-0x1234567890abcdef',
    );

    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders correctly without optional props', () => {
    render(
      <MultichainAccountCell
        accountId="0xabc123"
        accountName="Minimal Account"
        balance="$100"
      />,
    );

    expect(screen.getByText('Minimal Account')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();

    const endAccessoryContainer = document.querySelector(
      '.multichain-account-cell__end_accessory',
    );
    expect(endAccessoryContainer).toBeInTheDocument();
    expect(endAccessoryContainer?.children.length).toBe(0);

    const cellElement = screen.getByTestId('multichain-account-cell-0xabc123');
    expect(cellElement.style.cursor).toBe('default');
  });

  it('renders a complete cell with all features enabled', () => {
    const handleClick = jest.fn();
    render(
      <MultichainAccountCell
        accountId="0xfull789"
        accountName="Complete Account"
        balance="$1,234.56"
        onClick={handleClick}
        endAccessory={<span data-testid="end-accessory">More</span>}
        selected={true}
      />,
    );

    expect(screen.getByText('Complete Account')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    expect(screen.getByTestId('end-accessory')).toBeInTheDocument();
    expect(
      screen.getByTestId('multichain-account-cell-0xfull789-selected-icon'),
    ).toBeInTheDocument();

    const avatarContainer = document.querySelector(
      '.multichain-account-cell__account-avatar',
    );
    expect(avatarContainer).toHaveClass('mm-box--border-color-primary-default');

    const cellElement = screen.getByTestId('multichain-account-cell-0xfull789');
    expect(cellElement.style.cursor).toBe('pointer');

    fireEvent.click(cellElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
