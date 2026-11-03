import { v4 as uuidv4 } from 'uuid';
import {
  getBaseProperties,
  getErrorProperties,
  getFlowEndProperties,
  getStepProperties,
  getStepViewedProperties,
  MFA_EVENTS,
  type MfaErrorCta,
  type MfaEvent,
  type MfaEventProperties,
} from './analytics';
import { MfaFlowError } from './errors';
import { createMfaFlow } from './flow';
import type {
  MfaFlow,
  MfaFlowErrorCode,
  MfaFlowOptions,
  MfaFlowResult,
} from './types';

let activeFlow: MfaFlow | undefined;
let activeKey: string | undefined;
let activeTrack:
  | ((event: MfaEvent, properties: MfaEventProperties) => void)
  | undefined;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

const getKey = ({ reason, request }: MfaFlowOptions) =>
  JSON.stringify([reason.operation, request]);

/**
 * Starts an MFA flow, or joins the pending one when it is the same request
 * for the same `reason.operation`. Only one flow runs at a time.
 *
 * @param options - The flow to start.
 * @returns The flow's result.
 */
export const startMfaFlow = (
  options: MfaFlowOptions,
): Promise<MfaFlowResult> => {
  if (activeFlow) {
    return activeKey === getKey(options)
      ? activeFlow.result
      : Promise.reject(new MfaFlowError('flow_in_progress'));
  }

  const flow = createMfaFlow(options);
  activeFlow = flow;
  activeKey = getKey(options);

  // A random ID groups the flow's events, such as an error and how the flow
  // ended.
  const baseProperties = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment property
    flow_id: uuidv4(),
    ...getBaseProperties(options.reason, options.request),
  };
  const track = (event: MfaEvent, properties: MfaEventProperties) => {
    try {
      options.trackEvent?.(event, { ...baseProperties, ...properties });
    } catch {
      // Analytics never changes the flow's outcome.
    }
  };
  activeTrack = track;
  track(MFA_EVENTS.flowStatusUpdated, { status: 'started' });

  // A new screen is a change of step, purpose or method. A new code sent
  // because the last one expired keeps the screen and sets `codeResent`.
  let viewedStep = '';
  let isCodeResent = false;
  const unsubscribe = flow.subscribe(() => {
    const { step, codeResent } = flow.getState();
    const stepKey = JSON.stringify(getStepProperties(step));
    if (step.name !== 'idle' && stepKey !== viewedStep) {
      viewedStep = stepKey;
      track(MFA_EVENTS.stepViewed, getStepViewedProperties(step));
    }
    if (codeResent && !isCodeResent && step.name === 'otp') {
      track(MFA_EVENTS.codeResent, { trigger: 'auto', purpose: step.purpose });
    }
    isCodeResent = Boolean(codeResent);
  });

  const finish = (endProperties: MfaEventProperties) => {
    unsubscribe();
    track(MFA_EVENTS.flowStatusUpdated, endProperties);
    if (activeFlow === flow) {
      activeFlow = undefined;
      activeKey = undefined;
      activeTrack = undefined;
      notify();
    }
  };
  flow.result.then(
    () => finish({ status: 'completed' }),
    (error) => finish(getFlowEndProperties(error, flow.getState())),
  );
  notify();
  // `start` never rejects: failures settle `flow.result`, returned below.
  flow.start().catch(() => undefined);
  return flow.result;
};

export const getActiveMfaFlow = (): MfaFlow | undefined => activeFlow;

export const subscribeToActiveMfaFlow = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Sends an event about the running flow from its screens, with the flow's
 * base properties. Does nothing when no flow runs.
 *
 * @param event - The event.
 * @param properties - Its own properties.
 */
export const trackMfaEvent = (
  event: MfaEvent,
  properties: MfaEventProperties = {},
) => activeTrack?.(event, properties);

/**
 * Sends `MFA Error Viewed` for an error the running flow shows on its
 * current screen.
 *
 * @param code - The error shown.
 */
export const trackMfaErrorViewed = (code: MfaFlowErrorCode) => {
  const step = activeFlow?.getState().step;
  trackMfaEvent(MFA_EVENTS.errorViewed, {
    ...getErrorProperties(code),
    ...(step ? getStepProperties(step) : {}),
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment property
    ...(step?.name === 'failure' ? { can_retry: step.canRetry } : {}),
  });
};

export const trackMfaErrorCta = (code: MfaFlowErrorCode, cta: MfaErrorCta) =>
  trackMfaEvent(MFA_EVENTS.errorCtaClicked, {
    ...getErrorProperties(code),
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Segment property
    cta_type: cta,
  });
