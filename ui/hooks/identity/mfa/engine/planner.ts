import { ENROLLMENT_MAX_SESSION_AGE_MS } from '@metamask/profile-sync-controller/auth';
import type { EnrolledCredential } from '@metamask/profile-sync-controller/sdk';
import type {
  MethodStatus,
  MethodStatuses,
  MfaKitErrorCode,
  MfaMethod,
  MfaPlatform,
  Plan,
  PlanContext,
  PlanStep,
  SessionSnapshot,
  VerifyOrEnrollRequest,
} from './types';

/**
 * Methods the kit supports, cheapest to verify first. Picker order, the
 * "confirm it's you" default and setup order (after the `verifyWith` methods
 * move last) all follow it.
 */
const METHOD_COST_RANKING: readonly MfaMethod[] = ['passkey', 'email_otp'];

const PLATFORM_METHODS: Record<MfaPlatform, readonly MfaMethod[]> = {
  mobile: ['passkey', 'email_otp'],
  extension: ['email_otp'],
};

const isMethodSupported = (method: MfaMethod, platform: MfaPlatform) =>
  PLATFORM_METHODS[platform].includes(method);

const sortByCost = (methods: Iterable<MfaMethod>): MfaMethod[] => {
  const wanted = new Set(methods);
  return METHOD_COST_RANKING.filter((method) => wanted.has(method));
};

const getMethodStatus = (
  method: MfaMethod,
  credentials: EnrolledCredential[],
  platform: MfaPlatform,
): MethodStatus => {
  const rows = credentials.filter((credential) => credential.type === method);
  const isActive = rows.some((row) => row.status === 'active');
  const isSupported = isMethodSupported(method, platform);
  const pendingRow = rows.find(
    (row) => row.type === 'email_otp' && row.status === 'pending',
  );

  return {
    method,
    isActive,
    canVerify: isActive && isSupported,
    // One email per profile; passkeys can always be added.
    canEnroll: isSupported && (method === 'passkey' || !isActive),
    pendingIdentifier:
      pendingRow?.type === 'email_otp' ? pendingRow.email : undefined,
    credentials: rows,
  };
};

/**
 * Per-method view of the server's credential list for this platform. A
 * pending email counts as not set up.
 *
 * @param credentials - The `refreshEnrolledCredentials()` result.
 * @param platform - The client running the kit.
 * @returns One status per supported method.
 */
export const getMethodStatuses = (
  credentials: EnrolledCredential[],
  platform: MfaPlatform,
): MethodStatuses =>
  Object.fromEntries(
    METHOD_COST_RANKING.map((method) => [
      method,
      getMethodStatus(method, credentials, platform),
    ]),
  ) as MethodStatuses;

const fail = (code: MfaKitErrorCode): Plan => ({ ok: false, code });

const isYoungerThan = (
  session: SessionSnapshot,
  maxAgeMs: number,
  now: number,
): boolean => now - session.obtainedAt < maxAgeMs;

/**
 * Age limit for a session that authorizes adding a factor: proven during this
 * flow, or within `ENROLLMENT_MAX_SESSION_AGE_MS`. The same value is passed to
 * `beginCredentialEnrollment`, so the planner and the controller agree.
 *
 * @param flowStartedAt - When the flow started.
 * @param now - Current time.
 * @returns The `maxSessionAgeMs` to use for enrollment.
 */
export const getEnrollmentMaxSessionAgeMs = (
  flowStartedAt: number,
  now: number,
): number => Math.max(now - flowStartedAt, ENROLLMENT_MAX_SESSION_AGE_MS);

const toList = (verifyWith: VerifyOrEnrollRequest['verifyWith']) => {
  if (verifyWith === undefined) {
    return [];
  }
  return Array.isArray(verifyWith) ? verifyWith : [verifyWith];
};

const getActiveMethods = (statuses: MethodStatuses) =>
  METHOD_COST_RANKING.filter((method) => statuses[method].isActive);

/**
 * Orders the setups so the `verifyWith` methods come last: each enrollment
 * replaces the session with one proven by the method just enrolled, so the
 * last setup is what the final proof can reuse.
 *
 * @param missing - The methods to set up.
 * @param verifyWith - The methods the final proof accepts.
 * @returns The setup order.
 */
const orderSetups = (
  missing: MfaMethod[],
  verifyWith: MfaMethod[],
): MfaMethod[] => {
  const byCost = sortByCost(missing);
  return [
    ...byCost.filter((method) => !verifyWith.includes(method)),
    ...byCost.filter((method) => verifyWith.includes(method)),
  ];
};

/**
 * Tracks what the plan assumes as it walks forward: which methods are active
 * and which session exists after each step.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- kept identical to metamask-mobile's engine, which uses interfaces
interface Simulation {
  active: Set<MfaMethod>;
  session: SessionSnapshot | null;
  canAddFactor: boolean;
}

const startSimulation = (
  statuses: MethodStatuses,
  context: PlanContext,
): Simulation => ({
  active: new Set(getActiveMethods(statuses)),
  session: context.session,
  canAddFactor:
    context.session !== null &&
    isYoungerThan(
      context.session,
      getEnrollmentMaxSessionAgeMs(context.flowStartedAt, context.now),
      context.now,
    ),
});

/**
 * Adds "confirm it's you" when the profile already has a method and no
 * session may add a factor. Returns an error code when no active method can
 * be verified on this platform.
 *
 * @param steps - The plan so far; the confirm step is appended to it.
 * @param simulation - The state the plan assumes at this point; updated in place.
 * @param context - The planning context.
 * @returns `passkey_unsupported` when no active method works here, otherwise `undefined`.
 */
const addConfirmIfNeeded = (
  steps: PlanStep[],
  simulation: Simulation,
  context: PlanContext,
): MfaKitErrorCode | undefined => {
  if (simulation.active.size === 0 || simulation.canAddFactor) {
    return undefined;
  }
  const options = sortByCost(simulation.active).filter((method) =>
    isMethodSupported(method, context.platform),
  );
  if (options.length === 0) {
    return 'passkey_unsupported';
  }
  steps.push({ kind: 'confirm', options });
  // Planning ahead assumes the cheapest option; the next re-plan uses the
  // real session.
  simulation.session = { obtainedAt: context.now, amr: [options[0]] };
  simulation.canAddFactor = true;
  return undefined;
};

/**
 * Plans a feature's `verifyOrEnroll` call: intro, then per missing method an
 * optional "confirm it's you" and its setup, then an optional verification.
 * Recomputed from fresh state after every step.
 *
 * @param request - What the feature asked for.
 * @param context - Current credentials, session and flow state.
 * @returns The remaining steps, or the code to reject with.
 */
export const planVerifyOrEnroll = (
  request: VerifyOrEnrollRequest,
  context: PlanContext,
): Plan => {
  const verifyWith = toList(request.verifyWith);
  if (verifyWith.some((method) => !request.methods.includes(method))) {
    return fail('invalid_request');
  }

  const statuses = getMethodStatuses(context.credentials, context.platform);
  const missing = orderSetups(
    request.methods.filter((method) => !statuses[method].isActive),
    verifyWith,
  );
  if (missing.some((method) => !statuses[method].canEnroll)) {
    return fail('passkey_unsupported');
  }

  const steps: PlanStep[] = [];
  if (missing.length > 0 && !context.introShown) {
    steps.push({ kind: 'intro', missing });
  }

  const simulation = startSimulation(statuses, context);
  for (const method of missing) {
    const error = addConfirmIfNeeded(steps, simulation, context);
    if (error) {
      return fail(error);
    }
    steps.push({
      kind: 'setup',
      method,
      prefillEmail: statuses[method].pendingIdentifier,
    });
    simulation.active.add(method);
    // The enrollment opens a session proven with this method; if the token
    // exchange fails, the next re-plan sees the real session.
    simulation.session = { obtainedAt: context.now, amr: [method] };
    simulation.canAddFactor = true;
  }

  if (verifyWith.length > 0) {
    const { session } = simulation;
    const sessionMatches =
      session !== null &&
      session.amr.some((method) => verifyWith.includes(method as MfaMethod)) &&
      (request.maxSessionAgeMs === undefined ||
        session.obtainedAt >= context.flowStartedAt ||
        isYoungerThan(session, request.maxSessionAgeMs, context.now));
    if (!sessionMatches) {
      const options = sortByCost(verifyWith).filter(
        (method) =>
          simulation.active.has(method) &&
          isMethodSupported(method, context.platform),
      );
      if (options.length === 0) {
        return fail('passkey_unsupported');
      }
      steps.push({ kind: 'verify', options });
    }
  }

  return { ok: true, steps };
};

/**
 * Plans a settings `enroll(method)` call: an optional "confirm it's you",
 * then the setup. No intro and no verification after.
 *
 * @param method - The method to set up.
 * @param context - Current credentials, session and flow state.
 * @returns The remaining steps, or the code to reject with.
 */
export const planEnroll = (method: MfaMethod, context: PlanContext): Plan => {
  const statuses = getMethodStatuses(context.credentials, context.platform);
  if (!statuses[method].canEnroll) {
    return fail(
      isMethodSupported(method, context.platform)
        ? 'email_already_enrolled'
        : 'passkey_unsupported',
    );
  }

  const steps: PlanStep[] = [];
  const error = addConfirmIfNeeded(
    steps,
    startSimulation(statuses, context),
    context,
  );
  if (error) {
    return fail(error);
  }
  steps.push({
    kind: 'setup',
    method,
    prefillEmail: statuses[method].pendingIdentifier,
  });
  return { ok: true, steps };
};
