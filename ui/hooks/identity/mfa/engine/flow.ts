import {
  getMfaRetryAfterMs,
  type EnrolledCredential,
  type EnrollmentChallenge,
  type VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
import {
  MfaFlowError,
  getErrorHandling,
  getFlowErrorCode,
  isReportable,
} from './errors';
import {
  getEnrollmentMaxSessionAgeMs,
  planEnroll,
  planVerifyOrEnroll,
  toList,
} from './planner';
import type {
  MfaFlow,
  MfaFlowAction,
  MfaFlowErrorCode,
  MfaFlowOptions,
  MfaFlowResult,
  MfaFlowState,
  MfaFlowStep,
  MfaMethod,
  MfaPurpose,
  Plan,
  PlanContext,
} from './types';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- kept identical to metamask-mobile's engine, which uses interfaces
interface CurrentStep {
  method: MfaMethod;
  purpose: MfaPurpose;
  flowId?: string;
  email?: string;
}

/**
 * The server's minimum gap between two email codes. A sent code starts it, so
 * the resend button waits rather than failing with the cooldown error.
 */
const EMAIL_RESEND_COOLDOWN_MS = 60_000;

export const createMfaFlow = ({
  request,
  reason,
  platform,
  controller,
  passkey,
  now = Date.now,
  reportError,
}: MfaFlowOptions): MfaFlow => {
  const tokenReason = { operation: reason.operation };
  const completed: MfaMethod[] = [];
  const listeners = new Set<() => void>();

  let credentials: EnrolledCredential[] = [];
  let flowStartedAt = now();
  let introShown = false;
  let presented = false;
  let settled = false;
  /** The step that already used its one silent recovery. */
  let recoveredStep: string | undefined;
  let current: CurrentStep | undefined;
  let lastOperation: (() => Promise<void>) | undefined;
  /** The authenticator setup on screen before its code, so back can return. */
  let totpSetup: Extract<MfaFlowStep, { name: 'totpSetup' }> | undefined;
  let state: MfaFlowState = {
    step: { name: 'idle' },
    busy: false,
    progress: { current: 1, total: 1 },
  };

  let resolveResult: (value: MfaFlowResult) => void = () => undefined;
  let rejectResult: (error: MfaFlowError) => void = () => undefined;
  const result = new Promise<MfaFlowResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const setState = (next: Partial<MfaFlowState>) => {
    if (settled) {
      return;
    }
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const show = (step: MfaFlowStep, extra: Partial<MfaFlowState> = {}) => {
    presented = true;
    setState({
      step,
      busy: false,
      error: undefined,
      codeResent: undefined,
      resendAvailableAt: undefined,
      ...extra,
    });
  };

  const settle = (settleWith: () => void) => {
    if (settled) {
      return;
    }
    settled = true;
    settleWith();
  };

  const rejectWith = (code: MfaFlowErrorCode) =>
    settle(() => rejectResult(new MfaFlowError(code, [...completed])));

  const fail = (code: MfaFlowErrorCode, canRetry = false, error?: unknown) => {
    if (isReportable(code)) {
      reportError?.(error ?? new MfaFlowError(code), {
        code,
        operation: reason.operation,
        step: state.step.name,
      });
    }
    if (!presented && !canRetry) {
      rejectWith(code);
      return;
    }
    show({ name: 'failure', code, canRetry });
  };

  const getEmailAddress = () => {
    for (const credential of credentials) {
      if (credential.type === 'email_otp' && credential.status === 'active') {
        return credential.email;
      }
    }
    return undefined;
  };

  const planNext = (token: VerificationToken | null): Plan => {
    const context: PlanContext = {
      platform,
      credentials,
      session: token && {
        obtainedAt: token.obtainedAt,
        amr: token.claims.amr,
      },
      flowStartedAt,
      now: now(),
      introShown,
    };
    return request.kind === 'enroll'
      ? planEnroll(request.method, context)
      : planVerifyOrEnroll(request, context);
  };

  const finish = (token: VerificationToken | null) => {
    const wantsToken =
      request.kind === 'verifyOrEnroll' &&
      toList(request.verifyWith).length > 0;
    const value =
      wantsToken && token ? { credentials, token } : { credentials };
    settle(() => resolveResult(value));
  };

  /**
   * Starts the server-side flow a code is checked against: sends an email
   * code, or opens a verification for the authenticator app's code (an app
   * setup has its own step, `startTotpSetup`).
   */
  const beginCodeChallenge = async () => {
    if (!current) {
      return;
    }
    const challenge =
      current.purpose === 'setup'
        ? await controller.beginCredentialEnrollment({
            type: 'email_otp',
            email: current.email,
            reason: tokenReason,
            maxSessionAgeMs: getEnrollmentMaxSessionAgeMs(flowStartedAt, now()),
          })
        : await controller.beginCredentialVerification({
            type: current.method === 'totp' ? 'totp' : 'email_otp',
            reason: tokenReason,
          });
    current.flowId = challenge.flowId;
    if (state.step.name === 'otp') {
      setState({
        step: { ...state.step, codeSent: true },
        busy: false,
        error: undefined,
        resendAvailableAt:
          current.method === 'email_otp'
            ? now() + EMAIL_RESEND_COOLDOWN_MS
            : undefined,
      });
    }
  };

  const markCompleted = (method: MfaMethod) => {
    if (!completed.includes(method)) {
      completed.push(method);
    }
  };

  const runPasskey = async () => {
    if (!current) {
      return;
    }
    if (!passkey) {
      throw new MfaFlowError('passkey_unsupported');
    }
    if (current.purpose === 'setup') {
      const challenge = await controller.beginCredentialEnrollment({
        type: 'passkey',
        reason: tokenReason,
        maxSessionAgeMs: getEnrollmentMaxSessionAgeMs(flowStartedAt, now()),
      });
      if (challenge.type !== 'passkey') {
        throw new MfaFlowError('invalid_response');
      }
      const attestation = await passkey.create(challenge.publicKey);
      credentials = await controller.completeCredentialEnrollment({
        flowId: challenge.flowId,
        proof: { type: 'passkey', attestation },
        reason: tokenReason,
      });
      markCompleted('passkey');
    } else {
      const challenge = await controller.beginCredentialVerification({
        type: 'passkey',
        reason: tokenReason,
      });
      if (challenge.type !== 'passkey') {
        throw new MfaFlowError('invalid_response');
      }
      const assertion = await passkey.get(challenge.publicKey);
      await controller.completeCredentialVerification({
        flowId: challenge.flowId,
        proof: { type: 'passkey', assertion },
        reason: tokenReason,
      });
    }
  };

  /**
   * Starts an authenticator app setup and shows its secret. Restarting gives
   * a new secret, so the step says when an earlier one stopped working.
   *
   * @param isRestart - Whether a previous setup in this flow expired.
   */
  const startTotpSetup = async (isRestart = false) => {
    let challenge: EnrollmentChallenge;
    try {
      challenge = await controller.beginCredentialEnrollment({
        type: 'totp',
        reason: tokenReason,
        maxSessionAgeMs: getEnrollmentMaxSessionAgeMs(flowStartedAt, now()),
      });
    } catch (error) {
      // Nothing on screen belongs to this setup yet: whatever step came
      // before is still shown, and its actions would no longer apply. Show
      // the failure screen with "Try again" instead, unless the error means
      // the credentials are out of date: the refresh then re-plans.
      const code = getFlowErrorCode(error);
      if (getErrorHandling(code) !== 'refresh') {
        show({ name: 'failure', code, canRetry: true });
      }
      throw error;
    }
    if (challenge.type !== 'totp') {
      throw new MfaFlowError('invalid_response');
    }
    // Only a setup that started becomes the current step.
    current = { method: 'totp', purpose: 'setup', flowId: challenge.flowId };
    totpSetup = {
      name: 'totpSetup',
      secret: challenge.secret,
      qrCode: challenge.qrCode,
      setupUri: challenge.setupUri,
      isRestart,
    };
    show(totpSetup);
  };

  const startVerification = async (
    method: MfaMethod,
    purpose: Exclude<MfaPurpose, 'setup'>,
  ) => {
    if (method === 'passkey') {
      await startPasskey(purpose);
      return;
    }
    current = { method, purpose };
    show(
      {
        name: 'otp',
        purpose,
        method: method === 'totp' ? 'totp' : 'email_otp',
        email: method === 'totp' ? undefined : getEmailAddress(),
        codeSent: false,
      },
      { busy: true },
    );
    await beginCodeChallenge();
  };

  /**
   * The methods this client can verify with now: a passkey needs the passkey
   * adapter.
   *
   * @param options - The methods the plan accepts, cheapest first.
   * @returns The usable ones, in the same order.
   */
  const getUsableOptions = (options: MfaMethod[]) =>
    passkey ? options : options.filter((method) => method !== 'passkey');

  const advance = async () => {
    if (settled) {
      return;
    }
    if (request.kind === 'enroll' && completed.length > 0) {
      finish(null);
      return;
    }
    const token = await controller.getVerificationToken();
    const plan = planNext(token);
    if (!plan.ok) {
      fail(plan.code);
      return;
    }
    const remainingSetups = plan.steps.filter(
      (step) => step.kind === 'setup',
    ).length;
    const total = Math.max(completed.length + remainingSetups, 1);
    const progress = {
      current: Math.min(completed.length + 1, total),
      total,
    };
    const [step] = plan.steps;
    if (!step) {
      finish(token);
      return;
    }
    // eslint-disable-next-line default-case -- covers every step kind; TypeScript checks it
    switch (step.kind) {
      case 'intro':
        show(
          {
            name: 'intro',
            methods: step.methods,
            missing: step.missing,
            email: getEmailAddress(),
          },
          { progress },
        );
        return;
      case 'confirm':
      case 'verify': {
        const options = getUsableOptions(step.options);
        if (options.length === 0) {
          fail('passkey_unsupported');
          return;
        }
        if (options.length > 1) {
          show({ name: 'picker', purpose: step.kind, options }, { progress });
          return;
        }
        setState({ progress });
        await startVerification(options[0], step.kind);
        return;
      }
      case 'setup':
        if (step.method === 'passkey') {
          setState({ progress });
          await startPasskey('setup');
          return;
        }
        if (step.method === 'totp') {
          setState({ progress });
          await startTotpSetup();
          return;
        }
        current = { method: 'email_otp', purpose: 'setup' };
        show(
          { name: 'emailEntry', prefillEmail: step.prefillEmail },
          { progress },
        );
    }
  };

  /**
   * Refreshes the credentials and re-plans, once per step: the same step
   * failing this way again ends the flow, so a server bug cannot loop.
   *
   * @param code - The error's code.
   * @returns The recovery to run, or `undefined` when the flow failed.
   */
  const recoverStaleState = (
    code: MfaFlowErrorCode,
  ): (() => Promise<void>) | undefined => {
    const stepKey = current ? `${current.purpose}:${current.method}` : 'start';
    if (stepKey === recoveredStep) {
      fail(code);
      return undefined;
    }
    recoveredStep = stepKey;
    return async () => {
      if (code === 'aal2_required' || code === 'verification_token_invalid') {
        await controller.clearVerificationSession();
      }
      credentials = await controller.refreshEnrolledCredentials();
      await advance();
    };
  };

  /**
   * Starts a new challenge when the one on screen expired, otherwise shows
   * the error: a new email code, a new authenticator app verification (the
   * user enters the app's current code), or a new app setup, whose new secret
   * replaces the one the user may have added. Only a started challenge can
   * expire; a start failing with these codes would otherwise restart forever.
   *
   * There is no `resendAvailableAt` check here: a resend that comes too early
   * fails with a cooldown code, which the `cooldown` branch handles, and a
   * successful send restarts it in `beginCodeChallenge`.
   *
   * @param code - The error's code.
   * @param isRecovery - Whether the failed operation was itself a recovery.
   * @returns The recovery to run, or `undefined` when the state shows the error.
   */
  const restartChallenge = (
    code: MfaFlowErrorCode,
    isRecovery: boolean,
  ): (() => Promise<void>) | undefined => {
    if (!isRecovery && current?.flowId && state.step.name === 'otp') {
      if (current.method === 'email_otp') {
        return async () => {
          await beginCodeChallenge();
          setState({ codeResent: true });
        };
      }
      if (current.method === 'totp') {
        return current.purpose === 'setup'
          ? () => startTotpSetup(true)
          : async () => {
              await beginCodeChallenge();
              setState({ error: code });
            };
      }
    }
    setState({ busy: false, error: code });
    return undefined;
  };

  /**
   * Shows an error the user can fix on the same step. An email linked to
   * another account goes back to email entry, and its spent challenge is
   * dropped so continuing sends a new code.
   *
   * @param code - The error's code.
   */
  const showInlineError = (code: MfaFlowErrorCode) => {
    if (
      code === 'credential_already_enrolled' &&
      current?.method === 'email_otp' &&
      current.purpose === 'setup'
    ) {
      current = { ...current, flowId: undefined };
      show(
        { name: 'emailEntry', prefillEmail: current.email },
        { error: code },
      );
    } else {
      setState({ busy: false, error: code });
    }
  };

  /**
   * Applies the error to the state, or returns the operation that recovers
   * from it.
   *
   * @param error - The error thrown by the failed operation.
   * @param isRecovery - Whether that operation was itself a recovery; then an
   * expired code is not resent again.
   * @returns The recovery to run, or `undefined` when the state shows the error.
   */
  const handleError = (
    error: unknown,
    isRecovery: boolean,
  ): (() => Promise<void>) | undefined => {
    if (settled) {
      return undefined;
    }
    const code = getFlowErrorCode(error);
    const handling = getErrorHandling(code);
    if (
      !presented &&
      handling !== 'refresh' &&
      handling !== 'failure' &&
      handling !== 'support'
    ) {
      // No screen yet to show the error on: the failure screen offers to try
      // again, so the flow cannot hang on `idle`.
      fail(code, true);
      return undefined;
    }
    switch (handling) {
      case 'refresh':
        return recoverStaleState(code);
      case 'restart':
        return restartChallenge(code, isRecovery);
      case 'cooldown': {
        const retryAfterMs = getMfaRetryAfterMs(error);
        setState({
          busy: false,
          error: code,
          resendAvailableAt:
            retryAfterMs === undefined ? undefined : now() + retryAfterMs,
        });
        return undefined;
      }
      case 'inline':
        showInlineError(code);
        return undefined;
      case 'failure':
        fail(code, false, error);
        return undefined;
      case 'support':
        // Shown even before any other screen: the user needs a way to
        // contact support.
        show({ name: 'failure', code, canRetry: false });
        return undefined;
      default:
        setState({ busy: false, error: code });
        return undefined;
    }
  };

  const run = async (
    operation: () => Promise<void>,
    isRecovery = false,
  ): Promise<void> => {
    lastOperation = operation;
    setState({ busy: true, error: undefined });
    try {
      await operation();
    } catch (error) {
      const recovery = handleError(error, isRecovery);
      if (recovery) {
        await run(recovery, true);
      }
    }
  };

  /**
   * Opens the system passkey sheet straight away. The passkey screen only
   * shows when the sheet fails, with the error and a way to try again.
   *
   * A function declaration, as it and `advance` call each other.
   *
   * @param purpose - Why the passkey is used.
   */
  async function startPasskey(purpose: MfaPurpose) {
    current = { method: 'passkey', purpose };
    try {
      await runPasskey();
    } catch (error) {
      show({ name: 'passkey', purpose });
      throw error;
    }
    // The ceremony went through: retrying must not run it again.
    lastOperation = advance;
    await advance();
  }

  const continueStep = async (step: MfaFlowStep) => {
    if (step.name === 'intro') {
      introShown = true;
      await run(advance);
    } else if (step.name === 'passkey') {
      await run(() => startPasskey(step.purpose));
    } else if (step.name === 'totpSetup') {
      show({ name: 'otp', purpose: 'setup', method: 'totp', codeSent: true });
    }
  };

  const submitEmailAddress = async (email: string) => {
    // Returning from the setup code keeps its challenge. Continuing with the
    // same address returns to that code instead of sending another one.
    if (
      current?.method === 'email_otp' &&
      current.purpose === 'setup' &&
      current.email === email &&
      current.flowId
    ) {
      show({
        name: 'otp',
        purpose: 'setup',
        method: 'email_otp',
        email,
        codeSent: true,
      });
      return;
    }
    current = { method: 'email_otp', purpose: 'setup', email };
    // Stay on email entry until a code is sent. Opening the code screen
    // first tells the user a code went out when enrollment still failed.
    await run(async () => {
      await beginCodeChallenge();
      show(
        {
          name: 'otp',
          purpose: 'setup',
          method: 'email_otp',
          email,
          codeSent: true,
        },
        { resendAvailableAt: now() + EMAIL_RESEND_COOLDOWN_MS },
      );
    });
  };

  const submitCode = async (code: string) => {
    if (!current?.flowId) {
      return;
    }
    const { flowId, purpose, method } = current;
    await run(async () => {
      const proof = {
        type: method === 'totp' ? ('totp' as const) : ('email_otp' as const),
        code,
      };
      if (purpose === 'setup') {
        credentials = await controller.completeCredentialEnrollment({
          flowId,
          proof,
          reason: tokenReason,
        });
        markCompleted(proof.type);
      } else {
        await controller.completeCredentialVerification({
          flowId,
          proof,
          reason: tokenReason,
        });
      }
      // The code was accepted: retrying must not submit it again.
      lastOperation = advance;
      await advance();
    });
  };

  /**
   * Ends the flow from the failure screen; anywhere else only a cancel ends
   * it.
   *
   * @param step - The step on screen.
   * @param isCancel - Whether the host is closing the flow.
   */
  const closeFlow = (step: MfaFlowStep, isCancel: boolean) => {
    if (step.name === 'failure') {
      rejectWith(step.code);
    } else if (isCancel) {
      rejectWith('flow_cancelled');
    }
  };

  const handleAction = async (action: MfaFlowAction) => {
    const { step } = state;
    // eslint-disable-next-line default-case -- covers every action type; TypeScript checks it
    switch (action.type) {
      case 'continue':
        await continueStep(step);
        return;
      case 'choose':
        if (step.name === 'picker' && step.options.includes(action.method)) {
          const { purpose } = step;
          await run(() => startVerification(action.method, purpose));
        }
        return;
      case 'submitEmail':
        if (step.name === 'emailEntry') {
          await submitEmailAddress(action.email);
        }
        return;
      case 'submitCode':
        if (step.name === 'otp') {
          await submitCode(action.code);
        }
        return;
      case 'resend':
        // Authenticator app codes are not sent, as the app shows a new one:
        // only a verification that failed to start is started again.
        if (
          step.name === 'otp' &&
          (step.method === 'email_otp' || !step.codeSent)
        ) {
          await run(beginCodeChallenge);
        }
        return;
      case 'retry':
        if (lastOperation) {
          await run(lastOperation);
        }
        return;
      case 'back':
        // Setup codes return to the setup behind them without replacing the
        // authenticator secret or sending another email code.
        if (
          step.name === 'otp' &&
          step.purpose === 'setup' &&
          step.method === 'totp' &&
          totpSetup
        ) {
          show(totpSetup);
        } else if (
          step.name === 'otp' &&
          step.purpose === 'setup' &&
          step.method === 'email_otp' &&
          current?.email
        ) {
          show({ name: 'emailEntry', prefillEmail: current.email });
        }
        return;
      case 'dismiss':
      case 'cancel':
        closeFlow(step, action.type === 'cancel');
    }
  };

  const start = () => {
    flowStartedAt = now();
    const needsPasskey =
      request.kind === 'enroll'
        ? request.method === 'passkey'
        : request.methods.includes('passkey');
    if (needsPasskey && !passkey) {
      rejectWith('passkey_unsupported');
      return Promise.resolve();
    }
    return run(async () => {
      credentials = await controller.refreshEnrolledCredentials();
      await advance();
    });
  };

  return {
    reason,
    result,
    start,
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch: (action) => {
      if (settled || (state.busy && action.type !== 'cancel')) {
        return;
      }
      handleAction(action).catch(() => undefined);
    },
  };
};
