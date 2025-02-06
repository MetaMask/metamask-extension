import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as redux from 'react-redux';
import { useAccountSyncing } from '../../hooks/identity/useProfileSyncing';
import {
  useAutoSignIn,
  useSignOut,
} from '../../hooks/identity/useAuthentication';
import { MetamaskIdentityProvider } from '.';

jest.mock('../../hooks/identity/useProfileSyncing');
jest.mock('../../hooks/identity/useAuthentication');

describe('MetamaskIdentityProvider', () => {
  const mockUseAccountSyncing = jest.mocked(useAccountSyncing);
  const mockUseAutoSignIn = jest.mocked(useAutoSignIn);
  const mockUseSignOut = jest.mocked(useSignOut);

  beforeEach(() => {
    mockUseAccountSyncing.mockReturnValue({
      dispatchAccountSyncing: jest.fn(),
      shouldDispatchAccountSyncing: false,
    });

    mockUseAutoSignIn.mockReturnValue({
      autoSignIn: jest.fn(),
      shouldAutoSignIn: jest.fn().mockReturnValue(false),
    });

    mockUseSignOut.mockReturnValue({
      signOut: jest.fn(),
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

  it('calls autoSignIn if shouldAutoSignIn returns true', () => {
    const autoSignIn = jest.fn();
    const shouldAutoSignIn = jest.fn().mockReturnValue(true);
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
    const shouldAutoSignIn = jest.fn().mockReturnValue(false);
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

  it('calls signOut if basic functionality is disabled', async () => {
    jest.spyOn(redux, 'useSelector').mockImplementation(() => false);

    const signOut = jest.fn();
    mockUseSignOut.mockReturnValue({
      signOut,
    });

    render(
      <MetamaskIdentityProvider>
        <div>Child Component</div>
      </MetamaskIdentityProvider>,
    );

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
});
