import {
  MfaError,
  getMfaErrorCode,
  type EnrolledCredential,
  type VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
import { createMfaFlow } from './flow';
import type {
  MfaControllerAdapter,
  MfaFlow,
  MfaFlowRequest,
  MfaMethod,
  PasskeyAdapter,
} from './types';

const NOW = 1_800_000_000_000;

const providerEmail: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  verified: true,
};
const activeEmail: EnrolledCredential = {
  type: 'email_otp',
  status: 'active',
  email: 'a@b.co',
  verified: true,
};
const passkey: EnrolledCredential = { type: 'passkey', status: 'active' };

const EMAIL_ONLY: MfaFlowRequest = {
  kind: 'verifyOrEnroll',
  methods: ['email_otp'],
  verifyWith: 'email_otp',
};

const buildToken = (method: MfaMethod): VerificationToken => ({
  accessToken: `${method}-token`,
  expiresIn: 900,
  obtainedAt: NOW,
  claims: { sub: 'profile', amr: [method], exp: NOW / 1000 + 900 },
});

/**
 * In-memory stand-in for the AuthenticationController: enrollments add
 * credentials, and enrollments and verifications open a session proven with
 * their method.
 *
 * @param initialCredentials - The credentials the profile starts with.
 * @returns The fake controller and helpers to inspect it.
 */
const createFakeController = (initialCredentials: EnrolledCredential[]) => {
  let credentials = [...initialCredentials];
  let session: VerificationToken | null = null;
  let flowCount = 0;

  const controller: jest.Mocked<MfaControllerAdapter> = {
    refreshEnrolledCredentials: jest.fn(async () => credentials),
    beginCredentialEnrollment: jest.fn(async ({ type }) => {
      flowCount += 1;
      return type === 'passkey'
        ? {
            type,
            flowId: `enroll-${flowCount}`,
            expiresAt: NOW,
            publicKey: {} as never,
          }
        : { type, flowId: `enroll-${flowCount}`, expiresAt: NOW };
    }),
    completeCredentialEnrollment: jest.fn(async ({ proof }) => {
      credentials = [
        ...credentials,
        proof.type === 'passkey'
          ? passkey
          : { ...activeEmail, email: 'new@b.co' },
      ];
      session = buildToken(proof.type);
      return credentials;
    }),
    beginCredentialVerification: jest.fn(async ({ type }) => {
      flowCount += 1;
      return type === 'passkey'
        ? {
            type,
            flowId: `verify-${flowCount}`,
            expiresAt: NOW,
            publicKey: {} as never,
          }
        : { type, flowId: `verify-${flowCount}`, expiresAt: NOW };
    }),
    completeCredentialVerification: jest.fn(async ({ proof }) => {
      session = buildToken(proof.type);
      return session;
    }),
    getVerificationToken: jest.fn(async () => session),
    clearVerificationSession: jest.fn(async () => {
      session = null;
    }),
  };

  return {
    controller,
    setSession: (token: VerificationToken | null) => {
      session = token;
    },
    setCredentials: (next: EnrolledCredential[]) => {
      credentials = next;
    },
  };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const passkeyAdapter: jest.Mocked<PasskeyAdapter> = {
  create: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue({}),
};

const startFlow = async (
  request: MfaFlowRequest,
  controller: MfaControllerAdapter,
  overrides: {
    platform?: 'mobile' | 'extension';
    passkey?: PasskeyAdapter;
  } = {},
) => {
  const flow = createMfaFlow({
    request,
    reason: { operation: 'vba.activate', description: 'Why we ask' },
    platform: overrides.platform ?? 'mobile',
    controller,
    passkey: 'passkey' in overrides ? overrides.passkey : passkeyAdapter,
    now: () => NOW,
  });
  const outcome = flow.result.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  await flow.start();
  await flush();
  return { flow, outcome };
};

const act = async (
  flow: MfaFlow,
  action: Parameters<MfaFlow['dispatch']>[0],
) => {
  flow.dispatch(action);
  await flush();
};

describe('createMfaFlow', () => {
  it('resolves without any screen when everything is set up and a matching session is live', async () => {
    const fake = createFakeController([activeEmail]);
    fake.setSession(buildToken('email_otp'));

    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    expect(flow.getState().step).toStrictEqual({ name: 'idle' });
    expect(await outcome).toStrictEqual({
      ok: true,
      value: { credentials: [activeEmail], token: buildToken('email_otp') },
    });
  });

  it('sets up email with one code for a profile with nothing set up', async () => {
    const fake = createFakeController([]);
    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    expect(flow.getState().step).toStrictEqual({
      name: 'intro',
      missing: ['email_otp'],
    });

    await act(flow, { type: 'continue' });
    expect(flow.getState()).toMatchObject({
      step: { name: 'emailEntry' },
      progress: { current: 1, total: 1 },
    });

    await act(flow, { type: 'submitEmail', email: 'new@b.co' });
    expect(fake.controller.beginCredentialEnrollment).toHaveBeenCalledWith({
      type: 'email_otp',
      email: 'new@b.co',
      reason: { operation: 'vba.activate' },
      maxSessionAgeMs: 120_000,
    });
    expect(flow.getState().step).toStrictEqual({
      name: 'otp',
      purpose: 'setup',
      email: 'new@b.co',
      codeSent: true,
    });

    await act(flow, { type: 'submitCode', code: '111111' });
    expect(fake.controller.completeCredentialEnrollment).toHaveBeenCalledWith({
      flowId: 'enroll-1',
      proof: { type: 'email_otp', code: '111111' },
      reason: { operation: 'vba.activate' },
    });
    expect(fake.controller.beginCredentialVerification).not.toHaveBeenCalled();
    expect(flow.getState().step).toStrictEqual({ name: 'success' });

    await act(flow, { type: 'dismiss' });
    expect(await outcome).toMatchObject({
      ok: true,
      value: { token: buildToken('email_otp') },
    });
  });

  it('verifies with email when the enrollment opened no session', async () => {
    const fake = createFakeController([]);
    fake.controller.completeCredentialEnrollment.mockImplementationOnce(
      async () => {
        const credentials = [{ ...activeEmail, email: 'new@b.co' }];
        fake.setCredentials(credentials);
        return credentials;
      },
    );
    const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

    await act(flow, { type: 'continue' });
    await act(flow, { type: 'submitEmail', email: 'new@b.co' });
    await act(flow, { type: 'submitCode', code: '111111' });
    expect(flow.getState()).toMatchObject({
      step: {
        name: 'otp',
        purpose: 'verify',
        email: 'new@b.co',
        codeSent: true,
      },
      progress: { current: 1, total: 1 },
    });

    await act(flow, { type: 'submitCode', code: '222222' });
    expect(flow.getState().step).toStrictEqual({ name: 'success' });
  });

  describe('Kalshi: email and passkey set up, verified with the passkey', () => {
    const KALSHI: MfaFlowRequest = {
      kind: 'verifyOrEnroll',
      methods: ['email_otp', 'passkey'],
      verifyWith: 'passkey',
    };
    const createPasskeyAdapter = (): jest.Mocked<PasskeyAdapter> => ({
      create: jest.fn().mockResolvedValue({}),
      get: jest.fn().mockResolvedValue({}),
    });

    it('takes one code and one passkey sheet for a profile with nothing set up', async () => {
      const fake = createFakeController([]);
      const adapter = createPasskeyAdapter();
      const { flow, outcome } = await startFlow(KALSHI, fake.controller, {
        passkey: adapter,
      });

      expect(flow.getState().step).toStrictEqual({
        name: 'intro',
        missing: ['email_otp', 'passkey'],
      });
      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      await act(flow, { type: 'submitCode', code: '111111' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'passkey', purpose: 'setup' },
        progress: { current: 2, total: 2 },
      });

      await act(flow, { type: 'continue' });
      expect(flow.getState().step).toStrictEqual({ name: 'success' });
      expect(adapter.create).toHaveBeenCalledTimes(1);
      expect(adapter.get).not.toHaveBeenCalled();
      expect(
        fake.controller.beginCredentialVerification,
      ).not.toHaveBeenCalled();

      await act(flow, { type: 'dismiss' });
      expect(await outcome).toMatchObject({
        ok: true,
        value: { token: buildToken('passkey') },
      });
    });

    it('takes one code to the provider email and one passkey sheet for a Google profile', async () => {
      const fake = createFakeController([providerEmail]);
      const adapter = createPasskeyAdapter();
      const { flow, outcome } = await startFlow(KALSHI, fake.controller, {
        passkey: adapter,
      });

      expect(flow.getState().step).toStrictEqual({
        name: 'intro',
        missing: ['passkey'],
      });
      await act(flow, { type: 'continue' });
      expect(flow.getState().step).toMatchObject({
        name: 'otp',
        purpose: 'confirm',
      });

      await act(flow, { type: 'submitCode', code: '123456' });
      expect(flow.getState().step).toStrictEqual({
        name: 'passkey',
        purpose: 'setup',
      });

      await act(flow, { type: 'continue' });
      expect(flow.getState().step).toStrictEqual({ name: 'success' });
      expect(fake.controller.beginCredentialVerification).toHaveBeenCalledTimes(
        1,
      );
      expect(adapter.create).toHaveBeenCalledTimes(1);
      expect(adapter.get).not.toHaveBeenCalled();

      await act(flow, { type: 'dismiss' });
      expect(await outcome).toMatchObject({
        ok: true,
        value: { token: buildToken('passkey') },
      });
    });

    it('rejects with flow_cancelled and the methods already set up when the user backs out', async () => {
      const fake = createFakeController([]);
      const { flow, outcome } = await startFlow(KALSHI, fake.controller, {
        passkey: createPasskeyAdapter(),
      });

      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      await act(flow, { type: 'submitCode', code: '111111' });
      await act(flow, { type: 'cancel' });

      const result = await outcome;
      expect(result.ok).toBe(false);
      expect(result.ok ? undefined : result.error).toMatchObject({
        mfaCode: 'flow_cancelled',
        data: { completed: ['email_otp'] },
      });
    });
  });

  it('verifies a Google profile through its provider email without an intro', async () => {
    const fake = createFakeController([providerEmail]);
    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    expect(flow.getState().step).toStrictEqual({
      name: 'otp',
      purpose: 'verify',
      email: undefined,
      codeSent: true,
    });

    await act(flow, { type: 'submitCode', code: '123456' });
    await act(flow, { type: 'dismiss' });
    expect((await outcome).ok).toBe(true);
  });

  it('only sets up email when verifyWith is omitted', async () => {
    const fake = createFakeController([]);
    const { flow, outcome } = await startFlow(
      { kind: 'verifyOrEnroll', methods: ['email_otp'] },
      fake.controller,
    );

    await act(flow, { type: 'continue' });
    await act(flow, { type: 'submitEmail', email: 'new@b.co' });
    await act(flow, { type: 'submitCode', code: '111111' });
    expect(fake.controller.beginCredentialVerification).not.toHaveBeenCalled();

    await act(flow, { type: 'dismiss' });
    expect(await outcome).toStrictEqual({
      ok: true,
      value: { credentials: [{ ...activeEmail, email: 'new@b.co' }] },
    });
  });

  it('offers a picker when several accepted methods are active', async () => {
    const fake = createFakeController([activeEmail, passkey]);
    const { flow } = await startFlow(
      {
        kind: 'verifyOrEnroll',
        methods: ['email_otp', 'passkey'],
        verifyWith: ['email_otp', 'passkey'],
      },
      fake.controller,
    );

    expect(flow.getState().step).toStrictEqual({
      name: 'picker',
      purpose: 'verify',
      options: ['passkey', 'email_otp'],
    });

    await act(flow, { type: 'choose', method: 'email_otp' });
    expect(flow.getState().step).toMatchObject({
      name: 'otp',
      purpose: 'verify',
      email: 'a@b.co',
    });
  });

  describe('errors', () => {
    it('keeps the user on the code screen after a wrong code', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.completeCredentialVerification.mockRejectedValueOnce(
        new MfaError('invalid_code', 'wrong'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'submitCode', code: '000000' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'otp', purpose: 'verify' },
        error: 'invalid_code',
        busy: false,
      });

      await act(flow, { type: 'submitCode', code: '123456' });
      expect(flow.getState().step).toStrictEqual({ name: 'success' });
    });

    it('shows a countdown when a code was sent less than a minute ago', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.beginCredentialVerification.mockRejectedValueOnce(
        new MfaError('otp_resend_cooldown', 'wait', { retryAfterMs: 30_000 }),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      expect(flow.getState()).toMatchObject({
        step: { name: 'otp', codeSent: false },
        error: 'otp_resend_cooldown',
        resendAvailableAt: NOW + 30_000,
      });

      await act(flow, { type: 'resend' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'otp', codeSent: true },
        error: undefined,
        resendAvailableAt: undefined,
      });
    });

    it('sends a new code when the flow expired', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.completeCredentialVerification.mockRejectedValueOnce(
        new MfaError('flow_expired', 'expired'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'submitCode', code: '123456' });
      expect(fake.controller.beginCredentialVerification).toHaveBeenCalledTimes(
        2,
      );
      expect(flow.getState()).toMatchObject({
        step: { name: 'otp', codeSent: true },
        codeResent: true,
        error: undefined,
      });
    });

    it('shows the error instead of resending when sending the code fails with too_many_attempts', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.beginCredentialVerification.mockRejectedValue(
        new MfaError('too_many_attempts', 'slow down'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      expect(fake.controller.beginCredentialVerification).toHaveBeenCalledTimes(
        1,
      );
      expect(flow.getState()).toMatchObject({
        step: { name: 'otp', codeSent: false },
        error: 'too_many_attempts',
        busy: false,
      });
    });

    it('resends at most once when the code expired and the new send fails too', async () => {
      const fake = createFakeController([]);
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);
      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      fake.controller.completeCredentialEnrollment.mockRejectedValueOnce(
        new MfaError('flow_expired', 'expired'),
      );
      fake.controller.beginCredentialEnrollment.mockRejectedValue(
        new MfaError('flow_expired', 'expired'),
      );

      await act(flow, { type: 'submitCode', code: '111111' });
      expect(fake.controller.beginCredentialEnrollment).toHaveBeenCalledTimes(
        2,
      );
      expect(flow.getState()).toMatchObject({
        error: 'flow_expired',
        busy: false,
      });
    });

    it('goes back to email entry when the address belongs to another account', async () => {
      const fake = createFakeController([]);
      fake.controller.completeCredentialEnrollment.mockRejectedValueOnce(
        new MfaError('credential_already_enrolled', 'taken'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'taken@b.co' });
      await act(flow, { type: 'submitCode', code: '111111' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'emailEntry', prefillEmail: 'taken@b.co' },
        error: 'credential_already_enrolled',
      });
    });

    it('refreshes and re-plans when the credential list was stale', async () => {
      const fake = createFakeController([]);
      fake.controller.beginCredentialEnrollment.mockImplementationOnce(
        async () => {
          fake.setCredentials([providerEmail]);
          throw new MfaError('email_socially_verified', 'social');
        },
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'me@gmail.com' });
      expect(flow.getState().step).toMatchObject({
        name: 'otp',
        purpose: 'verify',
        codeSent: true,
      });
    });

    it('goes to the failure screen when a stale-list fix fails twice', async () => {
      const fake = createFakeController([]);
      fake.controller.beginCredentialEnrollment.mockRejectedValue(
        new MfaError('aal2_required', 'verify first'),
      );
      const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      expect(flow.getState().step).toStrictEqual({
        name: 'failure',
        code: 'aal2_required',
        canRetry: false,
      });

      await act(flow, { type: 'dismiss' });
      const result = await outcome;
      expect(result.ok || getMfaErrorCode(result.error)).toBe('aal2_required');
    });

    it('shows a retry for temporary failures and repeats the last call', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.completeCredentialVerification.mockRejectedValueOnce(
        new MfaError('kratos_unavailable', 'down'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'submitCode', code: '123456' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'otp' },
        error: 'kratos_unavailable',
      });

      await act(flow, { type: 'retry' });
      expect(flow.getState().step).toStrictEqual({ name: 'success' });
    });

    it('treats a network error without a code as temporary', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.completeCredentialVerification.mockRejectedValueOnce(
        new TypeError('Network request failed'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'submitCode', code: '123456' });
      expect(flow.getState().error).toBe('server_error');
    });

    it('offers a retry when the first refresh fails, before any screen', async () => {
      const fake = createFakeController([activeEmail]);
      fake.controller.refreshEnrolledCredentials.mockRejectedValueOnce(
        new MfaError('kratos_unavailable', 'down'),
      );
      const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

      expect(flow.getState().step).toStrictEqual({
        name: 'failure',
        code: 'kratos_unavailable',
        canRetry: true,
      });

      await act(flow, { type: 'retry' });
      expect(flow.getState().step).toMatchObject({ name: 'otp' });
    });

    it('rejects upfront with no screen when the request cannot run', async () => {
      const fake = createFakeController([]);
      const { flow, outcome } = await startFlow(
        { kind: 'verifyOrEnroll', methods: ['passkey'], verifyWith: 'passkey' },
        fake.controller,
        { platform: 'extension' },
      );

      expect(flow.getState().step).toStrictEqual({ name: 'idle' });
      const result = await outcome;
      expect(result.ok || getMfaErrorCode(result.error)).toBe(
        'passkey_unsupported',
      );
    });

    it('rejects a passkey request upfront when the client has no passkey support', async () => {
      const fake = createFakeController([]);
      const { outcome } = await startFlow(
        { kind: 'enroll', method: 'passkey' },
        fake.controller,
        { passkey: undefined },
      );

      const result = await outcome;
      expect(result.ok || getMfaErrorCode(result.error)).toBe(
        'passkey_unsupported',
      );
      expect(fake.controller.refreshEnrolledCredentials).not.toHaveBeenCalled();
    });

    it('rejects upfront when the wallet cannot sign in', async () => {
      const fake = createFakeController([]);
      fake.controller.refreshEnrolledCredentials.mockRejectedValueOnce(
        new MfaError('authentication_required', 'locked'),
      );
      const { outcome } = await startFlow(EMAIL_ONLY, fake.controller);

      const result = await outcome;
      expect(result.ok || getMfaErrorCode(result.error)).toBe(
        'authentication_required',
      );
    });

    it('rejects with the code when the user closes the failure screen', async () => {
      const fake = createFakeController([]);
      fake.controller.beginCredentialEnrollment.mockRejectedValueOnce(
        new MfaError('max_identifiers_reached', 'full'),
      );
      const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

      await act(flow, { type: 'continue' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      await act(flow, { type: 'dismiss' });

      const result = await outcome;
      expect(result.ok || getMfaErrorCode(result.error)).toBe(
        'max_identifiers_reached',
      );
    });
  });

  it('stops after a cancel even when a call was in flight', async () => {
    const fake = createFakeController([activeEmail]);
    let finishVerification: () => void = () => undefined;
    fake.controller.completeCredentialVerification.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishVerification = () => resolve(buildToken('email_otp'));
        }),
    );
    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    flow.dispatch({ type: 'submitCode', code: '123456' });
    await act(flow, { type: 'cancel' });
    const stateAtCancel = flow.getState();
    finishVerification();
    await flush();

    expect(flow.getState()).toBe(stateAtCancel);
    expect((await outcome).ok).toBe(false);
  });

  it('resolves when the host cancels on the success screen', async () => {
    const fake = createFakeController([activeEmail]);
    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    await act(flow, { type: 'submitCode', code: '123456' });
    await act(flow, { type: 'cancel' });

    expect((await outcome).ok).toBe(true);
  });

  it('rejects with the shown code when the host cancels on the failure screen', async () => {
    const fake = createFakeController([]);
    fake.controller.beginCredentialEnrollment.mockRejectedValueOnce(
      new MfaError('max_identifiers_reached', 'full'),
    );
    const { flow, outcome } = await startFlow(EMAIL_ONLY, fake.controller);

    await act(flow, { type: 'continue' });
    await act(flow, { type: 'submitEmail', email: 'new@b.co' });
    await act(flow, { type: 'cancel' });

    const result = await outcome;
    expect(result.ok || getMfaErrorCode(result.error)).toBe(
      'max_identifiers_reached',
    );
  });

  it('allows one silent recovery per step, not per flow', async () => {
    const fake = createFakeController([]);
    fake.controller.beginCredentialEnrollment.mockImplementationOnce(
      async () => {
        fake.setCredentials([providerEmail]);
        throw new MfaError('email_socially_verified', 'social');
      },
    );
    fake.controller.beginCredentialVerification.mockRejectedValueOnce(
      new MfaError('credential_not_enrolled', 'stale'),
    );
    const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

    await act(flow, { type: 'continue' });
    await act(flow, { type: 'submitEmail', email: 'me@gmail.com' });

    expect(fake.controller.refreshEnrolledCredentials).toHaveBeenCalledTimes(3);
    expect(flow.getState().step).toMatchObject({
      name: 'otp',
      purpose: 'verify',
      codeSent: true,
    });
  });

  it('ignores actions while a call is in flight', async () => {
    const fake = createFakeController([activeEmail]);
    const { flow } = await startFlow(EMAIL_ONLY, fake.controller);

    flow.dispatch({ type: 'submitCode', code: '123456' });
    flow.dispatch({ type: 'submitCode', code: '123456' });
    await flush();

    expect(
      fake.controller.completeCredentialVerification,
    ).toHaveBeenCalledTimes(1);
  });

  describe('enroll', () => {
    it('sets up email from settings with no verification after', async () => {
      const fake = createFakeController([]);
      const { flow, outcome } = await startFlow(
        { kind: 'enroll', method: 'email_otp' },
        fake.controller,
      );

      expect(flow.getState().step).toMatchObject({ name: 'emailEntry' });
      await act(flow, { type: 'submitEmail', email: 'new@b.co' });
      await act(flow, { type: 'submitCode', code: '111111' });
      expect(
        fake.controller.beginCredentialVerification,
      ).not.toHaveBeenCalled();
      expect(flow.getState().step).toStrictEqual({ name: 'success' });

      await act(flow, { type: 'dismiss' });
      expect(await outcome).toMatchObject({ ok: true });
    });
  });

  describe('passkeys', () => {
    it('creates a passkey whose enrollment is the proof', async () => {
      const fake = createFakeController([]);
      const { flow, outcome } = await startFlow(
        { kind: 'verifyOrEnroll', methods: ['passkey'], verifyWith: 'passkey' },
        fake.controller,
      );

      await act(flow, { type: 'continue' });
      expect(flow.getState().step).toStrictEqual({
        name: 'passkey',
        purpose: 'setup',
      });

      await act(flow, { type: 'continue' });
      expect(passkeyAdapter.create).toHaveBeenCalled();
      expect(
        fake.controller.beginCredentialVerification,
      ).not.toHaveBeenCalled();
      expect(flow.getState().step).toStrictEqual({ name: 'success' });

      await act(flow, { type: 'dismiss' });
      expect(await outcome).toMatchObject({
        ok: true,
        value: { token: buildToken('passkey') },
      });
    });

    it('drops a session the server refused and confirms it is the user first', async () => {
      const fake = createFakeController([activeEmail]);
      fake.setSession(buildToken('email_otp'));
      fake.controller.beginCredentialEnrollment.mockRejectedValueOnce(
        new MfaError('aal2_required', 'verify first'),
      );
      const { flow } = await startFlow(
        { kind: 'enroll', method: 'passkey' },
        fake.controller,
      );

      await act(flow, { type: 'continue' });
      expect(fake.controller.clearVerificationSession).toHaveBeenCalled();
      expect(flow.getState().step).toMatchObject({
        name: 'otp',
        purpose: 'confirm',
        email: 'a@b.co',
      });
    });

    it('stays on the passkey screen when the system sheet is dismissed', async () => {
      const fake = createFakeController([passkey]);
      passkeyAdapter.get.mockRejectedValueOnce(
        Object.assign(new Error('cancelled'), {
          mfaCode: 'passkey_ceremony_cancelled',
        }),
      );
      const { flow } = await startFlow(
        { kind: 'verifyOrEnroll', methods: ['passkey'], verifyWith: 'passkey' },
        fake.controller,
      );

      await act(flow, { type: 'continue' });
      expect(flow.getState()).toMatchObject({
        step: { name: 'passkey', purpose: 'verify' },
        error: 'passkey_ceremony_cancelled',
      });

      await act(flow, { type: 'retry' });
      expect(flow.getState().step).toStrictEqual({ name: 'success' });
    });
  });

  it('retries only what failed after a code was accepted', async () => {
    const fake = createFakeController([activeEmail]);
    const { flow } = await startFlow(EMAIL_ONLY, fake.controller);
    fake.controller.getVerificationToken.mockRejectedValueOnce(
      new MfaError('kratos_unavailable', 'down'),
    );

    await act(flow, { type: 'submitCode', code: '123456' });
    expect(flow.getState().error).toBe('kratos_unavailable');

    await act(flow, { type: 'retry' });
    expect(
      fake.controller.completeCredentialVerification,
    ).toHaveBeenCalledTimes(1);
    expect(flow.getState().step).toStrictEqual({ name: 'success' });
  });

  it('does not offer a passkey to confirm with when the client has no passkey support', async () => {
    const fake = createFakeController([passkey]);
    const { flow } = await startFlow(EMAIL_ONLY, fake.controller, {
      passkey: undefined,
    });

    await act(flow, { type: 'continue' });
    expect(flow.getState().step).toStrictEqual({
      name: 'failure',
      code: 'passkey_unsupported',
      canRetry: false,
    });
  });
});
