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
};

type InPageProbe = {
  start: number | null;
  end: number | null;
  startEvent: string | null;
  preexisting: boolean;
  extraInputs: number;
  timedOut: boolean;
  matches: () => boolean;
  stop: () => void;
};

type ProbeHost = {
  // A page global the harness owns, named apart from the app's own.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __benchSteps?: Record<string, InPageProbe>;
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
        return;
      }
      probe.start = performance.now();
      probe.startEvent = event.type;
      if (config.holdMs > 0) {
        // The known answer. Nothing else runs on this thread meanwhile, so
        // the DOM the check below reads is still the DOM at the trigger.
        const holdStart = performance.now();
        while (performance.now() - holdStart < config.holdMs) {
          // Hold the main thread.
        }
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

  // Capture on `document`, so the start is read and the hold runs before
  // handlers on its elements.
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
  };
}

/**
 * Turn a reading into the step's in-page timer, reported as `<stepId>`, or into
 * nothing with the reason logged: absent, never zero.
 */
export function inPageTimerResult(
  stepId: string,
  reading: InPageProbeReading | null,
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
   * call that triggers the step makes other inputs first.
   */
  startWithin?: string;
  /**
   * Start on the first typed character rather than on any input, so the clear
   * chord `driver.fill` sends first, and the 200 ms it then waits, stay out.
   */
  typedOnly?: boolean;
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
 * into its timer. Never waits for the destination and never throws.
 */
export async function finishInPageStep(
  driver: Driver,
  stepId: string,
): Promise<TimerResult[]> {
  try {
    const reading = (await driver.executeScript(
      readInPageStepProbe,
      stepId,
    )) as InPageProbeReading | null;
    return inPageTimerResult(stepId, reading);
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
 * Time a step inside the page around its existing timed wait, `settle`.
 */
export async function measureStepInPage(
  driver: Driver,
  stepId: string,
  {
    trigger,
    settle,
    ...options
  }: InPageStepOptions & {
    trigger: () => Promise<void>;
    settle: () => Promise<void>;
  },
): Promise<TimerResult[]> {
  const installed = await startInPageStep(driver, stepId, options);
  await trigger();
  await settle();
  return installed ? await finishInPageStep(driver, stepId) : [];
}

/**
 * Destination key elements, as CSS. Each mirrors the CSS part of the
 * page-object method named beside it; text-only locators in those methods
 * have no CSS form and are not represented.
 */
export const IN_PAGE_DESTINATIONS = {
  /** `SwapPage.checkPageIsLoaded`. */
  swapPage: [
    '[data-testid="from-amount"]',
    '[data-testid="bridge-destination-button"]',
    '[data-testid="parent-selector-bridge-quote"]',
  ],
  /** The asset picker's search input, which `BridgeQuotePage` waits on. */
  bridgeAssetPicker: ['[data-testid="bridge-asset-picker-search-input"]'],
} as const satisfies Record<string, readonly string[]>;
