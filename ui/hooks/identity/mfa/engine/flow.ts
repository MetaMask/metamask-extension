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
      completed.push('passkey');
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
    const progress = {
      current: completed.length + 1,
      total: Math.max(completed.length + remainingSetups, 1),
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
      case 'verify':
        if (step.options.length > 1) {
          show(
            { name: 'picker', purpose: step.kind, options: step.options },
            { progress },
          );
          return;
        }
        setState({ progress });
        await startVerification(step.options[0], step.kind);
        return;
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
    switch (getErrorHandling(code)) {
      case 'refresh': {
        const stepKey = current
          ? `${current.purpose}:${current.method}`
          : 'start';
        if (stepKey === recoveredStep) {
          fail(code);
          return undefined;
        }
        recoveredStep = stepKey;
        return async () => {
          if (
            code === 'aal2_required' ||
            code === 'verification_token_invalid'
          ) {
            await controller.clearVerificationSession();
          }
          credentials = await controller.refreshEnrolledCredentials();
          await advance();
        };
      }
      case 'restart':
        // Only a code that was sent can expire; a send failing with these
        // codes would otherwise resend forever.
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
        return undefined;
      case 'failure':
        fail(code);
        return undefined;
      default:
        if (presented) {
          setState({ busy: false, error: code });
        } else {
          fail(code, true);
        }
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

  const handleAction = async (action: MfaFlowAction) => {
    const { step } = state;
    // eslint-disable-next-line default-case -- covers every action type; TypeScript checks it
    switch (action.type) {
      case 'continue':
        if (step.name === 'intro') {
          introShown = true;
          await run(advance);
        } else if (step.name === 'passkey') {
          await run(async () => {
            await runPasskey();
            await advance();
          });
        }
        return;
      case 'choose':
        if (step.name === 'picker' && step.options.includes(action.method)) {
          const { purpose } = step;
          await run(() => startVerification(action.method, purpose));
        }
        return;
      case 'submitEmail':
        if (step.name === 'emailEntry') {
          current = {
            method: 'email_otp',
            purpose: 'setup',
            email: action.email,
          };
          show(
            {
              name: 'otp',
              purpose: 'setup',
              email: action.email,
              codeSent: false,
            },
            { busy: true },
          );
          await run(sendEmailCode);
        }
        return;
      case 'submitCode':
        if (step.name === 'otp' && current?.flowId) {
          const { flowId, purpose } = current;
          await run(async () => {
            const proof = { type: 'email_otp' as const, code: action.code };
            if (purpose === 'setup') {
              credentials = await controller.completeCredentialEnrollment({
                flowId,
                proof,
                reason: tokenReason,
              });
              completed.push('email_otp');
            } else {
              await controller.completeCredentialVerification({
                flowId,
                proof,
                reason: tokenReason,
              });
            }
            await advance();
          });
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
        if (step.name === 'success' && outcome) {
          const value = outcome;
          settle(() => resolveResult(value));
        } else if (step.name === 'failure') {
          rejectWith(step.code);
        } else if (action.type === 'cancel') {
          rejectWith('flow_cancelled');
        }
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
