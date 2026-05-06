import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as actionsModule from '../../../store/actions';
import * as passkeyCeremony from '../../../../shared/lib/passkey/passkey-ceremony';
import { UnlockPasskeySection } from './unlock-passkey-section';

const mockStore = configureMockStore([thunk])({ metamask: {} });

describe('UnlockPasskeySection', () => {
  const baseProps = {
    logoSection: <div data-testid="logo-mock" />,
    isPasskeyActive: true,
    passkeyAutoUnlockSuppressed: true,
    isPasswordInProgress: false,
    onUnlockWithPasskey: jest.fn().mockResolvedValue(undefined),
    onUsePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(actionsModule, 'generatePasskeyAuthenticationOptions')
      .mockResolvedValue({
        challenge: 'AQ',
        allowCredentials: [{ id: 'AQ', type: 'public-key' }],
        userVerification: 'required',
      } as never);
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockResolvedValue({
        id: 'cred',
        rawId: 'cred',
        type: 'public-key',
        response: {
          clientDataJSON: 'e30',
          authenticatorData: 'AA',
          signature: 'AQ',
        },
        clientExtensionResults: {},
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders passkey error banner when authentication fails with a non-silent error', async () => {
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockRejectedValueOnce({ code: PasskeyControllerErrorCode.NotEnrolled });

    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} passkeyAutoUnlockSuppressed />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(getByTestId('unlock-passkey-error-banner')).toBeInTheDocument();
    });
  });

  it('disables passkey unlock while password submit is in progress', () => {
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} isPasswordInProgress />,
      mockStore,
      '/unlock',
    );

    expect(getByTestId('unlock-passkey-button')).toBeDisabled();
  });

  it('calls onUsePassword when Use password is clicked', () => {
    const onUsePassword = jest.fn();
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} onUsePassword={onUsePassword} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-use-password-button'));

    expect(onUsePassword).toHaveBeenCalledTimes(1);
  });

  it('does not throw when unmounted while passkey authentication is pending', async () => {
    let resolveCeremony: (value: unknown) => void;
    const ceremonyPromise = new Promise((resolve) => {
      resolveCeremony = resolve;
    });
    jest
      .spyOn(passkeyCeremony, 'startPasskeyAuthentication')
      .mockReturnValueOnce(ceremonyPromise as never);

    const { unmount, getByTestId } = renderWithProvider(
      <UnlockPasskeySection {...baseProps} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-passkey-button'));

    await waitFor(() => {
      expect(passkeyCeremony.startPasskeyAuthentication).toHaveBeenCalled();
    });

    unmount();

    const credential = {
      id: 'cred',
      rawId: 'cred',
      type: 'public-key',
      response: {
        clientDataJSON: 'e30',
        authenticatorData: 'AA',
        signature: 'AQ',
      },
      clientExtensionResults: {},
    };

    await act(async () => {
      resolveCeremony(credential);
      await Promise.resolve();
    });
  });

  it('starts passkey ceremony once on mount when auto unlock is not suppressed', async () => {
    const onUnlockWithPasskey = jest.fn().mockResolvedValue(undefined);

    renderWithProvider(
      <UnlockPasskeySection
        {...baseProps}
        passkeyAutoUnlockSuppressed={false}
        onUnlockWithPasskey={onUnlockWithPasskey}
      />,
      mockStore,
      '/unlock',
    );

    await waitFor(() => {
      expect(onUnlockWithPasskey).toHaveBeenCalledTimes(1);
    });
  });
});
