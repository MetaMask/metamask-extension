import React from 'react';
import { screen } from '@testing-library/react';

import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/jest';
import { AccountRemoveModal } from './account-remove-modal';

describe('AccountRemoveModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    accountName: 'Ledger EVM Account',
    accountAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  };

  const renderComponent = (props = {}) => {
    const store = configureStore({});
    return renderWithProvider(
      <AccountRemoveModal {...defaultProps} {...props} />,
      store,
    );
  };

  it('renders modal content when isOpen is true', () => {
    renderComponent();

    expect(screen.getByText('Remove account')).toBeInTheDocument();
    expect(screen.getByText('Ledger EVM Account')).toBeInTheDocument();
    expect(screen.getByText('0x5CfE7...6a7e1')).toBeInTheDocument();
    expect(
      screen.getByText('This account will be removed from MetaMask.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Make sure you have the Secret Recovery Phrase or private key for this account before removing.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderComponent({ isOpen: false });

    expect(screen.queryByText('Remove account')).not.toBeInTheDocument();
  });

  it('calls appropriate handlers when buttons are clicked', () => {
    renderComponent();

    screen.getByText('Cancel').click();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    screen.getByText('Remove').click();
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });
});
