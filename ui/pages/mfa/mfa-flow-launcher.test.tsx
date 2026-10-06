import React from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { MFA_FLOW_ROUTE } from '../../helpers/constants/routes';
import {
  getActiveMfaFlow,
  startMfaFlow,
} from '../../hooks/identity/mfa/engine/activeFlow';
import type { MfaControllerAdapter } from '../../hooks/identity/mfa/engine/types';
import MfaFlowLauncher from './mfa-flow-launcher';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);
const mockOpenExtensionInBrowser = jest.fn();

const createController = (
  overrides: Partial<MfaControllerAdapter> = {},
): MfaControllerAdapter => ({
  refreshEnrolledCredentials: jest.fn(async () => []),
  beginCredentialEnrollment: jest.fn(),
  completeCredentialEnrollment: jest.fn(),
  beginCredentialVerification: jest.fn(),
  completeCredentialVerification: jest.fn(),
  getVerificationToken: jest.fn(async () => null),
  clearVerificationSession: jest.fn(),
  ...overrides,
});

const start = (controller: MfaControllerAdapter) =>
  startMfaFlow({
    request: { kind: 'enroll', method: 'email_otp' },
    reason: { operation: 'test' },
    platform: 'extension',
    controller,
  }).then(
    () => 'resolved',
    (error) => error.mfaCode,
  );

const renderLauncher = () =>
  render(
    <MemoryRouter initialEntries={['/settings/security?tab=mfa']}>
      <MfaFlowLauncher />
    </MemoryRouter>,
  );

describe('MfaFlowLauncher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    globalThis.platform = {
      openExtensionInBrowser: mockOpenExtensionInBrowser,
    } as unknown as typeof globalThis.platform;
  });

  afterEach(async () => {
    await act(async () => getActiveMfaFlow()?.dispatch({ type: 'cancel' }));
  });

  it('opens the MFA page once the flow has a screen', async () => {
    renderLauncher();

    await act(async () => {
      start(createController());
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(MFA_FLOW_ROUTE);
  });

  it('stays closed while the flow has nothing to show', async () => {
    renderLauncher();

    await act(async () => {
      start(
        createController({
          refreshEnrolledCredentials: jest.fn(
            () => new Promise(() => undefined),
          ),
        }),
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('runs the flow in place in the side panel', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    renderLauncher();

    await act(async () => {
      start(createController());
    });

    expect(mockNavigate).toHaveBeenCalledWith(MFA_FLOW_ROUTE);
    expect(mockOpenExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('cancels and reopens the current page in the expanded view from the popup', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    renderLauncher();

    let outcome: Promise<string> | undefined;
    await act(async () => {
      outcome = start(createController());
    });

    expect(await outcome).toBe('flow_cancelled');
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(
      '/settings/security',
      'tab=mfa',
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
