import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { WalletRemoveModal } from './wallet-remove-modal';

describe('WalletRemoveModal', () => {
  const onClose = jest.fn();
  const onConfirm = jest.fn();

  const renderComponent = (type: 'locked' | 'remove') =>
    renderWithProvider(
      <WalletRemoveModal type={type} onClose={onClose} onConfirm={onConfirm} />,
      configureStore({}),
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains why the primary wallet is locked and dismisses with Got it', () => {
    renderComponent('locked');

    expect(screen.getByTestId('wallet-remove-modal-warning-icon')).toHaveClass(
      'text-error-default',
    );
    expect(screen.getByTestId('wallet-remove-modal-title')).toHaveTextContent(
      messages.walletRemoveLockedTitle.message,
    );
    expect(screen.getByTestId('wallet-remove-modal-title')).toHaveClass(
      'text-default',
      'text-s-heading-lg',
      'font-bold',
    );
    expect(
      screen.getByTestId('wallet-remove-modal-description'),
    ).toHaveTextContent(messages.walletRemoveLockedDescription.message);
    expect(screen.getByTestId('wallet-remove-modal-description')).toHaveClass(
      'text-alternative',
      'text-s-body-md',
      'font-regular',
    );

    fireEvent.click(screen.getByTestId('wallet-remove-modal-got-it-button'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders the warning icon below the close button row', () => {
    renderComponent('remove');

    const closeButton = screen.getByRole('button', {
      name: messages.close.message,
    });
    const header = closeButton.closest('header') as HTMLElement;
    const warningIcon = screen.getByTestId('wallet-remove-modal-warning-icon');

    expect(header).toBeInTheDocument();
    expect(warningIcon.closest('header')).toBeNull();
    expect(header.compareDocumentPosition(warningIcon)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('confirms wallet removal and offers cancellation', () => {
    renderComponent('remove');

    expect(
      screen.getByText(messages.walletRemoveConfirmTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.walletRemoveConfirmDescription.message),
    ).toBeInTheDocument();

    const removeButton = screen.getByTestId(
      'wallet-remove-modal-remove-button',
    );
    const cancelButton = screen.getByTestId(
      'wallet-remove-modal-cancel-button',
    );
    expect(screen.getAllByRole('button').indexOf(removeButton)).toBeLessThan(
      screen.getAllByRole('button').indexOf(cancelButton),
    );

    fireEvent.click(removeButton);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
