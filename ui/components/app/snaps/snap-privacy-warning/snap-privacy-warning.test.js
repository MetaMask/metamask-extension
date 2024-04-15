import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import SnapPrivacyWarning from './snap-privacy-warning';

describe('Snap Privacy Warning Popover', () => {
  it('renders snaps privacy warning popover and works with accept flow', () => {
    const mockOnAcceptCallback = jest.fn();
    renderWithProvider(
      <SnapPrivacyWarning
        onAccepted={mockOnAcceptCallback}
        onCanceled={jest.fn()}
      />,
    );

    expect(screen.getByText('Third-party software notice')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Any information you share with Third Party Services will be collected directly by those Third Party Services in accordance with their privacy policies. Please refer to their privacy policies for more information.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Consensys has no access to information you share with Third Party Services.',
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

    expect(screen.getByText('Third-party software notice')).toBeInTheDocument();
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
