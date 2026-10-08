import {
  getMfaRetryAfterMs,
  type EnrolledCredential,
  type VerificationToken,
} from '@metamask/profile-sync-controller/sdk';
import { MfaFlowError, getErrorHandling, getFlowErrorCode } from './errors';
import {
  getEnrollmentMaxSessionAgeMs,
  planEnroll,
  planVerifyOrEnroll,
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
  VerifyOrEnrollRequest,
} from './types';

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- kept identical to metamask-mobile's engine, which uses interfaces
interface CurrentStep {
  method: MfaMethod;
  purpose: MfaPurpose;
  flowId?: string;
  email?: string;
}

const toList = (verifyWith: VerifyOrEnrollRequest['verifyWith']) => {
  if (verifyWith === undefined) {
    return [];
  }
  return Array.isArray(verifyWith) ? verifyWith : [verifyWith];
};

export const createMfaFlow = ({
  request,
  reason,
  platform,
  controller,
  passkey,
  now = Date.now,
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
  let outcome: MfaFlowResult | undefined;
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

  const fail = (code: MfaFlowErrorCode, canRetry = false) => {
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
    outcome = wantsToken && token ? { credentials, token } : { credentials };
    if (!presented) {
      const value = outcome;
      settle(() => resolveResult(value));
      return;
    }
    show({ name: 'success' });
  };

  const sendEmailCode = async () => {
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
            type: 'email_otp',
            reason: tokenReason,
          });
    current.flowId = challenge.flowId;
    if (state.step.name === 'otp') {
      setState({
        step: { ...state.step, codeSent: true },
        busy: false,
        error: undefined,
        resendAvailableAt: undefined,
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

  const startVerification = async (
    method: MfaMethod,
    purpose: Exclude<MfaPurpose, 'setup'>,
  ) => {
    current = { method, purpose };
    if (method === 'passkey') {
      show({ name: 'passkey', purpose });
      return;
    }
    show(
      { name: 'otp', purpose, email: getEmailAddress(), codeSent: false },
      { busy: true },
    );
    await sendEmailCode();
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
        show({ name: 'intro', missing: step.missing }, { progress });
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
        current = { method: step.method, purpose: 'setup' };
        show(
          step.method === 'email_otp'
            ? { name: 'emailEntry', prefillEmail: step.prefillEmail }
            : { name: 'passkey', purpose: 'setup' },
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
   * Sends a new email code when the one on screen expired, otherwise shows
   * the error. Only a code that was sent can expire; a send failing with
   * these codes would otherwise resend forever.
   *
   * @param code - The error's code.
   * @param isRecovery - Whether the failed operation was itself a recovery.
   * @returns The recovery to run, or `undefined` when the state shows the error.
   */
  const restartChallenge = (
    code: MfaFlowErrorCode,
    isRecovery: boolean,
  ): (() => Promise<void>) | undefined => {
    if (
      !isRecovery &&
      current?.flowId &&
      current.method === 'email_otp' &&
      state.step.name === 'otp'
    ) {
      return async () => {
        await sendEmailCode();
        setState({ codeResent: true });
      };
    }
    setState({ busy: false, error: code });
    return undefined;
  };

  /**
   * Shows an error the user can fix on the same step. An email linked to
   * another account goes back to email entry.
   *
   * @param code - The error's code.
   */
  const showInlineError = (code: MfaFlowErrorCode) => {
    if (
      code === 'credential_already_enrolled' &&
      current?.method === 'email_otp' &&
      current.purpose === 'setup'
    ) {
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
    if (!presented && handling !== 'refresh' && handling !== 'failure') {
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
        fail(code);
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

  const continueStep = async (step: MfaFlowStep) => {
    if (step.name === 'intro') {
      introShown = true;
      await run(advance);
    } else if (step.name === 'passkey') {
      await run(async () => {
        await runPasskey();
        // The ceremony went through: retrying must not run it again.
        lastOperation = advance;
        await advance();
      });
    }
  };

  const submitEmailAddress = async (email: string) => {
    current = { method: 'email_otp', purpose: 'setup', email };
    show(
      { name: 'otp', purpose: 'setup', email, codeSent: false },
      { busy: true },
    );
    await run(sendEmailCode);
  };

  const submitEmailCode = async (code: string) => {
    if (!current?.flowId) {
      return;
    }
    const { flowId, purpose } = current;
    await run(async () => {
      const proof = { type: 'email_otp' as const, code };
      if (purpose === 'setup') {
        credentials = await controller.completeCredentialEnrollment({
          flowId,
          proof,
          reason: tokenReason,
        });
        markCompleted('email_otp');
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
   * Ends the flow from the success or failure screen; anywhere else only a
   * cancel ends it.
   *
   * @param step - The step on screen.
   * @param isCancel - Whether the host is closing the flow.
   */
  const closeFlow = (step: MfaFlowStep, isCancel: boolean) => {
    if (step.name === 'success' && outcome) {
      const value = outcome;
      settle(() => resolveResult(value));
    } else if (step.name === 'failure') {
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
          await submitEmailCode(action.code);
        }
        return;
      case 'resend':
        if (step.name === 'otp') {
          await run(sendEmailCode);
        }
        return;
      case 'retry':
        if (lastOperation) {
          await run(lastOperation);
        }
        return;
      case 'dismiss':
      case 'cancel':
        closeFlow(step, action.type === 'cancel');
    }
  };

  return {
    reason,
    result,
    start: () => {
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
    },
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
