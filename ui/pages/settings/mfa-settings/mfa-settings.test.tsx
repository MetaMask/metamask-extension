import React from 'react';
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
  isMfaKitEnabled: () => true,
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

    expect(screen.getByText('a@b.co')).toBeInTheDocument();
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
});
