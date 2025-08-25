import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';

import { AddressQRCodeModal } from './address-qr-code-modal';

describe('AddressQRCodeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal when isOpen is true', () => {
    renderWithProvider(
      <AddressQRCodeModal isOpen={true} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Account 1 / Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Ethereum Address')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Use this address to receive tokens and collectibles on Ethereum',
      ),
    ).toBeInTheDocument();
  });

  it('should not render the modal when isOpen is false', () => {
    renderWithProvider(
      <AddressQRCodeModal isOpen={false} onClose={jest.fn()} />,
    );

    expect(screen.queryByText('Account 1 / Ethereum')).not.toBeInTheDocument();
  });

  it('should render the copy button', () => {
    renderWithProvider(
      <AddressQRCodeModal isOpen={true} onClose={jest.fn()} />,
    );

    expect(screen.getByText('EqT4z...a8f3x')).toBeInTheDocument();
  });

  it('should render the share button', () => {
    renderWithProvider(
      <AddressQRCodeModal isOpen={true} onClose={jest.fn()} />,
    );

    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderWithProvider(<AddressQRCodeModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
