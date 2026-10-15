import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type {
  EnrolledCredential,
  VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getActiveMfaFlow,
  startMfaFlow,
} from '../../hooks/identity/mfa/engine/activeFlow';
import type {
  MfaControllerAdapter,
  MfaFlowRequest,
} from '../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from './test-ids';
import MfaFlowHost from './mfa-flow-host';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const activeEmail: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  email: 'a@b.co',
  verified: true,
};

const createController = (
  initialCredentials: EnrolledCredential[] = [],
): MfaControllerAdapter => {
  let credentials = initialCredentials;
  let session: VerificationToken | null = null;
  return {
    refreshEnrolledCredentials: jest.fn(async () => credentials),
    beginCredentialEnrollment: jest.fn(async () => ({
      type: 'email_otp' as const,
      flowId: 'enroll-1',
      expiresAt: Date.now(),
    })),
    completeCredentialEnrollment: jest.fn(async () => {
      credentials = [activeEmail];
      return credentials;
    }),
    beginCredentialVerification: jest.fn(async () => ({
      type: 'email_otp' as const,
      flowId: 'verify-1',
      expiresAt: Date.now(),
    })),
    completeCredentialVerification: jest.fn(async () => {
      session = {
        accessToken: 'token',
        expiresIn: 900,
        obtainedAt: Date.now(),
        claims: { sub: 'profile', amr: ['email_otp'], exp: 0 },
      };
      return session;
    }),
    getVerificationToken: jest.fn(async () => session),
    clearVerificationSession: jest.fn(async () => {
      session = null;
    }),
  };
};

const start = async (
  request: MfaFlowRequest,
  controller: MfaControllerAdapter,
) => {
  const outcome = startMfaFlow({
    request,
    reason: { operation: 'test', enrollDescription: 'Why we ask' },
    platform: 'extension',
    controller,
  }).then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, code: error.mfaCode }),
  );
  await act(async () => undefined);
  return { outcome };
};

const renderHost = () =>
  renderWithProvider(<MfaFlowHost />, configureMockStore([thunk])(mockState));

const getInput = (testId: string) => {
  const input = screen.getByTestId(testId).querySelector('input');
  if (!input) {
    throw new Error(`No input in ${testId}`);
  }
  return input;
};

describe('MfaFlowHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => getActiveMfaFlow()?.dispatch({ type: 'cancel' }));
  });

  it('runs email setup from entry to success and resolves', async () => {
    const controller = createController();
    const { outcome } = await start(
      { kind: 'enroll', method: 'email_otp' },
      controller,
    );
    renderHost();

    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-emailEntry`),
    ).toBeInTheDocument();
    fireEvent.change(getInput(MfaFlowTestIds.EMAIL_INPUT), {
      target: { value: ' new@b.co ' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });

    expect(controller.beginCredentialEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'email_otp', email: 'new@b.co' }),
    );
    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-otp`),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(getInput(MfaFlowTestIds.CODE_INPUT), {
        target: { value: '123456' },
      });
    });

    expect(controller.completeCredentialEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({
        flowId: 'enroll-1',
        proof: { type: 'email_otp', code: '123456' },
      }),
    );
    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-success`),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });

    expect(await outcome).toEqual({
      ok: true,
      value: { credentials: [activeEmail] },
    });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('shows the intro, sets up email, then verifies it and returns the token', async () => {
    const controller = createController();
    const { outcome } = await start(
      {
        kind: 'verifyOrEnroll',
        methods: ['email_otp'],
        verifyWith: 'email_otp',
      },
      controller,
    );
    renderHost();

    expect(screen.getByText('Why we ask')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });
    fireEvent.change(getInput(MfaFlowTestIds.EMAIL_INPUT), {
      target: { value: 'a@b.co' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });
    await act(async () => {
      fireEvent.change(getInput(MfaFlowTestIds.CODE_INPUT), {
        target: { value: '111111' },
      });
    });

    expect(getInput(MfaFlowTestIds.CODE_INPUT)).toHaveValue('');
    await act(async () => {
      fireEvent.change(getInput(MfaFlowTestIds.CODE_INPUT), {
        target: { value: '222222' },
      });
    });

    expect(controller.completeCredentialVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        flowId: 'verify-1',
        proof: { type: 'email_otp', code: '222222' },
      }),
    );
    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-success`),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });

    const result = await outcome;
    expect(result.ok && result.value.token?.claims.amr).toEqual(['email_otp']);
  });

  it('rejects with flow_cancelled when the user closes it', async () => {
    const { outcome } = await start(
      { kind: 'enroll', method: 'email_otp' },
      createController(),
    );
    renderHost();

    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.CLOSE_BUTTON));
    });

    expect(await outcome).toEqual({ ok: false, code: 'flow_cancelled' });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('cancels the flow when the page goes away', async () => {
    const { outcome } = await start(
      { kind: 'enroll', method: 'email_otp' },
      createController(),
    );
    const { unmount } = renderHost();

    await act(async () => unmount());

    expect(await outcome).toEqual({ ok: false, code: 'flow_cancelled' });
  });

  it('leaves to the home page when no flow is running', async () => {
    renderHost();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
      }),
    );
  });
});
