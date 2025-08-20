import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as redux from 'react-redux';
import { useAccountSyncing } from '../../hooks/identity/useAccountSyncing';
import { useContactSyncing } from '../../hooks/identity/useContactSyncing';
import {
  useAutoSignIn,
  useAutoSignOut,
} from '../../hooks/identity/useAuthentication';
import { MetamaskIdentityProvider } from '.';

jest.mock('../../hooks/identity/useBackupAndSync');
jest.mock('../../hooks/identity/useAccountSyncing');
jest.mock('../../hooks/identity/useContactSyncing');
jest.mock('../../hooks/identity/useAuthentication');

describe('MetamaskIdentityProvider', () => {
  const mockUseAccountSyncing = jest.mocked(useAccountSyncing);
  const mockUseContactSyncing = jest.mocked(useContactSyncing);
  const mockUseAutoSignIn = jest.mocked(useAutoSignIn);
  const mockUseAutoSignOut = jest.mocked(useAutoSignOut);

  beforeEach(() => {
    mockUseAccountSyncing.mockReturnValue({
      dispatchAccountSyncing: jest.fn(),
      shouldDispatchAccountSyncing: false,
    });

    mockUseContactSyncing.mockReturnValue({
      dispatchContactSyncing: jest.fn(),
      shouldDispatchContactSyncing: false,
    });

    mockUseAutoSignIn.mockReturnValue({
      autoSignIn: jest.fn(),
      shouldAutoSignIn: false,
    });

    mockUseAutoSignOut.mockReturnValue({
      autoSignOut: jest.fn(),
      shouldAutoSignOut: false,
    });

    jest.spyOn(redux, 'useSelector').mockImplementation(() => true);
  });

  it('renders children correctly', () => {
    render(
      <MetamaskIdentityProvider>
        <div data-testid="child">Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('calls dispatchAccountSyncing if shouldDispatchAccountSyncing is true', () => {
    const dispatchAccountSyncing = jest.fn();
    mockUseAccountSyncing.mockReturnValue({
      dispatchAccountSyncing,
      shouldDispatchAccountSyncing: true,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(dispatchAccountSyncing).toHaveBeenCalled();
  });

  it('does not call dispatchAccountSyncing if shouldDispatchAccountSyncing is false', () => {
    const dispatchAccountSyncing = jest.fn();
    mockUseAccountSyncing.mockReturnValue({
      dispatchAccountSyncing,
      shouldDispatchAccountSyncing: false,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(dispatchAccountSyncing).not.toHaveBeenCalled();
  });

  it('calls dispatchContactSyncing if shouldDispatchContactSyncing is true', () => {
    const dispatchContactSyncing = jest.fn();
    mockUseContactSyncing.mockReturnValue({
      dispatchContactSyncing,
      shouldDispatchContactSyncing: true,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(dispatchContactSyncing).toHaveBeenCalled();
  });

  it('does not call dispatchContactSyncing if shouldDispatchContactSyncing is false', () => {
    const dispatchContactSyncing = jest.fn();
    mockUseContactSyncing.mockReturnValue({
      dispatchContactSyncing,
      shouldDispatchContactSyncing: false,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(dispatchContactSyncing).not.toHaveBeenCalled();
  });

  it('calls autoSignIn if shouldAutoSignIn returns true', () => {
    const autoSignIn = jest.fn();
    const shouldAutoSignIn = true;
    mockUseAutoSignIn.mockReturnValue({
      autoSignIn,
      shouldAutoSignIn,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(autoSignIn).toHaveBeenCalled();
  });

  it('does not call autoSignIn if shouldAutoSignIn returns false', () => {
    const autoSignIn = jest.fn();
    const shouldAutoSignIn = false;
    mockUseAutoSignIn.mockReturnValue({
      autoSignIn,
      shouldAutoSignIn,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(autoSignIn).not.toHaveBeenCalled();
  });

  it('calls autoSignOut if shouldAutoSignOut returns true', () => {
    const autoSignOut = jest.fn();
    const shouldAutoSignOut = true;
    mockUseAutoSignOut.mockReturnValue({
      autoSignOut,
      shouldAutoSignOut,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(autoSignOut).toHaveBeenCalled();
  });

  it('does not call autoSignOut if shouldAutoSignOut returns false', () => {
    const autoSignOut = jest.fn();
    const shouldAutoSignOut = false;
    mockUseAutoSignOut.mockReturnValue({
      autoSignOut,
      shouldAutoSignOut,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    expect(autoSignOut).not.toHaveBeenCalled();
  });
});
