import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { AccountRemoveModal } from './account-remove-modal';

describe('AccountRemoveModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    accountName: 'Imported 1',
    accountAddress: '0x1234567890123456789012345678901234567890',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders imported account title and private key restoration copy', () => {
    renderWithProvider(<AccountRemoveModal {...defaultProps} />);
    expect(screen.getByText('Remove imported Imported 1')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can restore this account anytime by importing it with the private key.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render content when isOpen is false', () => {
    renderWithProvider(<AccountRemoveModal {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText('Remove imported Imported 1'),
    ).not.toBeInTheDocument();
  });

  it('triggers onSubmit on Remove button click', () => {
    renderWithProvider(<AccountRemoveModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Remove'));
    expect(defaultProps.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose on Cancel button click', () => {
    renderWithProvider(<AccountRemoveModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
