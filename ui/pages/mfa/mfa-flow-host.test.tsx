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
import { DEFAULT_ROUTE, UNLOCK_ROUTE } from '../../helpers/constants/routes';
import {
  getActiveMfaFlow,
  startMfaFlow,
} from '../../hooks/identity/mfa/engine/activeFlow';
import type {
  MfaControllerAdapter,
  MfaFlowOptions,
  MfaFlowRequest,
} from '../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from './test-ids';
import MfaFlowHost from './mfa-flow-host';

const mockNavigate = jest.fn();
const mockRedirect = jest.fn();
let mockLocation: { key: string; state: unknown };
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  Navigate: (props: unknown) => {
    mockRedirect(props);
    return null;
  },
}));

const activeEmail: EnrolledCredential = {
  id: 'email_otp',
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
    beginCredentialEnrollment: jest.fn(async ({ type }) =>
      type === 'totp'
        ? {
            type,
            flowId: 'enroll-1',
            expiresAt: Date.now(),
            secret: 'JBSWY3DPEHPK3PXP',
            qrCode: 'data:image/png;base64,QR',
            setupUri: 'otpauth://totp/MetaMask?secret=JBSWY3DPEHPK3PXP',
          }
        : {
            type: 'email_otp' as const,
            flowId: 'enroll-1',
            expiresAt: Date.now(),
          },
    ),
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
  // The extension offers no passkey yet: a picker needs a mobile flow.
  passkey?: MfaFlowOptions['passkey'],
  whileLocked?: boolean,
) => {
  const outcome = startMfaFlow({
    request,
    reason: { operation: 'qa.test', enrollDescription: 'Why we ask' },
    platform: passkey ? 'mobile' : 'extension',
    controller,
    passkey,
    whileLocked,
  }).then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, code: error.mfaCode }),
  );
  await act(async () => undefined);
  return { outcome };
};

const renderHost = (isUnlocked = true) =>
  renderWithProvider(
    <MfaFlowHost />,
    configureMockStore([thunk])({
      ...mockState,
      metamask: { ...mockState.metamask, isUnlocked },
    }),
  );

const getInput = (testId: string) => {
  const element = screen.getByTestId(testId);
  const input =
    element instanceof HTMLInputElement
      ? element
      : element.querySelector('input');
  if (!input) {
    throw new Error(`No input in ${testId}`);
  }
  return input;
};

describe('MfaFlowHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation = { key: 'default', state: null };
  });

  afterEach(async () => {
    await act(async () => getActiveMfaFlow()?.dispatch({ type: 'cancel' }));
  });

  describe('when the wallet is locked', () => {
    const VERIFY_EMAIL: MfaFlowRequest = {
      kind: 'verifyOrEnroll',
      methods: ['email_otp'],
      verifyWith: 'email_otp',
    };

    it('sends a flow that needs an unlocked wallet to unlock, and cancels it', async () => {
      const { outcome } = await start(
        VERIFY_EMAIL,
        createController([activeEmail]),
      );

      const { unmount } = renderHost(false);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({ to: UNLOCK_ROUTE, replace: true }),
      );
      expect(
        screen.queryByTestId(`${MfaFlowTestIds.CONTAINER}-otp`),
      ).not.toBeInTheDocument();
      // The router replaces the page with the redirect, and leaving it
      // cancels the flow.
      unmount();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve));
      });
      expect(await outcome).toStrictEqual({
        ok: false,
        code: 'flow_cancelled',
      });
    });

    it('keeps a flow that runs while locked on the page', async () => {
      await start(
        VERIFY_EMAIL,
        createController([activeEmail]),
        undefined,
        true,
      );

      renderHost(false);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(
        screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-otp`),
      ).toBeInTheDocument();
    });

    it('does not redirect when the wallet is unlocked', async () => {
      await start(VERIFY_EMAIL, createController([activeEmail]));

      renderHost();

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(
        screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-otp`),
      ).toBeInTheDocument();
    });
  });

  it('runs email setup from entry to the code, then resolves and leaves', async () => {
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
    const result = await outcome;
    expect(result.ok && result.value.token?.claims.amr).toEqual(['email_otp']);
  });

  it('returns from the authenticator code to its setup page', async () => {
    await start({ kind: 'enroll', method: 'totp' }, createController());
    renderHost();

    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-totpSetup`),
    ).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.PRIMARY_BUTTON));
    });
    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-otp`),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.BACK_BUTTON));
    });

    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-totpSetup`),
    ).toBeInTheDocument();
  });

  it('shows back and close actions on setup pages and closes the flow', async () => {
    mockLocation = {
      key: 'mfa',
      state: {
        returnTo: '/settings/security-and-password/verification-methods',
      },
    };
    const { outcome } = await start(
      { kind: 'enroll', method: 'email_otp' },
      createController(),
    );
    renderHost();

    expect(screen.getByTestId(MfaFlowTestIds.BACK_BUTTON)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.CLOSE_BUTTON));
    });

    expect(await outcome).toEqual({ ok: false, code: 'flow_cancelled' });
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('closes back to the page that started the flow outside Settings', async () => {
    mockLocation = { key: 'mfa', state: { returnTo: '/swaps?from=eth' } };
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
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('closes to the home page when there is no page to go back to', async () => {
    mockLocation = { key: 'default', state: { returnTo: '/swaps' } };
    await start({ kind: 'enroll', method: 'email_otp' }, createController());
    renderHost();

    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.CLOSE_BUTTON));
    });

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('asks how to verify with a close button, which cancels', async () => {
    const { outcome } = await start(
      {
        kind: 'verifyOrEnroll',
        methods: ['email_otp', 'passkey'],
        verifyWith: ['email_otp', 'passkey'],
      },
      createController([
        activeEmail,
        { id: 'passkey', type: 'passkey', status: 'active' },
      ]),
      { create: jest.fn(), get: jest.fn() },
    );
    renderHost();

    expect(
      screen.getByTestId(`${MfaFlowTestIds.CONTAINER}-picker`),
    ).toBeInTheDocument();
    expect(screen.queryByTestId(MfaFlowTestIds.BACK_BUTTON)).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByTestId(MfaFlowTestIds.CLOSE_BUTTON));
    });

    expect(await outcome).toEqual({ ok: false, code: 'flow_cancelled' });
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
