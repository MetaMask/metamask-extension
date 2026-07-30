import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { AssetActivationErrorToast } from './asset-activation-error-toast';

describe('AssetActivationErrorToast', () => {
  it('renders nothing when message is null', () => {
    render(<AssetActivationErrorToast message={null} onClose={jest.fn()} />);

    expect(
      screen.queryByTestId('asset-activation-error-container'),
    ).not.toBeInTheDocument();
  });

  it('renders the error message and calls onClose when dismissed', () => {
    const onClose = jest.fn();

    render(
      <AssetActivationErrorToast
        message="Trustline activation test error"
        onClose={onClose}
      />,
    );

    expect(
      screen.getByText('Trustline activation test error'),
    ).toBeInTheDocument();

    const closeButton = document.querySelector('.mm-banner-base__close-button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
