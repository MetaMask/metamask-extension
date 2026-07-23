import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import {
  PasskeyVerification,
  runPasskeyVerificationCeremony,
} from './passkey-verification';

const PASSKEY_LABEL_BIOMETRICS = tEn('passkeyAuthMethodBiometrics');
const mockPasskeyAuthResponse = {
  id: 'credential-id',
  rawId: 'raw-id',
  response: {},
  type: 'public-key',
};

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual<
    typeof import('../../../../shared/lib/environment-type')
  >('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  generatePasskeyAuthenticationOptions: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  startPasskeyAuthentication: jest.fn(),
  cancelPasskeyCeremony: jest.fn(),
}));

const mockStartPasskeyAuthentication =
  startPasskeyAuthentication as jest.MockedFunction<
    typeof startPasskeyAuthentication
  >;
const mockCancelPasskeyCeremony = cancelPasskeyCeremony as jest.MockedFunction<
  typeof cancelPasskeyCeremony
>;
const mockGetEnvironmentType = getEnvironmentType as jest.MockedFunction<
  typeof getEnvironmentType
>;

describe('runPasskeyVerificationCeremony', () => {
  it('returns the authentication response when the ceremony succeeds', async () => {
    mockStartPasskeyAuthentication.mockResolvedValueOnce(
      mockPasskeyAuthResponse as never,
    );

    const response = await runPasskeyVerificationCeremony({
      sentryContext: 'test ceremony',
      passkeyMethodLabel: PASSKEY_LABEL_BIOMETRICS,
      t: tEn,
      showErrorToast: false,
    });

    expect(response).toBe(mockPasskeyAuthResponse);
  });

  it('returns null when the ceremony is cancelled', async () => {
    mockStartPasskeyAuthentication.mockRejectedValueOnce(
      new DOMException('User cancelled', 'NotAllowedError'),
    );

    const response = await runPasskeyVerificationCeremony({
      sentryContext: 'test ceremony',
      passkeyMethodLabel: PASSKEY_LABEL_BIOMETRICS,
      t: tEn,
      showErrorToast: false,
    });

    expect(response).toBeNull();
  });
});

describe('PasskeyVerification', () => {
  const mockStore = configureMockStore()(mockState);

  beforeEach(() => {
    mockGetEnvironmentType.mockReturnValue('popup');
    mockStartPasskeyAuthentication.mockResolvedValue(
      mockPasskeyAuthResponse as never,
    );
  });

  it('auto-runs verification and calls onVerified when the ceremony succeeds', async () => {
    const onVerified = jest.fn();

    renderWithProvider(
      <PasskeyVerification
        flow="test-flow"
        troubleshootLocation="reveal-srp"
        onOpenFullScreen={jest.fn()}
        onVerified={onVerified}
        onUsePassword={jest.fn()}
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalledWith(mockPasskeyAuthResponse);
    });
    expect(
      document.querySelector('[data-testid="test-flow-passkey-verifying"]'),
    ).toBeInTheDocument();
  });

  it('calls onCeremonyFailed when the ceremony returns null', async () => {
    mockStartPasskeyAuthentication.mockRejectedValueOnce(
      new DOMException('User cancelled', 'NotAllowedError'),
    );
    const onCeremonyFailed = jest.fn();

    renderWithProvider(
      <PasskeyVerification
        flow="test-flow"
        troubleshootLocation="reveal-srp"
        onOpenFullScreen={jest.fn()}
        onVerified={jest.fn()}
        onUsePassword={jest.fn()}
        onCeremonyFailed={onCeremonyFailed}
      />,
      mockStore,
    );

    await waitFor(() => {
      expect(onCeremonyFailed).toHaveBeenCalled();
    });
  });

  it('calls onUsePassword and cancels the ceremony when use password is clicked', async () => {
    mockStartPasskeyAuthentication.mockReturnValue(
      new Promise(() => {
        // never resolves
      }),
    );
    const onUsePassword = jest.fn();

    const { getByTestId } = renderWithProvider(
      <PasskeyVerification
        flow="test-flow"
        autoRunOnMount={false}
        troubleshootLocation="reveal-srp"
        onOpenFullScreen={jest.fn()}
        onVerified={jest.fn()}
        onUsePassword={onUsePassword}
      />,
      mockStore,
    );

    fireEvent.click(getByTestId('test-flow-verify-passkey-use-password'));

    expect(mockCancelPasskeyCeremony).toHaveBeenCalled();
    expect(onUsePassword).toHaveBeenCalled();
  });
});
