import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import WelcomeLogin from './welcome-login';
import { LOGIN_OPTION, LOGIN_TYPE } from './types';

describe('Welcome login', () => {
  it('should render', () => {
    const mockOnLogin = jest.fn();
    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} />,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText('Import using Secret Recovery Phrase');
    expect(importButton).toBeInTheDocument();

    fireEvent.click(importButton);

    expect(mockOnLogin).toHaveBeenCalledWith(
      LOGIN_TYPE.SRP,
      LOGIN_OPTION.EXISTING,
    );
  });

  it('should display Login Options modal when seedless onboarding feature is enabled', () => {
    const mockOnLogin = jest.fn();

    const { getByTestId, getByText } = renderWithProvider(
      <WelcomeLogin onLogin={mockOnLogin} />,
    );
    expect(getByTestId('get-started')).toBeInTheDocument();

    const importButton = getByText('I have an existing wallet');
    expect(importButton).toBeInTheDocument();

    fireEvent.click(importButton);

    expect(mockOnLogin).not.toHaveBeenCalled();
    expect(
      getByTestId('onboarding-import-with-srp-button'),
    ).toBeInTheDocument();
  });
});
