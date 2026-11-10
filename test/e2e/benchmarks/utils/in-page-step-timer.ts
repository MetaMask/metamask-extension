import type { CompletedRequest, Mockttp } from 'mockttp';
import type { Driver } from '../../webdriver/driver';
import { getKnownAnswerDelayMs } from '../mocks/known-answer';
import type { TimerResult } from './types';

/**
 * Times a step inside the page, from the trusted input that triggers it to the
 * first `MutationObserver` callback in which all its end selectors match, on
 * `performance.now()`. The end is when the change's script finished, not paint.
 */

/** How long after its trigger a probe keeps observing for the destination. */
export const IN_PAGE_BOUND_MS = 60_000;

/**
 * The known-answer hold, in ms: how long the probe holds the page's main
 * thread at the trigger of a step named in
 * {@link KNOWN_ANSWER_INPAGE_STEP}. Unset, empty or 0 holds nothing.
 */
export const KNOWN_ANSWER_INPAGE_MS = 'BENCHMARK_KNOWN_ANSWER_INPAGE_MS';

/**
 * The steps the known-answer hold applies to: a step id, or a comma-separated
 * list of them. A step id is the in-page timer's own name, with no suffix. A
 * step id that more than one flow uses is held in each of them.
 */
export const KNOWN_ANSWER_INPAGE_STEP = 'BENCHMARK_KNOWN_ANSWER_INPAGE_STEP';

/**
 * Record, for a step that asks for it, when the last character typed before
 * its trigger arrived: see {@link InPageStepOptions.recordTypingBeforeTrigger}.
 * Unset, no probe records it.
 */
export const TYPED_KEY_BEFORE_TRIGGER = 'BENCHMARK_TYPED_KEY_BEFORE_TRIGGER';

/**
 * Record, for a step that asks for it, the first click after its trigger and
 * how long that click waited for its listener: see
 * {@link InPageStepOptions.recordClickLag}. Unset, no probe records it.
 */
export const CLICK_LAG_AFTER_TRIGGER = 'BENCHMARK_CLICK_LAG_AFTER_TRIGGER';

/**
 * Thrown by a step's `readBeforeTrigger` to fail the iteration, so a failed
 * wait never leaves the trigger to run in the state the wait rules out. Any
 * other error it throws is reported on the readings line and the step goes on.
 */
export class FailIterationError extends Error {}

/**
 * Read the known-answer hold for `stepId`: 0 unless the hold is set and names
 * it. A set hold naming no step, or a step with an `InPage` or `Legacy` suffix
 * (no step id has one), throws, so a run meant to be held never runs unheld.
 */
export function getInPageKnownAnswerMs(stepId: string): number {
  const holdMs = getKnownAnswerDelayMs(KNOWN_ANSWER_INPAGE_MS);
  if (holdMs === 0) {
    return 0;
  }
  const named = (process.env[KNOWN_ANSWER_INPAGE_STEP] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '');
  if (named.length === 0) {
    throw new Error(
      `${KNOWN_ANSWER_INPAGE_MS} is ${holdMs}, but ${KNOWN_ANSWER_INPAGE_STEP} names no step`,
    );
  }
  const suffixed = named.filter((name) => /(?:InPage|Legacy)$/u.test(name));
  if (suffixed.length > 0) {
    throw new Error(
      `${KNOWN_ANSWER_INPAGE_STEP} names steps by step id, without a suffix: ${suffixed.join(', ')}`,
    );
  }
  return named.includes(stepId) ? holdMs : 0;
}

/**
 * The page-side probe's configuration. It crosses `executeScript`, so it must
 * be plain JSON.
 */
export type InPageProbeConfig = {
  stepId: string;
  /** CSS selectors that must all match for the destination to be reached. */
  endSelectors: string[];
  /** When set, only input whose target is inside a match starts the region. */
  startWithin: string | null;
  /** When true, only a keydown that types a character starts the region. */
  typedOnly: boolean;
  /** Stop observing this long after the trigger. */
  boundMs: number;
  /** Hold the main thread this long at the trigger: the known answer. */
  holdMs: number;
  /** Reset the app's long-task metrics at the trigger. */
  resetLongTasks: boolean;
  /** Record the last character typed before the trigger. */
  typedBeforeTrigger: boolean;
  /** Record the first click after the trigger. Absent means false. */
  clickLag?: boolean;
};

/**
 * One reading of a probe, as {@link readInPageStepProbe} returns it.
 */
export type InPageProbeReading = {
  /** `performance.now()` at the triggering input, or null if none arrived. */
  start: number | null;
  /** `performance.now()` in the first observer callback that matched. */
  end: number | null;
  /** The event type that started the region. */
  startEvent: string | null;
  /** The destination already matched when the triggering input arrived. */
  preexisting: boolean;
  /** Trusted inputs after the trigger and before the destination matched. */
  extraInputs: number;
  /** Observing stopped at the bound without the destination matching. */
  timedOut: boolean;
  /** The destination is in the DOM, but no observer callback recorded it. */
  unobserved: boolean;
  /**
   * The triggering event's `event.timeStamp`, on the same clock as `start`.
   * `start` minus this is the input delay: how long the event waited before
   * the listener ran. It is outside the value.
   */
  startTimeStamp: number | null;
  /** Typed characters from the trigger to the destination; 0 if not typed. */
  typedKeys: number;
  /** `performance.now()` at the last of those typed characters. */
  lastTypedAt: number | null;
  /**
   * The `event.timeStamp` of the last character typed after the probe was
   * installed and before the trigger, on the same clock as `start`. Null
   * unless the probe was asked to record it, or when nothing was typed.
   */
  typedBeforeTriggerTimeStamp: number | null;
  /** `performance.now()` in the listener for that character. */
  typedBeforeTriggerAt: number | null;
  /** How long the known-answer hold actually held, in ms; 0 when none. */
  heldMs: number;
  /** The app's long-task metrics were reset at the trigger. */
  longTasksReset: boolean;
  /**
   * The `event.timeStamp` of the first click from the trigger on, on the
   * same clock as `start`. Present only when the probe was asked to record
   * it, and null when no click came.
   */
  clickTimeStamp?: number | null;
  /** `performance.now()` in the listener for that click. */
  clickAt?: number | null;
  /**
   * `Date.now() - performance.now()` when read: add it to `start` or `end`
   * for a wall-clock time comparable with the mock server's request times.
   */
  epochOffset: number;
};

/** A step's reading, as {@link finishInPageStep} hands it to `onReading`. */
export type InPageStepReading = {
  stepId: string;
  reading: InPageProbeReading | null;
};

type InPageProbe = {
  start: number | null;
  end: number | null;
  startEvent: string | null;
  preexisting: boolean;
  extraInputs: number;
  timedOut: boolean;
  startTimeStamp: number | null;
  typedKeys: number;
  lastTypedAt: number | null;
  typedBeforeTriggerTimeStamp: number | null;
  typedBeforeTriggerAt: number | null;
  heldMs: number;
  longTasksReset: boolean;
  clickLag: boolean;
  clickTimeStamp: number | null;
  clickAt: number | null;
  matches: () => boolean;
  stop: () => void;
};

type ProbeHost = {
  // A page global the harness owns, named apart from the app's own.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __benchSteps?: Record<string, InPageProbe>;
  stateHooks?: { resetLongTaskMetrics?: () => void };
};

/**
 * Install a probe for one step. Runs in the page, serialized, so it may use
 * only its own body, `document` and the globals exempt from scuttling in
 * `development/webpack/utils/plugins/LavamoatPlugin/index.ts`.
 */
export function installInPageStepProbe([config]: [InPageProbeConfig]):
  | string
  | null {
  // A tuple because `Driver.executeScript` passes its arguments as one array.
  const host = window as unknown as ProbeHost;
  const probes = host.__benchSteps ?? {};
  host.__benchSteps = probes;
  probes[config.stepId]?.stop();
  delete probes[config.stepId];

  try {
    for (const selector of config.endSelectors) {
      document.querySelector(selector);
    }
    if (config.startWithin !== null) {
      document.querySelector(config.startWithin);
    }
  } catch (error) {
    return `invalid selector: ${String(error)}`;
  }

  const inputTypes = ['pointerdown', 'mousedown', 'click', 'keydown'];
  let bound: ReturnType<typeof setTimeout> | undefined;

  const matches = (): boolean =>
    config.endSelectors.every(
      (selector) => document.querySelector(selector) !== null,
    );

  const isTypedCharacter = (event: Event): boolean => {
    // A character key, not a modifier chord: `driver.fill` clears the field
    // with Ctrl/Cmd+A and Backspace before it types.
    const { key, ctrlKey, metaKey, altKey } = event as KeyboardEvent;
    return (
      event.type === 'keydown' &&
      typeof key === 'string' &&
      key.length === 1 &&
      !ctrlKey &&
      !metaKey &&
      !altKey
    );
  };

  const startsRegion = (event: Event): boolean => {
    if (config.startWithin !== null) {
      const { target } = event;
      if (
        !(target instanceof Element) ||
        target.closest(config.startWithin) === null
      ) {
        return false;
      }
    }
    if (config.typedOnly) {
      return isTypedCharacter(event);
    }
    return true;
  };

  const probe: InPageProbe = {
    start: null,
    end: null,
    startEvent: null,
    preexisting: false,
    extraInputs: 0,
    timedOut: false,
    startTimeStamp: null,
    typedKeys: 0,
    lastTypedAt: null,
    typedBeforeTriggerTimeStamp: null,
    typedBeforeTriggerAt: null,
    heldMs: 0,
    longTasksReset: false,
    clickLag: config.clickLag === true,
    clickTimeStamp: null,
    clickAt: null,
    matches,
    stop: () => undefined,
  };

  let observer: MutationObserver;
  try {
    observer = new MutationObserver(() => {
      if (probe.start === null || probe.end !== null || !matches()) {
        return;
      }
      probe.end = performance.now();
      probe.stop();
    });
  } catch (error) {
    // The build in the browser does not list `MutationObserver` among its
    // scuttling exceptions.
    return `MutationObserver unavailable: ${String(error)}`;
  }

  const onInput = (event: Event): void => {
    if (!event.isTrusted) {
      return;
    }
    if (probe.start === null) {
      if (!startsRegion(event)) {
        if (config.typedBeforeTrigger && isTypedCharacter(event)) {
          probe.typedBeforeTriggerAt = performance.now();
          probe.typedBeforeTriggerTimeStamp = event.timeStamp;
        }
        return;
      }
      // Before the start is read, so the reset is not inside the value.
      if (config.resetLongTasks) {
        const hooks = host.stateHooks;
        if (typeof hooks?.resetLongTaskMetrics === 'function') {
          hooks.resetLongTaskMetrics();
          probe.longTasksReset = true;
        }
      }
      probe.start = performance.now();
      probe.startEvent = event.type;
      probe.startTimeStamp = event.timeStamp;
      if (config.clickLag && event.type === 'click') {
        probe.clickAt = probe.start;
        probe.clickTimeStamp = event.timeStamp;
      }
      if (config.typedOnly) {
        probe.typedKeys = 1;
        probe.lastTypedAt = probe.start;
      }
      if (config.holdMs > 0) {
        // The known answer. Nothing else runs on this thread meanwhile, so
        // the DOM the check below reads is still the DOM at the trigger.
        const holdStart = performance.now();
        while (performance.now() - holdStart < config.holdMs) {
          // Hold the main thread.
        }
        probe.heldMs = performance.now() - holdStart;
      }
      if (matches()) {
        probe.preexisting = true;
        probe.stop();
        return;
      }
      observer.observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
      });
      bound = setTimeout(() => {
        probe.timedOut = true;
        probe.stop();
      }, config.boundMs);
      return;
    }
    if (config.clickLag && event.type === 'click' && probe.clickAt === null) {
      probe.clickAt = performance.now();
      probe.clickTimeStamp = event.timeStamp;
    }
    if (config.typedOnly && probe.end === null && startsRegion(event)) {
      probe.typedKeys += 1;
      probe.lastTypedAt = performance.now();
    }
    // One gesture is one pointerdown or one keydown; the mousedown and click
    // that follow a pointerdown belong to it. Typing continues the trigger
    // when the trigger is typed. Input after the destination matched belongs
    // to the next step.
    const anotherGesture =
      event.type === 'pointerdown' ||
      (event.type === 'keydown' && !config.typedOnly);
    if (anotherGesture && probe.end === null) {
      probe.extraInputs += 1;
    }
  };

  probe.stop = () => {
    observer.disconnect();
    if (bound !== undefined) {
      clearTimeout(bound);
      bound = undefined;
    }
    for (const type of inputTypes) {
      document.removeEventListener(type, onInput, true);
    }
  };

  // Capture on `document`: the reset and hold precede handlers on its elements.
  for (const type of inputTypes) {
    document.addEventListener(type, onInput, true);
  }
  probes[config.stepId] = probe;
  return null;
}

/**
 * Read a step's probe and remove it; null when this document has none. Runs in
 * the page, in its own task, after observer callbacks for all earlier changes,
 * so a destination that matches with no recorded end is flagged `unobserved`.
 */
export function readInPageStepProbe([stepId]: [
  string,
]): InPageProbeReading | null {
  const host = window as unknown as ProbeHost;
  const probe = host.__benchSteps?.[stepId];
  if (!probe) {
    return null;
  }
  probe.stop();
  delete host.__benchSteps?.[stepId];
  return {
    start: probe.start,
    end: probe.end,
    startEvent: probe.startEvent,
    preexisting: probe.preexisting,
    extraInputs: probe.extraInputs,
    timedOut: probe.timedOut,
    unobserved:
      probe.start !== null &&
      probe.end === null &&
      !probe.preexisting &&
      probe.matches(),
    startTimeStamp: probe.startTimeStamp,
    typedKeys: probe.typedKeys,
    lastTypedAt: probe.lastTypedAt,
    typedBeforeTriggerTimeStamp: probe.typedBeforeTriggerTimeStamp,
    typedBeforeTriggerAt: probe.typedBeforeTriggerAt,
    heldMs: probe.heldMs,
    longTasksReset: probe.longTasksReset,
    ...(probe.clickLag
      ? { clickTimeStamp: probe.clickTimeStamp, clickAt: probe.clickAt }
      : {}),
    epochOffset: Date.now() - performance.now(),
  };
}

/**
 * Describe the readings recorded beside a value as one `; `-separated line,
 * ending with `harnessReadings` as given. `reading` must have a start.
 */
function describeReadings(
  reading: InPageProbeReading,
  harnessReadings: readonly string[],
): string {
  const parts: string[] = [];
  const start = reading.start ?? 0;
  // The trigger's own time, where its event.timeStamp is on the listener's
  // clock; otherwise the listener's.
  let triggerAt: { time: number; name: string } = {
    time: start,
    name: 'listener',
  };
  if (reading.startTimeStamp !== null && reading.startTimeStamp > 0) {
    const delay = start - reading.startTimeStamp;
    if (delay >= 0 && delay <= IN_PAGE_BOUND_MS) {
      triggerAt = { time: reading.startTimeStamp, name: 'event.timeStamp' };
      parts.push(
        `input delay ${delay.toFixed(1)} ms (event.timeStamp to listener)`,
      );
    } else {
      parts.push(
        `event.timeStamp ${reading.startTimeStamp.toFixed(1)} is not on the listener's clock (${start.toFixed(1)})`,
      );
    }
  } else {
    parts.push('no event.timeStamp');
  }
  if (reading.clickAt !== undefined) {
    if (
      reading.clickAt === null ||
      reading.clickTimeStamp === null ||
      reading.clickTimeStamp === undefined
    ) {
      parts.push('no click from the trigger on');
    } else {
      parts.push(
        `click lag ${(reading.clickAt - reading.clickTimeStamp).toFixed(
          1,
        )} ms (event.timeStamp to listener), the click's event.timeStamp at +${(
          reading.clickTimeStamp - triggerAt.time
        ).toFixed(1)} ms from the trigger's ${triggerAt.name}`,
      );
    }
  }
  if (reading.typedKeys > 0 && reading.lastTypedAt !== null) {
    parts.push(
      `${reading.typedKeys} typed key(s), the last at +${(
        reading.lastTypedAt - start
      ).toFixed(1)} ms`,
    );
  }
  if (
    reading.typedBeforeTriggerTimeStamp !== null &&
    reading.typedBeforeTriggerAt !== null
  ) {
    const fromTrigger = (time: number): string => {
      const ms = time - triggerAt.time;
      return `${ms < 0 ? '' : '+'}${ms.toFixed(1)}`;
    };
    parts.push(
      `last key typed before the trigger at ${fromTrigger(
        reading.typedBeforeTriggerTimeStamp,
      )} ms, its listener at ${fromTrigger(
        reading.typedBeforeTriggerAt,
      )} ms (from the trigger's ${triggerAt.name})`,
    );
  }
  if (reading.heldMs > 0) {
    parts.push(`known-answer hold ${reading.heldMs.toFixed(1)} ms`);
  }
  if (reading.longTasksReset) {
    parts.push('long-task window opened at the trigger');
  }
  parts.push(...harnessReadings);
  return parts.join('; ');
}

/**
 * Turn a reading into the step's in-page timer, reported as `<stepId>`, or into
 * nothing with the reason logged: absent, never zero.
 */
export function inPageTimerResult(
  stepId: string,
  reading: InPageProbeReading | null,
  harnessReadings: readonly string[] = [],
): TimerResult[] {
  const absent = (reason: string): TimerResult[] => {
    console.log(`[benchmark] ${stepId} absent: ${reason}`);
    return [];
  };

  if (reading === null) {
    return absent(
      'no probe in this document; it was not installed, or the page was replaced',
    );
  }
  if (reading.start === null) {
    return absent(
      'no trusted input reached the trigger after the probe was installed',
    );
  }
  if (reading.preexisting) {
    return absent(
      'the destination was already in the DOM when the trigger fired',
    );
  }
  if (reading.extraInputs > 0) {
    return absent(
      `${reading.extraInputs} further trusted input(s) arrived between the trigger and the destination, so the region contains harness time`,
    );
  }
  if (reading.end === null) {
    if (reading.timedOut) {
      return absent('the destination did not appear within the bound');
    }
    return absent(
      reading.unobserved
        ? 'the destination is in the DOM, but no observed DOM change put it there'
        : 'the destination did not appear after the trigger',
    );
  }

  const value = reading.end - reading.start;
  console.log(
    `[benchmark] ${stepId}: ${value.toFixed(1)} ms from ${reading.startEvent}`,
  );
  console.log(
    `[benchmark] ${stepId} readings: ${describeReadings(
      reading,
      harnessReadings,
    )}`,
  );
  // The unit keeps this out of `runner.ts`'s per-run `total`, which sums only
  // untagged timers: it overlaps `<stepId>Legacy`, so it would double-count.
  return [{ id: stepId, value, unit: 'ms' }];
}

export type InPageStepOptions = {
  /**
   * The destination's key element: CSS selectors that must all be in the DOM.
   * Each must be absent when the trigger fires.
   */
  endSelector: string | readonly string[];
  /**
   * Restrict the trigger to input on this element or inside it. Needed when the
   * call that triggers the step makes other inputs first: typing a password
   * before clicking Unlock, or picking tokens before entering an amount.
   */
  startWithin?: string;
  /**
   * Start on the first typed character rather than on any input, so the clear
   * chord `driver.fill` sends first, and the 200 ms it then waits, stay out.
   */
  typedOnly?: boolean;
  /**
   * Reset the app's long-task metrics at the trigger, where the value starts.
   * Pair with `measureStepWithLongTasks`'s `windowOpenedAtTrigger`, so the
   * step's long-task timer does not reset them again.
   */
  resetLongTasksAtStart?: boolean;
  /**
   * With `BENCHMARK_TYPED_KEY_BEFORE_TRIGGER=1`, record when the last character
   * typed before the trigger arrived, for a step whose triggering call types
   * first. It does not change the value.
   */
  recordTypingBeforeTrigger?: boolean;
  /**
   * With `BENCHMARK_CLICK_LAG_AFTER_TRIGGER=1`, record the first click from the
   * trigger on: a task between a triggering pointerdown and its click shows as
   * that click's lag, unseen by the input delay. It does not change the value.
   */
  recordClickLag?: boolean;
};

/**
 * Install a probe before a step's trigger runs; returns whether it installed.
 * A failure is logged, never thrown, so the existing timer is unaffected; only
 * a misconfigured known-answer hold throws.
 */
export async function startInPageStep(
  driver: Driver,
  stepId: string,
  options: InPageStepOptions,
): Promise<boolean> {
  const config: InPageProbeConfig = {
    stepId,
    endSelectors: ([] as string[]).concat(options.endSelector),
    startWithin: options.startWithin ?? null,
    typedOnly: options.typedOnly ?? false,
    boundMs: IN_PAGE_BOUND_MS,
    holdMs: getInPageKnownAnswerMs(stepId),
    resetLongTasks: options.resetLongTasksAtStart ?? false,
    typedBeforeTrigger:
      (options.recordTypingBeforeTrigger ?? false) &&
      process.env[TYPED_KEY_BEFORE_TRIGGER] === '1',
    // Left out unless on, so the probe a run without it installs is
    // unchanged.
    ...((options.recordClickLag ?? false) &&
    process.env[CLICK_LAG_AFTER_TRIGGER] === '1'
      ? { clickLag: true }
      : {}),
  };
  if (config.holdMs > 0) {
    console.log(
      `[benchmark] ${stepId}: known-answer hold of ${config.holdMs} ms at the trigger`,
    );
  }
  try {
    const failure = (await driver.executeScript(
      installInPageStepProbe,
      config,
    )) as string | null;
    if (failure !== null) {
      console.log(`[benchmark] ${stepId} not installed: ${failure}`);
      return false;
    }
    return true;
  } catch (error) {
    console.log(
      `[benchmark] ${stepId} not installed: ${(error as Error).message}`,
    );
    return false;
  }
}

/**
 * Read a step's probe once, after its existing wait has returned, and turn it
 * into its timer. Never waits for the destination and never throws; `onReading`
 * is not called when the probe could not be read.
 */
export async function finishInPageStep(
  driver: Driver,
  stepId: string,
  onReading?: (stepReading: InPageStepReading) => void,
  harnessReadings: readonly string[] = [],
): Promise<TimerResult[]> {
  try {
    const reading = (await driver.executeScript(
      readInPageStepProbe,
      stepId,
    )) as InPageProbeReading | null;
    onReading?.({ stepId, reading });
    return inPageTimerResult(stepId, reading, harnessReadings);
  } catch (error) {
    console.log(
      `[benchmark] ${stepId} absent: the probe could not be read: ${
        (error as Error).message
      }`,
    );
    return [];
  }
}

/**
 * Time a step inside the page around its existing timed wait, `settle`. What
 * `readBeforeTrigger` returns, or the error it throws unless that is a
 * {@link FailIterationError}, goes on the step's readings line.
 */
export async function measureStepInPage(
  driver: Driver,
  stepId: string,
  {
    trigger,
    settle,
    onReading,
    readBeforeTrigger,
    ...options
  }: InPageStepOptions & {
    trigger: () => Promise<void>;
    settle: (probe: { installed: boolean }) => Promise<void>;
    onReading?: (stepReading: InPageStepReading) => void;
    readBeforeTrigger?: () => Promise<readonly string[]>;
  },
): Promise<TimerResult[]> {
  const installed = await startInPageStep(driver, stepId, options);
  let harnessReadings: readonly string[] = [];
  if (readBeforeTrigger) {
    try {
      harnessReadings = await readBeforeTrigger();
    } catch (error) {
      if (error instanceof FailIterationError) {
        throw error;
      }
      harnessReadings = [
        `the read before the trigger failed: ${(error as Error).message}`,
      ];
    }
  }
  await trigger();
  // Told `installed`, so a step with `resetLongTasksAtStart` can reset the
  // long-task metrics itself when the probe did not install.
  await settle({ installed });
  return installed
    ? await finishInPageStep(driver, stepId, onReading, harnessReadings)
    : [];
}

/** The parts of a request the mock server saw that the request log reads. */
export type SeenRequest = Pick<
  CompletedRequest,
  'method' | 'url' | 'timingEvents'
>;

/** How long the request log waits for each mock rule's record of requests. */
export const SEEN_REQUESTS_TIMEOUT_MS = 5_000;

/** The most request groups listed for one step. */
const MAX_REQUEST_GROUPS = 40;

/**
 * When the mock server received a request and finished answering it, in
 * wall-clock ms. `startTime` is `Date.now()` at receipt; the other timing
 * events are on a monotonic clock whose origin `startTimestamp` gives.
 */
function requestTimes(request: SeenRequest): {
  received: number;
  answered: number | null;
} {
  const { startTime, startTimestamp, responseSentTimestamp, abortedTimestamp } =
    request.timingEvents;
  const doneAt = responseSentTimestamp ?? abortedTimestamp;
  return {
    received: startTime,
    answered: doneAt === undefined ? null : startTime + doneAt - startTimestamp,
  };
}

function requestGroupKey(request: SeenRequest): string {
  try {
    const { host, pathname } = new URL(request.url);
    return `${request.method} ${host}${pathname}`;
  } catch {
    return `${request.method} ${request.url}`;
  }
}

const signedMs = (ms: number): string =>
  `${ms < 0 ? '-' : '+'}${Math.abs(ms).toFixed(0)}`;

const msRange = (min: number, max: number): string =>
  min === max ? signedMs(min) : `${signedMs(min)}..${signedMs(max)}`;

/**
 * List the requests the mock server was handling during a step's in-page
 * interval, grouped by method, host and path, in ms from the trigger. The
 * interval is put on the wall clock, so times have millisecond resolution.
 */
export function describeRequestsWithinInPageStep(
  { stepId, reading }: InPageStepReading,
  requests: SeenRequest[],
): string {
  if (reading === null || reading.start === null || reading.end === null) {
    return `[benchmark] ${stepId} requests: not listed, the interval has no end`;
  }
  const start = reading.start + reading.epochOffset;
  const end = reading.end + reading.epochOffset;

  type Group = {
    key: string;
    count: number;
    unanswered: number;
    received: [number, number];
    answered: [number, number] | null;
  };
  const groups = new Map<string, Group>();
  let total = 0;
  for (const request of requests) {
    const { received, answered } = requestTimes(request);
    const overlaps =
      received <= end &&
      (answered === null ? received >= start : answered >= start);
    if (!overlaps) {
      continue;
    }
    total += 1;
    const key = requestGroupKey(request);
    const group = groups.get(key) ?? {
      key,
      count: 0,
      unanswered: 0,
      received: [Infinity, -Infinity],
      answered: null,
    };
    group.count += 1;
    group.received = [
      Math.min(group.received[0], received - start),
      Math.max(group.received[1], received - start),
    ];
    if (answered === null) {
      group.unanswered += 1;
    } else {
      group.answered = [
        Math.min(group.answered?.[0] ?? Infinity, answered - start),
        Math.max(group.answered?.[1] ?? -Infinity, answered - start),
      ];
    }
    groups.set(key, group);
  }

  const sorted = [...groups.values()].sort(
    (a, b) => a.received[0] - b.received[0] || a.key.localeCompare(b.key),
  );
  const lines = [
    `[benchmark] ${stepId} requests: ${total} at the mock server overlapped the ${(
      end - start
    ).toFixed(1)} ms interval (ms from the trigger)`,
    ...sorted.slice(0, MAX_REQUEST_GROUPS).map((group) => {
      const answered = group.answered
        ? `, answered ${msRange(...group.answered)}`
        : '';
      const unanswered =
        group.unanswered > 0 ? `, ${group.unanswered} without an answer` : '';
      return `  ${group.key} x${group.count}: received ${msRange(
        ...group.received,
      )}${answered}${unanswered}`;
    }),
  ];
  if (sorted.length > MAX_REQUEST_GROUPS) {
    lines.push(`  ... ${sorted.length - MAX_REQUEST_GROUPS} more group(s)`);
  }
  return lines.join('\n');
}

/**
 * Log the requests each step overlapped at the mock server. Call it once per
 * iteration, after the last measured step: reading the record waits for
 * in-flight requests, and that wait must not land inside or between steps.
 */
export async function logRequestsWithinInPageSteps(
  mockServer: Pick<Mockttp, 'getMockedEndpoints'>,
  steps: InPageStepReading[],
  timeoutMs: number = SEEN_REQUESTS_TIMEOUT_MS,
): Promise<void> {
  if (steps.length === 0) {
    return;
  }
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const endpoints = await mockServer.getMockedEndpoints();
    const timedOut = new Promise<null>((resolve) => {
      deadline = setTimeout(() => resolve(null), timeoutMs);
    });
    const seen = await Promise.all(
      endpoints.map((endpoint) =>
        Promise.race([endpoint.getSeenRequests().catch(() => null), timedOut]),
      ),
    );
    const unread = seen.filter((requests) => requests === null).length;
    if (unread > 0) {
      console.log(
        `[benchmark] request log: ${unread} of ${endpoints.length} mock rules failed or gave no record within ${timeoutMs} ms; their requests are not listed`,
      );
    }
    const requests = seen.flatMap((ruleRequests) => ruleRequests ?? []);
    for (const step of steps) {
      console.log(describeRequestsWithinInPageStep(step, requests));
    }
  } catch (error) {
    console.log(
      `[benchmark] request log unavailable: ${(error as Error).message}`,
    );
  } finally {
    clearTimeout(deadline);
  }
}

/**
 * Destination key elements, as CSS. Each mirrors the CSS part of the
 * page-object method named beside it; text-only locators in those methods
 * have no CSS form and are not represented.
 */
export const IN_PAGE_DESTINATIONS = {
  /** `HomePage.checkPageIsLoaded`. */
  home: ['[data-testid="parent-selector-home"]'],
  /**
   * `HomePage.checkPageIsLoaded` plus `TokensTab.checkTokenListIsDisplayed`.
   */
  homeWithTokenList: [
    '[data-testid="parent-selector-home"]',
    '[data-testid="multichain-token-list-button"]',
  ],
  /**
   * `AccountListPage.checkPageIsLoaded`, without its sync wait: that wait
   * holds the add-wallet button out of its syncing label for 2 s, a harness
   * stability window rather than an element.
   */
  accountList: [
    '[data-testid="parent-selector-account-list-page"]',
    '[data-testid="add-multichain-account-button"]',
    '[data-testid="multichain-account-list-search"]',
  ],
  /** `SendPage.checkNetworkFilterToggleIsDisplayed`. */
  sendNetworkFilter: ['[data-testid="send-network-filter-toggle"]'],
  /** `SendPage.checkSendFormIsLoaded`. */
  sendForm: [
    '[data-testid="send-amount-input"]',
    '[data-testid="recipient-address-input"]',
  ],
  /** `SnapTransactionConfirmation.checkPageIsLoaded`. */
  snapConfirmation: [
    '[data-testid="parent-selector-snap-confirmation-page"]',
    '[data-testid="confirm-sign-and-send-transaction-cancel-snap-footer-button"]',
    '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]',
  ],
  /** `SwapPage.checkPageIsLoaded`. */
  swapPage: [
    '[data-testid="from-amount"]',
    '[data-testid="bridge-destination-button"]',
    '[data-testid="parent-selector-bridge-quote"]',
  ],
  /** `SwapPage.checkQuoteIsDisplayed`. */
  swapQuote: [
    '[data-testid="network-fees"]',
    '[data-testid="slippage-edit-button"]',
    '[data-testid="minimum-received"]',
  ],
  /** The asset picker's search input, which `BridgeQuotePage` waits on. */
  bridgeAssetPicker: ['[data-testid="bridge-asset-picker-search-input"]'],
  /** `StartOnboardingPage.checkUserSrpButtonIsVisible`. */
  onboardingImportOptions: [
    '[data-testid="onboarding-import-with-srp-button"]',
  ],
  /** `StartOnboardingPage.checkSocialSignUpFormIsVisible`. */
  onboardingCreateOptions: [
    '[data-testid="onboarding-create-with-google-button"]',
  ],
  /** `OnboardingSrpPage.checkPageIsLoaded`, Continue disabled as it waits. */
  onboardingSrp: [
    '[data-testid="parent-selector-onboarding-srp"]',
    '[data-testid="srp-input-import__srp-note"]',
    '[data-testid="import-srp-confirm"]:disabled',
  ],
  /** `OnboardingPasswordPage.checkPageIsLoaded`. */
  onboardingPassword: [
    '[data-testid="parent-selector-onboarding-password"]',
    '[data-testid="create-password-new-input"]',
    '[data-testid="create-password-confirm-input"]',
  ],
  /** `SetupPasskeyPage.checkPageIsLoaded`. */
  setupPasskey: [
    '[data-testid="parent-selector-setup-passkey"]',
    '[data-testid="passkey-maybe-later-button"]',
    '[data-testid="passkey-set-up-button"]',
  ],
  /** `SecureWalletPage.checkPageIsLoaded`. */
  onboardingSecureWallet: [
    '[data-testid="parent-selector-secure-wallet"]',
    '[data-testid="recovery-phrase-remind-later"]',
  ],
  /** `OnboardingMetricsPage.checkPageIsLoaded`. */
  onboardingMetrics: [
    '[data-testid="parent-selector-onboarding-metrics"]',
    '[data-testid="metametrics-i-agree"]',
  ],
  /** `OnboardingCompletePage.checkPageIsLoaded`. */
  onboardingComplete: [
    '[data-testid="parent-selector-onboarding-complete"]',
    '[data-testid="manage-default-settings"]',
    '[data-testid="onboarding-complete-done"]',
  ],
} as const satisfies Record<string, readonly string[]>;

/**
 * `TokensTab.checkPriceChartIsShown` plus `checkPriceChartLoaded`, scoped to
 * the asset page: unscoped, the home token list would match before the click.
 * @param assetAddress - The address `checkPriceChartLoaded` is given.
 */
export function assetPriceChartDestination(assetAddress: string): string[] {
  return [
    '[data-testid="asset-price-chart"]',
    `[data-testid="parent-selector-asset-details"] [data-testid="token-increase-decrease-percentage-${assetAddress}"]`,
  ];
}
