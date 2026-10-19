import React from 'react';
import { it } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import { MfaFlowError } from '../../../hooks/identity/mfa/engine/errors';
import { startMfaFlow } from '../../../hooks/identity/mfa/engine/activeFlow';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import { isMfaKitEnabled } from '../../../hooks/identity/mfa/isMfaKitEnabled';
import { MfaSettingsTestIds } from './test-ids';
import MfaSettings from './mfa-settings';

jest.mock('../../../hooks/identity/mfa/engine/activeFlow', () => ({
  startMfaFlow: jest.fn(),
}));

jest.mock('../../../hooks/identity/mfa/bindings', () => ({
  extensionMfaControllerAdapter: {
    refreshEnrolledCredentials: jest.fn(),
    clearVerificationSession: jest.fn(),
  },
}));

jest.mock('../../../hooks/identity/mfa/isMfaKitEnabled', () => ({
  isMfaKitEnabled: jest.fn(),
}));

const mockStartMfaFlow = jest.mocked(startMfaFlow);
const mockAdapter = jest.mocked(extensionMfaControllerAdapter);

const renderSettings = (enrolledCredentials: EnrolledCredential[] = []) =>
  renderWithProvider(
    <MfaSettings />,
    configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, enrolledCredentials },
    }),
  );

describe('MfaSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter.refreshEnrolledCredentials.mockResolvedValue([]);
    mockAdapter.clearVerificationSession.mockResolvedValue(undefined);
    mockStartMfaFlow.mockResolvedValue({ credentials: [] });
    jest.mocked(isMfaKitEnabled).mockReturnValue(true);
  });

  it('refreshes the methods and offers to set up email', async () => {
    renderSettings();
    await act(async () => undefined);

    expect(mockAdapter.refreshEnrolledCredentials).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaSettingsTestIds.EMAIL_BUTTON));
    });
    expect(mockStartMfaFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        request: { kind: 'enroll', method: 'email_otp' },
        reason: { operation: 'settings.addEmail' },
        platform: 'extension',
      }),
    );
  });

  it('offers to finish a pending email setup', () => {
    renderSettings([
      {
        type: 'email_otp',
        status: 'pending',
        email: 'a@b.co',
        verified: false,
      },
    ]);

    expect(
      screen.getByText(messages.mfaSettingsEmailPending.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.mfaSettingsFinishSetup.message),
    ).toBeInTheDocument();
  });

  it('shows an active email without a setup button', () => {
    renderSettings([
      { type: 'email_otp', status: 'active', email: 'a@b.co', verified: true },
    ]);

    expect(screen.getByText('a•••@b.co')).toBeInTheDocument();
    expect(
      screen.queryByTestId(MfaSettingsTestIds.EMAIL_BUTTON),
    ).not.toBeInTheDocument();
  });

  it('shows how a QA preset settled', async () => {
    mockStartMfaFlow.mockRejectedValue(new MfaFlowError('flow_cancelled'));
    renderSettings();

    await act(async () => {
      fireEvent.click(screen.getByText('Verify with email'));
    });

    expect(screen.getByTestId(MfaSettingsTestIds.QA_RESULT)).toHaveTextContent(
      'Verify with email: Rejected with flow_cancelled',
    );
  });

  it('clears the verification session from QA', async () => {
    renderSettings();

    await act(async () => {
      fireEvent.click(screen.getByText('Clear verification session'));
    });

    expect(mockAdapter.clearVerificationSession).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId(MfaSettingsTestIds.QA_RESULT)).toHaveTextContent(
      'Verification session cleared',
    );
  });

  it('shows an email linked to the sign-in without its address', () => {
    renderSettings([{ type: 'email_otp', status: 'active', verified: true }]);

    expect(
      screen.getByText(messages.mfaSettingsEmailLinked.message),
    ).toBeInTheDocument();
  });

  it('hides the QA presets in production', () => {
    jest.mocked(isMfaKitEnabled).mockReturnValue(false);
    renderSettings();

    expect(
      screen.queryByTestId(MfaSettingsTestIds.QA_PRESETS),
    ).not.toBeInTheDocument();
  });

  it.each([
    'Verify with email',
    'Verify with email, max 30s old',
    'Require email, no verification',
    'Enroll email',
    'Email and passkey (no passkey adapter)',
  ])('runs the "%s" preset and shows what it resolved with', async (label) => {
    renderSettings();

    await act(async () => {
      fireEvent.click(screen.getByText(label));
    });

    expect(mockStartMfaFlow).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId(MfaSettingsTestIds.QA_RESULT)).toHaveTextContent(
      `${label}: Resolved. 0 credential(s) no token`,
    );
  });

  it('shows the token a QA preset resolved with', async () => {
    mockStartMfaFlow.mockResolvedValue({
      credentials: [],
      token: {
        accessToken: 'token',
        expiresIn: 900,
        obtainedAt: 0,
        claims: { sub: 'profile', amr: ['email_otp'], exp: 0 },
      },
    });
    renderSettings();

    await act(async () => {
      fireEvent.click(screen.getByText('Verify with email'));
    });

    expect(screen.getByTestId(MfaSettingsTestIds.QA_RESULT)).toHaveTextContent(
      'token amr=email_otp',
    );
  });

  it('shows an error without an MFA code as unknown', async () => {
    mockStartMfaFlow.mockRejectedValue(new Error('boom'));
    renderSettings();

    await act(async () => {
      fireEvent.click(screen.getByText('Enroll email'));
    });

    expect(screen.getByTestId(MfaSettingsTestIds.QA_RESULT)).toHaveTextContent(
      'Enroll email: Rejected with unknown',
    );
  });
});
