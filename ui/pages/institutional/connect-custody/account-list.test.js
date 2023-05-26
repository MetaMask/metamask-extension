import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CustodyAccountList from './account-list';

const testAccounts = [
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Test Account 1',
    chainId: 1,
  },
  {
    address: '0x0987654321098765432109876543210987654321',
    name: 'Test Account 2',
    chainId: 1,
  },
];

describe('CustodyAccountList', () => {
  const onAccountChangeMock = jest.fn();
  const onCancelMock = jest.fn();
  const onAddAccountsMock = jest.fn();
  const selectedAccountsMock = {};

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders accounts', () => {
    const { container } = render(
      <CustodyAccountList
        accounts={testAccounts}
        selectedAccounts={selectedAccountsMock}
        onAccountChange={onAccountChangeMock}
        onCancel={onCancelMock}
        onAddAccounts={onAddAccountsMock}
        custody="Test"
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('calls onAccountChange when an account is selected', () => {
    render(
      <CustodyAccountList
        accounts={testAccounts}
        selectedAccounts={selectedAccountsMock}
        onAccountChange={onAccountChangeMock}
        onCancel={onCancelMock}
        onAddAccounts={onAddAccountsMock}
        custody="Test"
      />,
    );

    const firstAccountCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(firstAccountCheckbox);

    expect(onAccountChangeMock).toHaveBeenCalledTimes(1);
    expect(onAccountChangeMock).toHaveBeenCalledWith({
      name: 'Test Account 1',
      address: '0x1234567890123456789012345678901234567890',
      custodianDetails: undefined,
      labels: undefined,
      chainId: 1,
    });
  });

  it('calls onCancel when the Cancel button is clicked', () => {
    render(
      <CustodyAccountList
        accounts={testAccounts}
        selectedAccounts={selectedAccountsMock}
        onAccountChange={onAccountChangeMock}
        onCancel={onCancelMock}
        onAddAccounts={onAddAccountsMock}
        custody="Test"
      />,
    );

    const cancelButton = screen.getByTestId('custody-account-cancel-button');
    fireEvent.click(cancelButton);

    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('calls onAddAccounts when the Connect button is clicked', () => {
    selectedAccountsMock['0x1234567890123456789012345678901234567890'] = true;
    selectedAccountsMock['0x0987654321098765432109876543210987654321'] = true;

    render(
      <CustodyAccountList
        accounts={testAccounts}
        selectedAccounts={selectedAccountsMock}
        onAccountChange={onAccountChangeMock}
        onCancel={onCancelMock}
        onAddAccounts={onAddAccountsMock}
        custody="Test"
      />,
    );

    const addAccountsButton = screen.getByTestId(
      'custody-account-connect-button',
    );
    fireEvent.click(addAccountsButton);

    expect(onAddAccountsMock).toHaveBeenCalledTimes(1);
    expect(onAddAccountsMock).toHaveBeenCalledWith('Test');
  });
});
