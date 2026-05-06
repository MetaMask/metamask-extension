import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasskeyEnrollmentSteps } from './passkey-enrollment-steps';

describe('PasskeyEnrollmentSteps', () => {
  it('renders both step labels', () => {
    render(
      <PasskeyEnrollmentSteps
        registerStatus="idle"
        verifyStatus="idle"
        registerLabel="Register passkey"
        verifyLabel="Verify passkey"
      />,
    );

    expect(screen.getByText('Register passkey')).toBeInTheDocument();
    expect(screen.getByText('Verify passkey')).toBeInTheDocument();
  });

  it('renders success and loading indicators for active steps', () => {
    render(
      <PasskeyEnrollmentSteps
        registerStatus="success"
        verifyStatus="loading"
        registerLabel="Register passkey"
        verifyLabel="Verify passkey"
      />,
    );

    expect(
      screen.getByTestId('passkey-step-indicator-success'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('passkey-step-indicator-loading'),
    ).toBeInTheDocument();
  });

  it('renders idle indicators for both steps when idle', () => {
    render(
      <PasskeyEnrollmentSteps
        registerStatus="idle"
        verifyStatus="idle"
        registerLabel="Register passkey"
        verifyLabel="Verify passkey"
      />,
    );

    expect(screen.getAllByTestId('passkey-step-indicator-idle')).toHaveLength(
      2,
    );
  });
});
