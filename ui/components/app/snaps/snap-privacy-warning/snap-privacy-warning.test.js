import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import SnapPrivacyWarning from './snap-privacy-warning';

describe('Snap Privacy Warning Popover', () => {
  it('renders snaps privacy warning popover and works with accept flow', () => {
    const mockOnAcceptCallback = jest.fn();
    const { getByTestId } = renderWithProvider(
      <SnapPrivacyWarning
        onAccepted={mockOnAcceptCallback}
        onCanceled={jest.fn()}
      />,
    );

    expect(screen.getByText('Third party software')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Installing a snap retrieves data from third parties. They may collect your personal information.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('MetaMask has no access to this information.'),
    ).toBeInTheDocument();
    const clickHereToReadMoreButton = getByTestId(
      'snapsPrivacyPopup_readMoreButton',
    );
    expect(clickHereToReadMoreButton).toBeDefined();
    clickHereToReadMoreButton.click();
    expect(
      screen.getByText(
        'Any information you share with third-party-developed snaps will be collected directly by those snaps in accordance with their privacy policies.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'During the installation of a snap, npmjs (npmjs.com) and AWS (aws.amazon.com) may collect your IP address. Please refer to their privacy policies for more information.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Accept/iu,
      }),
    ).toBeInTheDocument();
    screen
      .getByRole('button', {
        name: /Accept/iu,
      })
      .click();
    expect(mockOnAcceptCallback).toHaveBeenCalled();
  });

  it('renders snaps privacy warning popover and works with cancel flow', () => {
    const mockOnAcceptCallback = jest.fn();
    const mockOnCanceledCallback = jest.fn();
    renderWithProvider(
      <SnapPrivacyWarning
        onAccepted={mockOnAcceptCallback}
        onCanceled={mockOnCanceledCallback}
      />,
    );

    expect(screen.getByText('Third party software')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Cancel/iu,
      }),
    ).toBeInTheDocument();
    screen
      .getByRole('button', {
        name: /Cancel/iu,
      })
      .click();
    expect(mockOnCanceledCallback).toHaveBeenCalled();
    expect(mockOnAcceptCallback).not.toHaveBeenCalled();
  });
});
