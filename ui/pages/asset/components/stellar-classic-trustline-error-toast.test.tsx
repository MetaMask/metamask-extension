import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { StellarClassicTrustlineErrorToast } from './stellar-classic-trustline-error-toast';

describe('StellarClassicTrustlineErrorToast', () => {
  it('renders nothing when message is null', () => {
    render(
      <StellarClassicTrustlineErrorToast
        message={null}
        onClose={jest.fn()}
        dataTestId="stellar-trustline-error"
      />,
    );

    expect(
      screen.queryByTestId('stellar-trustline-error-container'),
    ).not.toBeInTheDocument();
  });

  it('renders the error message and calls onClose when dismissed', () => {
    const onClose = jest.fn();

    render(
      <StellarClassicTrustlineErrorToast
        message="Something went wrong"
        onClose={onClose}
        dataTestId="stellar-trustline-error"
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const closeButton = document.querySelector('.mm-banner-base__close-button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
