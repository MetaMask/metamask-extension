import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { UnlockTotpSection } from './unlock-totp-section';

const mockStore = configureMockStore()({
  metamask: {},
  localeMessages: {
    currentLocale: 'en',
    current: {
      welcomeBack: { message: 'Welcome back' },
      secretEscrowTotpUnlockDescription: {
        message: 'Enter the 6-digit code from your authenticator app.',
      },
      secretEscrowTotpCodePlaceholder: { message: '000000' },
      secretEscrowTotpCodeLabel: { message: 'Authentication code' },
      secretEscrowTotpInvalidCode: { message: 'That code isn’t valid. Try again.' },
      unlock: { message: 'Unlock' },
      usePassword: { message: 'Use password' },
      unlockWithPasskey: { message: 'Unlock with $1' },
      biometrics: { message: 'Biometrics' },
    },
  },
});

describe('UnlockTotpSection', () => {
  it('submits a trimmed TOTP code', async () => {
    const onUnlockWithTotp = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderWithProvider(
      <UnlockTotpSection
        logoSection={<div data-testid="logo-mock" />}
        isRehydrationFlow={true}
        showUsePassword={true}
        showUsePasskey={true}
        onUnlockWithTotp={onUnlockWithTotp}
        onUsePassword={jest.fn()}
        onUsePasskey={jest.fn()}
      />,
      mockStore,
    );

    fireEvent.change(getByTestId('unlock-totp-code'), {
      target: { value: '123456' },
    });
    fireEvent.click(getByTestId('unlock-totp-submit'));

    await waitFor(() => {
      expect(onUnlockWithTotp).toHaveBeenCalledWith('123456');
    });
  });

  it('shows alternate factor links', () => {
    const onUsePassword = jest.fn();
    const onUsePasskey = jest.fn();
    const { getByTestId } = renderWithProvider(
      <UnlockTotpSection
        logoSection={<div data-testid="logo-mock" />}
        isRehydrationFlow={false}
        showUsePassword={true}
        showUsePasskey={true}
        onUnlockWithTotp={jest.fn()}
        onUsePassword={onUsePassword}
        onUsePasskey={onUsePasskey}
      />,
      mockStore,
    );

    fireEvent.click(getByTestId('unlock-use-password-from-totp-button'));
    fireEvent.click(getByTestId('unlock-use-passkey-from-totp-button'));
    expect(onUsePassword).toHaveBeenCalled();
    expect(onUsePasskey).toHaveBeenCalled();
  });
});
