import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
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
        message={messages.assetActivationError.message}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByText(messages.assetActivationError.message),
    ).toBeInTheDocument();

    const closeButton = document.querySelector('.mm-banner-base__close-button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
