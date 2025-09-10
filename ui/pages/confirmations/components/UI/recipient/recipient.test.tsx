import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { Recipient } from './recipient';

const mockContactRecipient = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  contactName: 'John Doe',
};

const mockAccountRecipient = {
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  accountGroupName: 'My Accounts',
  walletName: 'MetaMask',
};

describe('Recipient', () => {
  it('renders contact recipient with correct information', () => {
    const { getByText } = render(
      <Recipient recipient={mockContactRecipient} onClick={jest.fn()} />,
    );

    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('0x12345...45678')).toBeInTheDocument();
  });

  it('renders account recipient with correct information', () => {
    const { getByText } = render(
      <Recipient
        isAccount={true}
        recipient={mockAccountRecipient}
        onClick={jest.fn()}
      />,
    );

    expect(getByText('My Accounts')).toBeInTheDocument();
    expect(getByText('0xabcde...def12')).toBeInTheDocument();
  });

  it('calls onClick when recipient is clicked', () => {
    const mockOnClick = jest.fn();
    const { container } = render(
      <Recipient recipient={mockContactRecipient} onClick={mockOnClick} />,
    );

    fireEvent.click(container.querySelector('.send-recipient') as Element);
    expect(mockOnClick).toHaveBeenCalledWith(mockContactRecipient);
  });

  it('applies selected background when recipient is selected', () => {
    const { container } = render(
      <Recipient
        isSelected={true}
        recipient={mockContactRecipient}
        onClick={jest.fn()}
      />,
    );

    const recipientElement = container.querySelector('.send-recipient');
    expect(recipientElement).toHaveStyle(
      'background-color: var(--color-background-hover)',
    );
  });

  it('applies transparent background when recipient is not selected', () => {
    const { container } = render(
      <Recipient
        isSelected={false}
        recipient={mockContactRecipient}
        onClick={jest.fn()}
      />,
    );

    const recipientElement = container.querySelector('.send-recipient');
    expect(recipientElement).toHaveStyle(
      'background-color: var(--color-background-transparent)',
    );
  });

  it('renders blockies avatar when useBlockie is true', () => {
    render(<Recipient recipient={mockContactRecipient} onClick={jest.fn()} />);

    const avatarElement = document.querySelector('.mm-avatar-account');
    expect(avatarElement).toBeInTheDocument();
  });

  it('renders jazzicon avatar when useBlockie is false', () => {
    render(<Recipient recipient={mockContactRecipient} onClick={jest.fn()} />);

    const avatarElement = document.querySelector('.mm-avatar-account');
    expect(avatarElement).toBeInTheDocument();
  });

  it('shows contact name for contact recipients', () => {
    const { getByText } = render(
      <Recipient
        isAccount={false}
        recipient={mockContactRecipient}
        onClick={jest.fn()}
      />,
    );

    expect(getByText('John Doe')).toBeInTheDocument();
  });

  it('shows account group name for account recipients', () => {
    const { getByText } = render(
      <Recipient
        isAccount={true}
        recipient={mockAccountRecipient}
        onClick={jest.fn()}
      />,
    );

    expect(getByText('My Accounts')).toBeInTheDocument();
  });

  it('handles recipient with no contact name', () => {
    const recipientWithoutName = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
    };
    const { getByText } = render(
      <Recipient recipient={recipientWithoutName} onClick={jest.fn()} />,
    );

    expect(getByText('0x12345...45678')).toBeInTheDocument();
  });

  it('handles recipient with no account group name', () => {
    const recipientWithoutName = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
    };
    const { getByText } = render(
      <Recipient
        isAccount={true}
        recipient={recipientWithoutName}
        onClick={jest.fn()}
      />,
    );

    expect(getByText('0x12345...45678')).toBeInTheDocument();
  });
});
