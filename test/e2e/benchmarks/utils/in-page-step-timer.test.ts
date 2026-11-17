import type { Driver } from '../../webdriver/driver';
import {
  IN_PAGE_DESTINATIONS,
  KNOWN_ANSWER_INPAGE_MS,
  KNOWN_ANSWER_INPAGE_STEP,
  finishInPageStep,
  getInPageKnownAnswerMs,
  inPageTimerResult,
  installInPageStepProbe,
  measureStepInPage,
  readInPageStepProbe,
  startInPageStep,
  type InPageProbeConfig,
} from './in-page-step-timer';

type ProbeHost = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __benchSteps?: Record<string, unknown>;
};
type InputInit = Partial<
  Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>
>;

let now: number;
let inputHandler: ((event: Event) => void) | undefined;

/**
 * Capture the probe's input listener as it is registered, so a test can hand
 * it the trusted events that only a real browser can produce.
 */
function captureInputHandler(): void {
  const addEventListener = jest.spyOn(document, 'addEventListener');
  addEventListener.mockImplementation(function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === 'pointerdown') {
      inputHandler = listener as (event: Event) => void;
    }
    EventTarget.prototype.addEventListener.call(this, type, listener, options);
  });
}

function trustedInput(
  type: string,
  target: Element,
  init: InputInit & { timeStamp?: number } = {},
): void {
  if (!inputHandler) {
    throw new Error('No probe listener was captured');
  }
  inputHandler({
    isTrusted: true,
    type,
    target,
    timeStamp: now,
    ...init,
  } as unknown as Event);
}

function install(config: Partial<InPageProbeConfig> = {}): string | null {
  captureInputHandler();
  return installInPageStepProbe([
    {
      stepId: 'step',
      endSelectors: ['#destination'],
      startWithin: null,
      typedOnly: false,
      boundMs: 60_000,
      holdMs: 0,
      ...config,
    },
  ]);
}

function addElement(id: string): void {
  const added = document.createElement('div');
  added.id = id;
  document.body.appendChild(added);
}

/**
 * Let pending `MutationObserver` callbacks run, as the browser does at the
 * next microtask checkpoint.
 */
async function deliverMutations(): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

const element = (selector: string): Element => {
  const found = document.querySelector(selector);
  if (!found) {
    throw new Error(`No element matches ${selector}`);
  }
  return found;
};

describe('in-page-step-timer', () => {
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['performance', 'nextTick', 'queueMicrotask'],
    });
    document.body.innerHTML =
      '<button id="go"><span id="label">Go</span></button><input id="field" /><input id="box" type="checkbox" />';
    now = 1000;
    inputHandler = undefined;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    const host = window as unknown as ProbeHost;
    for (const stepId of Object.keys(host.__benchSteps ?? {})) {
      readInPageStepProbe([stepId]);
    }
    delete host.__benchSteps;
    delete process.env[KNOWN_ANSWER_INPAGE_MS];
    delete process.env[KNOWN_ANSWER_INPAGE_STEP];
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('installInPageStepProbe and readInPageStepProbe', () => {
    it('times from the triggering input to the first observer callback that finds the destination', async () => {
      expect(install()).toBeNull();
      expect(jest.getTimerCount()).toBe(0);

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      // The rest of the same click is not a second gesture.
      trustedInput('mousedown', element('#go'));
      trustedInput('click', element('#go'));
      // Only the bound is scheduled; nothing polls.
      expect(jest.getTimerCount()).toBe(1);

      now = 1050;
      addElement('unrelated');
      await deliverMutations();
      now = 1100;
      addElement('destination');
      // The callback, not the change, reads the clock.
      now = 1103;
      await deliverMutations();
      expect(jest.getTimerCount()).toBe(0);
      const reading = readInPageStepProbe(['step']);

      expect(reading).toStrictEqual({
        start: 1000,
        end: 1103,
        startEvent: 'pointerdown',
        preexisting: false,
        extraInputs: 0,
        timedOut: false,
        unobserved: false,
      });
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 103, unit: 'ms' },
      ]);
      expect(readInPageStepProbe(['step'])).toBeNull();
    });

    it('does not observe before the triggering input', async () => {
      install();

      now = 900;
      addElement('destination');
      await deliverMutations();
      element('#destination').remove();
      await deliverMutations();
      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1200;
      addElement('destination');
      await deliverMutations();

      expect(readInPageStepProbe(['step'])).toMatchObject({
        start: 1000,
        end: 1200,
      });
    });

    it('ignores input the browser did not mark as trusted', async () => {
      install();

      element('#go').dispatchEvent(new Event('pointerdown', { bubbles: true }));
      element('#go').dispatchEvent(new Event('click', { bubbles: true }));
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(jest.getTimerCount()).toBe(0);
      expect(reading).toMatchObject({ start: null, end: null });
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
    });

    it('starts only on input inside `startWithin` when it is set', async () => {
      install({ startWithin: '#go' });

      now = 900;
      trustedInput('pointerdown', element('#field'));
      trustedInput('keydown', element('#field'), { key: 'p' });
      now = 1000;
      trustedInput('pointerdown', element('#label'));
      now = 1200;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ start: 1000, end: 1200, extraInputs: 0 });
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 200, unit: 'ms' },
      ]);
    });

    it('with `typedOnly`, skips the clear chord and starts on the first typed character', async () => {
      install({ startWithin: '#field', typedOnly: true });
      const field = element('#field');

      now = 500;
      trustedInput('keydown', field, { key: 'Control', ctrlKey: true });
      trustedInput('keydown', field, { key: 'a', ctrlKey: true });
      trustedInput('keydown', field, { key: 'Backspace', ctrlKey: true });
      trustedInput('keydown', field, { key: 'a', metaKey: true });
      trustedInput('pointerdown', field);
      expect(jest.getTimerCount()).toBe(0);
      now = 1000;
      trustedInput('keydown', field, { key: 'Shift', shiftKey: true });
      trustedInput('keydown', field, { key: 'F', shiftKey: true });
      now = 1005;
      trustedInput('keydown', field, { key: 'X', shiftKey: true });
      trustedInput('keydown', field, { key: 'S', shiftKey: true });
      now = 1300;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        start: 1000,
        end: 1300,
        startEvent: 'keydown',
        extraInputs: 0,
      });
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 300, unit: 'ms' },
      ]);
    });

    it('reports nothing when the destination is already present at the trigger', async () => {
      install();
      addElement('destination');

      trustedInput('pointerdown', element('#go'));
      addElement('later');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(jest.getTimerCount()).toBe(0);
      expect(reading).toMatchObject({
        preexisting: true,
        end: null,
        unobserved: false,
      });
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
    });

    it('reports nothing when another gesture arrives before the destination', async () => {
      install();

      trustedInput('pointerdown', element('#go'));
      trustedInput('pointerdown', element('#field'));
      trustedInput('keydown', element('#field'), { key: 'Enter' });
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ extraInputs: 2 });
      expect(reading?.end).not.toBeNull();
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
    });

    it('does not count input after the destination was recorded', async () => {
      install();

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1040;
      addElement('destination');
      await deliverMutations();
      now = 1100;
      trustedInput('pointerdown', element('#field'));
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ extraInputs: 0, end: 1040 });
    });

    it('keeps the first end once the destination is recorded', async () => {
      install();

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1040;
      addElement('destination');
      await deliverMutations();
      element('#destination').remove();
      now = 1300;
      addElement('destination');
      await deliverMutations();

      expect(readInPageStepProbe(['step'])).toMatchObject({ end: 1040 });
    });

    it('waits for every end selector', async () => {
      install({ endSelectors: ['#destination', '#second'] });

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1100;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        start: 1000,
        end: null,
        unobserved: false,
      });
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('ends at the first callback after the last end selector matches', async () => {
      install({ endSelectors: ['#destination', '#second'] });

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      addElement('destination');
      now = 1200;
      await deliverMutations();
      now = 1400;
      addElement('second');
      now = 1401;
      await deliverMutations();

      expect(
        inPageTimerResult('step', readInPageStepProbe(['step'])),
      ).toStrictEqual([{ id: 'step', value: 401, unit: 'ms' }]);
    });

    it('sees an attribute change that makes the destination match', async () => {
      install({ endSelectors: ['#go:disabled'] });

      now = 1000;
      trustedInput('pointerdown', element('#field'));
      now = 1150;
      element('#go').setAttribute('disabled', '');
      await deliverMutations();

      expect(
        inPageTimerResult('step', readInPageStepProbe(['step'])),
      ).toStrictEqual([{ id: 'step', value: 150, unit: 'ms' }]);
    });

    it('reports a destination that matched without a DOM change the observer saw', async () => {
      install({ endSelectors: ['#box:checked'] });

      trustedInput('pointerdown', element('#go'));
      // A property, not an attribute: no mutation record.
      (element('#box') as HTMLInputElement).checked = true;
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ end: null, unobserved: true });
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
    });

    it('stops observing at the bound and reports nothing', async () => {
      install({ boundMs: 500 });

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      jest.advanceTimersByTime(499);
      expect(jest.getTimerCount()).toBe(1);
      jest.advanceTimersByTime(1);
      expect(jest.getTimerCount()).toBe(0);

      now = 1600;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ timedOut: true, end: null });
      expect(inPageTimerResult('step', reading)).toStrictEqual([]);
    });

    it('stops observing when read before the destination appears', async () => {
      install();

      trustedInput('pointerdown', element('#go'));
      expect(readInPageStepProbe(['step'])).toMatchObject({ end: null });
      expect(jest.getTimerCount()).toBe(0);
      addElement('destination');
      await deliverMutations();

      expect(readInPageStepProbe(['step'])).toBeNull();
    });

    it('rejects an invalid selector and installs nothing', () => {
      const failure = install({ endSelectors: ['[[['] });

      expect(failure).toMatch(/^invalid selector: /u);
      expect(readInPageStepProbe(['step'])).toBeNull();
    });

    it('installs nothing when `MutationObserver` is scuttled', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        window,
        'MutationObserver',
      );
      Object.defineProperty(window, 'MutationObserver', {
        configurable: true,
        get: () => {
          throw new Error('scuttled');
        },
      });
      try {
        expect(install()).toBe('MutationObserver unavailable: Error: scuttled');
      } finally {
        Object.defineProperty(
          window,
          'MutationObserver',
          descriptor as PropertyDescriptor,
        );
      }
      expect(readInPageStepProbe(['step'])).toBeNull();
    });

    it('replaces a probe installed under the same step id, stopping its observer', async () => {
      install();
      trustedInput('pointerdown', element('#go'));
      expect(jest.getTimerCount()).toBe(1);
      install();
      addElement('destination');
      await deliverMutations();

      expect(jest.getTimerCount()).toBe(0);
      expect(readInPageStepProbe(['step'])).toMatchObject({
        start: null,
        end: null,
      });
    });
  });

  describe('known-answer hold', () => {
    describe('getInPageKnownAnswerMs', () => {
      it('is 0 when the hold is unset, empty or 0, whatever the step filter says', () => {
        process.env[KNOWN_ANSWER_INPAGE_STEP] = 'step';
        expect(getInPageKnownAnswerMs('step')).toBe(0);
        process.env[KNOWN_ANSWER_INPAGE_MS] = '';
        expect(getInPageKnownAnswerMs('step')).toBe(0);
        process.env[KNOWN_ANSWER_INPAGE_MS] = '0';
        expect(getInPageKnownAnswerMs('step')).toBe(0);
        delete process.env[KNOWN_ANSWER_INPAGE_STEP];
        expect(getInPageKnownAnswerMs('step')).toBe(0);
      });

      it('applies the hold only to a named step', () => {
        process.env[KNOWN_ANSWER_INPAGE_MS] = '300';
        process.env[KNOWN_ANSWER_INPAGE_STEP] =
          'openSwapPageFromHome, bridge_load_page';

        expect(getInPageKnownAnswerMs('openSwapPageFromHome')).toBe(300);
        expect(getInPageKnownAnswerMs('bridge_load_page')).toBe(300);
        expect(getInPageKnownAnswerMs('fetchAndDisplaySwapQuotes')).toBe(0);
        // Whole names only.
        expect(getInPageKnownAnswerMs('openSwapPage')).toBe(0);
        expect(getInPageKnownAnswerMs('bridge_load_page_extra')).toBe(0);
      });

      it('throws on a step named with the InPage or Legacy suffix, which no step id has', () => {
        process.env[KNOWN_ANSWER_INPAGE_MS] = '300';
        process.env[KNOWN_ANSWER_INPAGE_STEP] =
          'openSwapPageFromHome, bridge_load_pageInPage, confirm_txLegacy';

        expect(() => getInPageKnownAnswerMs('openSwapPageFromHome')).toThrow(
          `${KNOWN_ANSWER_INPAGE_STEP} names steps by step id, without a suffix: bridge_load_pageInPage, confirm_txLegacy`,
        );
      });

      it('throws when the hold is set and names no step', () => {
        process.env[KNOWN_ANSWER_INPAGE_MS] = '300';
        expect(() => getInPageKnownAnswerMs('step')).toThrow(
          `${KNOWN_ANSWER_INPAGE_MS} is 300, but ${KNOWN_ANSWER_INPAGE_STEP} names no step`,
        );
        process.env[KNOWN_ANSWER_INPAGE_STEP] = ' , ';
        expect(() => getInPageKnownAnswerMs('step')).toThrow('names no step');
      });

      it('throws on a hold that is not a non-negative integer', () => {
        process.env[KNOWN_ANSWER_INPAGE_STEP] = 'step';
        process.env[KNOWN_ANSWER_INPAGE_MS] = '-5';
        expect(() => getInPageKnownAnswerMs('step')).toThrow(
          `${KNOWN_ANSWER_INPAGE_MS} must be a non-negative integer, got "-5"`,
        );
      });
    });

    /**
     * A clock that advances by `stepMs` on every read, so a loop that waits
     * on it ends, and its reads can be counted.
     * @param stepMs - How far each read advances the clock.
     */
    function advancingClock(stepMs: number): jest.SpyInstance {
      return jest.spyOn(performance, 'now').mockImplementation(() => {
        now += stepMs;
        return now;
      });
    }

    it('holds the main thread at the trigger for the hold, after recording the start', async () => {
      install({ holdMs: 300 });
      now = 1000;
      const clock = advancingClock(10);

      trustedInput('pointerdown', element('#go'));
      const reads = clock.mock.calls.length;
      jest.spyOn(performance, 'now').mockImplementation(() => now);
      now = 2000;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      // The start is the first read, before the hold.
      expect(reading?.start).toBe(1010);
      // The listener did not return until the clock had moved 300 ms past
      // the hold's start (the second read, 1020): 30 more reads of 10 ms each.
      expect(reads).toBe(32);
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 990, unit: 'ms' },
      ]);
    });

    it('holds nothing, and reads the clock once at the trigger, when the hold is 0', async () => {
      install({ holdMs: 0 });
      now = 1000;
      const clock = advancingClock(10);

      trustedInput('pointerdown', element('#go'));

      expect(clock.mock.calls).toHaveLength(1);
      expect(readInPageStepProbe(['step'])).toMatchObject({ start: 1010 });
    });

    describe('startInPageStep', () => {
      function configCapturingDriver() {
        const configs: InPageProbeConfig[] = [];
        const driver = {
          executeScript: jest.fn(
            async (_script: unknown, config: InPageProbeConfig) => {
              configs.push(config);
              return null;
            },
          ),
        } as unknown as Driver;
        return { driver, configs };
      }

      it('passes the hold to the probe of a named step only, and logs it', async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        process.env[KNOWN_ANSWER_INPAGE_MS] = '300';
        process.env[KNOWN_ANSWER_INPAGE_STEP] = 'openSwapPageFromHome';
        const { driver, configs } = configCapturingDriver();

        await startInPageStep(driver, 'openSwapPageFromHome', {
          endSelector: '#destination',
        });
        await startInPageStep(driver, 'fetchAndDisplaySwapQuotes', {
          endSelector: '#destination',
        });

        expect(configs.map((config) => config.holdMs)).toStrictEqual([300, 0]);
        expect(log).toHaveBeenCalledWith(
          '[benchmark] openSwapPageFromHome: known-answer hold of 300 ms at the trigger',
        );
        expect(log).toHaveBeenCalledTimes(1);
      });

      it('passes no hold when none is set', async () => {
        const { driver, configs } = configCapturingDriver();

        await startInPageStep(driver, 'step', { endSelector: '#destination' });

        expect(configs).toStrictEqual([
          {
            stepId: 'step',
            endSelectors: ['#destination'],
            startWithin: null,
            typedOnly: false,
            boundMs: 60_000,
            holdMs: 0,
          },
        ]);
      });

      it('throws, and installs nothing, when the hold names no step', async () => {
        process.env[KNOWN_ANSWER_INPAGE_MS] = '300';
        const { driver } = configCapturingDriver();

        await expect(
          startInPageStep(driver, 'step', { endSelector: '#destination' }),
        ).rejects.toThrow('names no step');
        expect(driver.executeScript).not.toHaveBeenCalled();
      });
    });
  });

  describe('inPageTimerResult', () => {
    it('reports nothing when no probe was found', () => {
      expect(inPageTimerResult('step', null)).toStrictEqual([]);
    });
  });

  describe('measureStepInPage', () => {
    /**
     * A driver that, like `Driver.executeScript`, passes args as one array.
     * @param options - Fake driver behavior.
     * @param options.failFirst - Reject the first `executeScript` call.
     */
    function fakeDriver({ failFirst = false } = {}) {
      const order: string[] = [];
      let calls = 0;
      const driver = {
        executeScript: jest.fn(
          async (
            script: (args: unknown[]) => unknown,
            ...args: unknown[]
          ): Promise<unknown> => {
            calls += 1;
            order.push(`executeScript:${script.name}`);
            if (failFirst && calls === 1) {
              throw new Error('javascript error');
            }
            return script(args);
          },
        ),
      };
      return { driver: driver as unknown as Driver, order };
    }

    it('installs, runs the trigger and the timed wait in order, then reads', async () => {
      const { driver, order } = fakeDriver();
      captureInputHandler();

      const result = await measureStepInPage(driver, 'step', {
        endSelector: '#destination',
        trigger: async () => {
          order.push('trigger');
          now = 1000;
          trustedInput('pointerdown', element('#go'));
        },
        settle: async () => {
          order.push('settle');
          now = 1250;
          addElement('destination');
          await deliverMutations();
        },
      });

      expect(order).toStrictEqual([
        'executeScript:installInPageStepProbe',
        'trigger',
        'settle',
        'executeScript:readInPageStepProbe',
      ]);
      expect(result).toStrictEqual([{ id: 'step', value: 250, unit: 'ms' }]);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('still runs the trigger and the timed wait when the probe cannot be installed', async () => {
      const { driver, order } = fakeDriver({ failFirst: true });
      const trigger = jest.fn(async () => undefined);
      const settle = jest.fn(async () => undefined);

      const result = await measureStepInPage(driver, 'step', {
        endSelector: '#destination',
        trigger,
        settle,
      });

      expect(trigger).toHaveBeenCalledTimes(1);
      expect(settle).toHaveBeenCalledTimes(1);
      expect(order).toStrictEqual(['executeScript:installInPageStepProbe']);
      expect(result).toStrictEqual([]);
    });

    it('propagates an error from the timed wait, as the step always has', async () => {
      const { driver } = fakeDriver();

      await expect(
        measureStepInPage(driver, 'step', {
          endSelector: '#destination',
          trigger: async () => undefined,
          settle: async () => {
            throw new Error('TimeoutError');
          },
        }),
      ).rejects.toThrow('TimeoutError');
    });
  });

  describe('finishInPageStep', () => {
    it('reads once, removes the probe, and does not wait for a destination that has not appeared', async () => {
      const driver = {
        executeScript: jest.fn(
          async (script: (args: unknown[]) => unknown, ...args: unknown[]) =>
            script(args),
        ),
      } as unknown as Driver;
      install();
      trustedInput('pointerdown', element('#go'));

      const result = await finishInPageStep(driver, 'step');

      expect(result).toStrictEqual([]);
      expect(driver.executeScript).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
      expect(readInPageStepProbe(['step'])).toBeNull();
    });

    it('reports nothing when the probe cannot be read', async () => {
      const driver = {
        executeScript: jest.fn(async () => {
          throw new Error('no such window');
        }),
      } as unknown as Driver;

      expect(await finishInPageStep(driver, 'step')).toStrictEqual([]);
    });
  });

  describe('destinations', () => {
    it('are all valid CSS selectors', () => {
      const selectors = Object.values(IN_PAGE_DESTINATIONS).flat();

      for (const selector of selectors) {
        expect(() => document.querySelector(selector)).not.toThrow();
      }
    });
  });
});
