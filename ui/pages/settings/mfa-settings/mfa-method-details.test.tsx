import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { MFA_SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { toast } from '../../../components/ui/toast/toast';
import { MfaFlowError } from '../../../hooks/identity/mfa/engine/errors';
import { startMfaFlow } from '../../../hooks/identity/mfa/engine/activeFlow';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import { isMethodSupported } from '../../../hooks/identity/mfa/engine/planner';
import { removeMfaCredential } from '../../../hooks/identity/mfa/removeMfaCredential';
import { MfaSettingsTestIds } from './test-ids';
import MfaEmailDetails from './mfa-email-details';
import MfaTotpDetails from './mfa-totp-details';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../components/ui/toast/toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../hooks/identity/mfa/engine/activeFlow', () => ({
  startMfaFlow: jest.fn(),
}));

jest.mock('../../../hooks/identity/mfa/bindings', () => ({
  extensionMfaControllerAdapter: { refreshEnrolledCredentials: jest.fn() },
}));

jest.mock('../../../hooks/identity/mfa/engine/planner', () => ({
  ...jest.requireActual('../../../hooks/identity/mfa/engine/planner'),
  isMethodSupported: jest.fn(),
}));

jest.mock('../../../hooks/identity/mfa/removeMfaCredential', () => ({
  removeMfaCredential: jest.fn(),
}));

const mockStartMfaFlow = jest.mocked(startMfaFlow);
const mockRefresh = jest.mocked(
  extensionMfaControllerAdapter.refreshEnrolledCredentials,
);
const mockRemove = jest.mocked(removeMfaCredential);

const token = {
  accessToken: 'token',
  expiresIn: 900,
  obtainedAt: 0,
  claims: { sub: 'profile', amr: ['passkey'], exp: 0 },
};
const email: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  email: 'a@b.co',
  verified: true,
  enrolledAt: new Date(2026, 8, 17, 11, 23).getTime(),
};
const passkey: EnrolledCredential = { type: 'passkey', status: 'active' };

const authenticatorApp: EnrolledCredential = {
  type: 'totp',
  status: 'active',
};

const renderDetails = (
  enrolledCredentials: EnrolledCredential[],
  page: React.ReactElement = <MfaEmailDetails />,
) =>
  renderWithProvider(
    page,
    configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, enrolledCredentials },
    }),
  );

const confirmRemoval = async () => {
  fireEvent.click(screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON));
  await act(async () => {
    fireEvent.click(screen.getByTestId(MfaSettingsTestIds.CONFIRM_BUTTON));
  });
};

describe('MfaEmailDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartMfaFlow.mockResolvedValue({ credentials: [], token });
    mockRefresh.mockResolvedValue([]);
    mockRemove.mockResolvedValue();
    // Passkeys don't run on the extension yet; most tests assume they do.
    jest.mocked(isMethodSupported).mockReturnValue(true);
  });

  it('describes the email and what it protects', () => {
    renderDetails([email]);

    expect(screen.getByText('a•••@b.co')).toBeInTheDocument();
    expect(
      screen.getByText('Added Sep 17, 2026 at 11:23 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaSettingsUsedForMoney.message),
    ).toBeInTheDocument();
  });

  it('names an email listed without its address', () => {
    renderDetails([{ type: 'email_otp', status: 'active', verified: true }]);

    expect(
      screen.getByText(messages.mfaMethodEmail.message),
    ).toBeInTheDocument();
  });

  it('renders nothing without an active email', () => {
    renderDetails([passkey]);

    expect(
      screen.queryByTestId(MfaSettingsTestIds.EMAIL_DETAILS),
    ).not.toBeInTheDocument();
  });

  it('refuses to remove the last method', () => {
    renderDetails([email]);

    fireEvent.click(screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON));
    expect(
      screen.getByText(messages.mfaSettingsLastEmailTitle.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(messages.gotIt.message));
    expect(
      screen.queryByTestId(MfaSettingsTestIds.LAST_METHOD_MODAL),
    ).not.toBeInTheDocument();
    expect(mockStartMfaFlow).not.toHaveBeenCalled();
  });

  it('sends the user to mobile when no other method runs here', () => {
    jest.mocked(isMethodSupported).mockReturnValue(false);
    renderDetails([email, passkey]);

    fireEvent.click(screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON));
    expect(
      screen.getByText(messages.mfaSettingsRemoveElsewhereTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(MfaSettingsTestIds.CONFIRM_BUTTON),
    ).not.toBeInTheDocument();
    expect(mockStartMfaFlow).not.toHaveBeenCalled();
  });

  it('closes the confirmation on cancel', () => {
    renderDetails([email, passkey]);

    fireEvent.click(screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON));
    fireEvent.click(screen.getByText(messages.cancel.message));

    expect(
      screen.queryByTestId(MfaSettingsTestIds.CONFIRM_MODAL),
    ).not.toBeInTheDocument();
    expect(mockStartMfaFlow).not.toHaveBeenCalled();
  });

  it('removes the email after a fresh verification with the other methods', async () => {
    renderDetails([email, passkey, { ...passkey }]);

    await confirmRemoval();

    expect(mockStartMfaFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          kind: 'verifyOrEnroll',
          methods: ['passkey'],
          verifyWith: ['passkey'],
        }),
        reason: { operation: 'settings.removeEmail' },
      }),
    );
    expect(mockRemove).toHaveBeenCalledWith(email, token);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(
      messages.mfaSettingsEmailRemoved.message,
    );
    expect(mockNavigate).toHaveBeenCalledWith(MFA_SETTINGS_ROUTE, {
      replace: true,
    });
  });

  it('stays quiet when the verification is cancelled', async () => {
    mockStartMfaFlow.mockRejectedValue(new MfaFlowError('flow_cancelled'));
    renderDetails([email, passkey]);

    await confirmRemoval();

    expect(mockRemove).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('says so when the removal fails', async () => {
    mockRemove.mockRejectedValue(new Error('not supported'));
    renderDetails([email, passkey]);

    await confirmRemoval();

    expect(toast.error).toHaveBeenCalledWith(
      messages.mfaSettingsRemoveFailed.message,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON),
    ).toBeInTheDocument();
  });
});

describe('MfaTotpDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartMfaFlow.mockResolvedValue({ credentials: [], token });
    mockRefresh.mockResolvedValue([]);
    mockRemove.mockResolvedValue();
    jest.mocked(isMethodSupported).mockReturnValue(true);
  });

  it('describes the authenticator app without an app name', () => {
    renderDetails([authenticatorApp], <MfaTotpDetails />);

    expect(
      screen.getByTestId(MfaSettingsTestIds.TOTP_DETAILS),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaMethodTotp.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaSettingsUsedForMoney.message),
    ).toBeInTheDocument();
  });

  it('refuses to remove the last method', () => {
    renderDetails([authenticatorApp], <MfaTotpDetails />);

    fireEvent.click(screen.getByTestId(MfaSettingsTestIds.REMOVE_BUTTON));

    expect(
      screen.getByText(messages.mfaSettingsLastTotpTitle.message),
    ).toBeInTheDocument();
  });

  it('removes the authenticator app after verifying with email', async () => {
    renderDetails([email, authenticatorApp], <MfaTotpDetails />);

    await confirmRemoval();

    expect(mockStartMfaFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ verifyWith: ['email_otp'] }),
        reason: { operation: 'settings.removeAuthenticatorApp' },
      }),
    );
    expect(mockRemove).toHaveBeenCalledWith(authenticatorApp, token);
    expect(toast.success).toHaveBeenCalledWith(
      messages.mfaSettingsTotpRemoved.message,
    );
    expect(mockNavigate).toHaveBeenCalledWith(MFA_SETTINGS_ROUTE, {
      replace: true,
    });
  });
});
