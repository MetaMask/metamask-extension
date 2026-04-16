import React from 'react';
import { screen } from '@testing-library/react';

import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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

    expect(
      screen.getByText(messages.removeAccount.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Ledger EVM Account')).toBeInTheDocument();
    expect(screen.getByText('0x5CfE7...6a7e1')).toBeInTheDocument();
    expect(
      screen.getByText(messages.removeAccountModalBannerTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.removeAccountModalBannerDescription.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.cancel.message)).toBeInTheDocument();
    expect(screen.getByText(messages.remove.message)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    renderComponent({ isOpen: false });

    expect(
      screen.queryByText(messages.removeAccount.message),
    ).not.toBeInTheDocument();
  });

  it('calls appropriate handlers when buttons are clicked', () => {
    renderComponent();

    screen.getByText(messages.cancel.message).click();
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    screen.getByText(messages.remove.message).click();
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });
});
