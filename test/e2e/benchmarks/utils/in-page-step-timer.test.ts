import type { Mockttp } from 'mockttp';
import type { Driver } from '../../webdriver/driver';
import {
  CLICK_LAG_AFTER_TRIGGER,
  FailIterationError,
  IN_PAGE_DESTINATIONS,
  KNOWN_ANSWER_INPAGE_MS,
  KNOWN_ANSWER_INPAGE_STEP,
  TYPED_KEY_BEFORE_TRIGGER,
  assetPriceChartDestination,
  describeRequestsWithinInPageStep,
  finishInPageStep,
  getInPageKnownAnswerMs,
  inPageTimerResult,
  installInPageStepProbe,
  logRequestsWithinInPageSteps,
  measureStepInPage,
  readInPageStepProbe,
  startInPageStep,
  type InPageProbeConfig,
  type InPageProbeReading,
  type InPageStepReading,
  type SeenRequest,
} from './in-page-step-timer';

type ProbeHost = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __benchSteps?: Record<string, unknown>;
  stateHooks?: { resetLongTaskMetrics?: () => void };
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
      resetLongTasks: false,
      typedBeforeTrigger: false,
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
    delete host.stateHooks;
    delete process.env[KNOWN_ANSWER_INPAGE_MS];
    delete process.env[KNOWN_ANSWER_INPAGE_STEP];
    delete process.env[TYPED_KEY_BEFORE_TRIGGER];
    delete process.env[CLICK_LAG_AFTER_TRIGGER];
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
        startTimeStamp: 1000,
        typedKeys: 0,
        lastTypedAt: null,
        typedBeforeTriggerTimeStamp: null,
        typedBeforeTriggerAt: null,
        heldMs: 0,
        longTasksReset: false,
        epochOffset: Date.now() - 1103,
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
        // F, X and S; not the Shift keydowns.
        typedKeys: 3,
        lastTypedAt: 1005,
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

  describe('readings beside the value', () => {
    it("records the trigger's event.timeStamp and logs the input delay beside the value", async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install();

      now = 1000;
      trustedInput('pointerdown', element('#go'), { timeStamp: 988 });
      now = 1100;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ start: 1000, startTimeStamp: 988 });
      // The value is unchanged: the delay before the listener stays outside.
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 100, unit: 'ms' },
      ]);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step: 100.0 ms from pointerdown',
      );
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 12.0 ms (event.timeStamp to listener)',
      );
    });

    it('counts the typed characters up to the destination, and when the last arrived', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ startWithin: '#field', typedOnly: true });
      const field = element('#field');

      now = 500;
      trustedInput('keydown', field, { key: 'a', ctrlKey: true });
      trustedInput('keydown', field, { key: 'Backspace', ctrlKey: true });
      now = 1000;
      trustedInput('keydown', field, { key: '0' });
      now = 1004;
      trustedInput('keydown', field, { key: '.' });
      now = 1009;
      trustedInput('keydown', field, { key: '0' });
      now = 1013;
      trustedInput('keydown', field, { key: '1' });
      // Not typed into the field: not counted.
      trustedInput('keydown', element('#go'), { key: '2' });
      now = 1400;
      addElement('destination');
      await deliverMutations();
      // After the destination: the next step's.
      now = 1500;
      trustedInput('keydown', field, { key: '9' });
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        start: 1000,
        end: 1400,
        typedKeys: 4,
        lastTypedAt: 1013,
      });
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 400, unit: 'ms' },
      ]);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener); 4 typed key(s), the last at +13.0 ms',
      );
    });

    it('says so when event.timeStamp is not on the listener clock', () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      const reading: InPageProbeReading = {
        start: 1000,
        end: 1100,
        startEvent: 'pointerdown',
        preexisting: false,
        extraInputs: 0,
        timedOut: false,
        unobserved: false,
        startTimeStamp: 1_700_000_000_000,
        typedKeys: 0,
        lastTypedAt: null,
        typedBeforeTriggerTimeStamp: null,
        typedBeforeTriggerAt: null,
        heldMs: 0,
        longTasksReset: false,
        epochOffset: 0,
      };

      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 100, unit: 'ms' },
      ]);
      expect(log).toHaveBeenCalledWith(
        "[benchmark] step readings: event.timeStamp 1700000000000.0 is not on the listener's clock (1000.0)",
      );
    });

    it('with `typedBeforeTrigger`, records the last character typed before the trigger and logs it from the trigger', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ startWithin: '#go', typedBeforeTrigger: true });
      const field = element('#field');

      // The clear chord `driver.fill` sends first is not a typed character.
      now = 700;
      trustedInput('keydown', field, {
        key: 'a',
        ctrlKey: true,
        timeStamp: 699,
      });
      now = 802;
      trustedInput('keydown', field, { key: 'p', timeStamp: 800 });
      now = 853;
      trustedInput('keydown', field, { key: 'w', timeStamp: 850 });
      now = 900;
      trustedInput('pointerdown', element('#field'), { timeStamp: 900 });
      now = 1072;
      trustedInput('pointerdown', element('#go'), { timeStamp: 960 });
      now = 1300;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        start: 1072,
        startTimeStamp: 960,
        typedKeys: 0,
        lastTypedAt: null,
        typedBeforeTriggerTimeStamp: 850,
        typedBeforeTriggerAt: 853,
      });
      // The value still starts at the trigger.
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 228, unit: 'ms' },
      ]);
      expect(log).toHaveBeenCalledWith(
        "[benchmark] step readings: input delay 112.0 ms (event.timeStamp to listener); last key typed before the trigger at -110.0 ms, its listener at -107.0 ms (from the trigger's event.timeStamp)",
      );
    });

    it('records nothing typed before the trigger unless asked', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ startWithin: '#go' });

      now = 850;
      trustedInput('keydown', element('#field'), { key: 'p' });
      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1100;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        typedBeforeTriggerTimeStamp: null,
        typedBeforeTriggerAt: null,
      });
      inPageTimerResult('step', reading);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener)',
      );
    });

    it('with `clickLag`, records the first click from the trigger on and logs its lag', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ startWithin: '#go', clickLag: true });

      now = 1000;
      trustedInput('pointerdown', element('#go'), { timeStamp: 998 });
      // A page task ran between the pointerdown and the click: the click was
      // dispatched at 1005 and its listener ran at 1090.
      now = 1090;
      trustedInput('click', element('#go'), { timeStamp: 1005 });
      now = 1150;
      trustedInput('click', element('#go'), { timeStamp: 1149 });
      now = 1200;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({
        start: 1000,
        clickTimeStamp: 1005,
        clickAt: 1090,
        extraInputs: 0,
      });
      // The value still runs from the pointerdown.
      expect(inPageTimerResult('step', reading)).toStrictEqual([
        { id: 'step', value: 200, unit: 'ms' },
      ]);
      expect(log).toHaveBeenCalledWith(
        "[benchmark] step readings: input delay 2.0 ms (event.timeStamp to listener); click lag 85.0 ms (event.timeStamp to listener), the click's event.timeStamp at +7.0 ms from the trigger's event.timeStamp",
      );
    });

    it('with `clickLag`, takes a click that is itself the trigger as the first click', async () => {
      install({ startWithin: '#go', clickLag: true });

      now = 1004;
      trustedInput('click', element('#go'), { timeStamp: 1000 });
      now = 1100;
      addElement('destination');
      await deliverMutations();

      expect(readInPageStepProbe(['step'])).toMatchObject({
        startEvent: 'click',
        clickTimeStamp: 1000,
        clickAt: 1004,
      });
    });

    it('with `clickLag`, says so when no click came', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ clickLag: true });

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1100;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).toMatchObject({ clickTimeStamp: null, clickAt: null });
      inPageTimerResult('step', reading);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener); no click from the trigger on',
      );
    });

    it('records no click unless asked, and the readings line is unchanged', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      install({ startWithin: '#go' });

      now = 1000;
      trustedInput('pointerdown', element('#go'));
      now = 1050;
      trustedInput('click', element('#go'), { timeStamp: 1001 });
      now = 1100;
      addElement('destination');
      await deliverMutations();
      const reading = readInPageStepProbe(['step']);

      expect(reading).not.toHaveProperty('clickAt');
      expect(reading).not.toHaveProperty('clickTimeStamp');
      inPageTimerResult('step', reading);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener)',
      );
    });

    it('appends what the harness read around the trigger to the readings line', () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      const reading: InPageProbeReading = {
        start: 1000,
        end: 1100,
        startEvent: 'pointerdown',
        preexisting: false,
        extraInputs: 0,
        timedOut: false,
        unobserved: false,
        startTimeStamp: 998,
        typedKeys: 0,
        lastTypedAt: null,
        typedBeforeTriggerTimeStamp: null,
        typedBeforeTriggerAt: null,
        heldMs: 0,
        longTasksReset: false,
        epochOffset: 0,
      };

      expect(
        inPageTimerResult('step', reading, ['flag false before the trigger']),
      ).toStrictEqual([{ id: 'step', value: 100, unit: 'ms' }]);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 2.0 ms (event.timeStamp to listener); flag false before the trigger',
      );
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
      // the hold's start (the second read, 1020): 30 more reads of 10 ms
      // each, then one to record how long it held.
      expect(reads).toBe(33);
      expect(reading?.heldMs).toBe(310);
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
      expect(readInPageStepProbe(['step'])).toMatchObject({
        start: 1010,
        heldMs: 0,
      });
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

      it('passes no hold and no long-task reset when neither is set', async () => {
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
            resetLongTasks: false,
            typedBeforeTrigger: false,
          },
        ]);
      });

      it('records typing before the trigger only for a step that asks, and only with the switch set', async () => {
        const { driver, configs } = configCapturingDriver();

        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordTypingBeforeTrigger: true,
        });
        process.env[TYPED_KEY_BEFORE_TRIGGER] = '1';
        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordTypingBeforeTrigger: true,
        });
        await startInPageStep(driver, 'doesNotAsk', {
          endSelector: '#destination',
        });
        process.env[TYPED_KEY_BEFORE_TRIGGER] = '0';
        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordTypingBeforeTrigger: true,
        });

        expect(
          configs.map((config) => config.typedBeforeTrigger),
        ).toStrictEqual([false, true, false, false]);
      });

      it('records the click lag only for a step that asks, and only with the switch set', async () => {
        const { driver, configs } = configCapturingDriver();

        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordClickLag: true,
        });
        process.env[CLICK_LAG_AFTER_TRIGGER] = '1';
        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordClickLag: true,
        });
        await startInPageStep(driver, 'doesNotAsk', {
          endSelector: '#destination',
        });
        process.env[CLICK_LAG_AFTER_TRIGGER] = '0';
        await startInPageStep(driver, 'asks', {
          endSelector: '#destination',
          recordClickLag: true,
        });

        // Off, the probe's configuration carries no click-lag field at all.
        expect(configs.map((config) => 'clickLag' in config)).toStrictEqual([
          false,
          true,
          false,
          false,
        ]);
        expect(configs[1].clickLag).toBe(true);
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

  describe('long-task reset at the trigger', () => {
    it("resets the app's long-task metrics once, at the trigger, before reading the start", async () => {
      // The reset takes 5 ms here, so a start read after it shows it.
      const resetLongTaskMetrics = jest.fn(() => {
        now += 5;
      });
      (window as unknown as ProbeHost).stateHooks = { resetLongTaskMetrics };
      install({ resetLongTasks: true, startWithin: '#go' });

      // Not the trigger: no reset.
      trustedInput('pointerdown', element('#field'));
      expect(resetLongTaskMetrics).not.toHaveBeenCalled();
      now = 1000;
      trustedInput('pointerdown', element('#go'));
      trustedInput('click', element('#go'));
      expect(resetLongTaskMetrics).toHaveBeenCalledTimes(1);
      now = 1200;
      addElement('destination');
      await deliverMutations();

      expect(readInPageStepProbe(['step'])).toMatchObject({
        start: 1005,
        end: 1200,
        longTasksReset: true,
      });
    });

    it('does not reset when not asked', () => {
      const resetLongTaskMetrics = jest.fn();
      (window as unknown as ProbeHost).stateHooks = { resetLongTaskMetrics };
      install();

      trustedInput('pointerdown', element('#go'));

      expect(resetLongTaskMetrics).not.toHaveBeenCalled();
      expect(readInPageStepProbe(['step'])).toMatchObject({
        longTasksReset: false,
      });
    });

    it("records no reset where the app's hook is absent", () => {
      install({ resetLongTasks: true });

      trustedInput('pointerdown', element('#go'));

      expect(readInPageStepProbe(['step'])).toMatchObject({
        start: 1000,
        longTasksReset: false,
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

    it('tells the timed wait whether the probe was installed', async () => {
      const installedRun = fakeDriver();
      const failedRun = fakeDriver({ failFirst: true });
      const settle = jest.fn(async () => undefined);

      await measureStepInPage(installedRun.driver, 'step', {
        endSelector: '#destination',
        trigger: async () => undefined,
        settle,
      });
      await measureStepInPage(failedRun.driver, 'step', {
        endSelector: '#destination',
        trigger: async () => undefined,
        settle,
      });

      expect(settle.mock.calls).toStrictEqual([
        [{ installed: true }],
        [{ installed: false }],
      ]);
    });

    it('hands the reading to `onReading`', async () => {
      const { driver } = fakeDriver();
      captureInputHandler();
      const readings: InPageStepReading[] = [];

      await measureStepInPage(driver, 'step', {
        endSelector: '#destination',
        onReading: (stepReading) => readings.push(stepReading),
        trigger: async () => {
          now = 1000;
          trustedInput('pointerdown', element('#go'));
        },
        settle: async () => {
          now = 1250;
          addElement('destination');
          await deliverMutations();
        },
      });

      expect(readings).toHaveLength(1);
      expect(readings[0]).toMatchObject({
        stepId: 'step',
        reading: { start: 1000, end: 1250 },
      });
    });

    it('reads once after install and before the trigger, and puts the read on the readings line', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      const { driver, order } = fakeDriver();
      captureInputHandler();

      const result = await measureStepInPage(driver, 'step', {
        endSelector: '#destination',
        readBeforeTrigger: async () => {
          order.push('readBeforeTrigger');
          return ['flag true before the trigger'];
        },
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
        'readBeforeTrigger',
        'trigger',
        'settle',
        'executeScript:readInPageStepProbe',
      ]);
      // The read is outside the value, which starts at the trigger.
      expect(result).toStrictEqual([{ id: 'step', value: 250, unit: 'ms' }]);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener); flag true before the trigger',
      );
    });

    it('reports a read before the trigger that throws, and still runs the step', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      const { driver } = fakeDriver();
      captureInputHandler();
      const trigger = jest.fn(async () => {
        now = 1000;
        trustedInput('pointerdown', element('#go'));
      });

      const result = await measureStepInPage(driver, 'step', {
        endSelector: '#destination',
        readBeforeTrigger: async () => {
          throw new Error('no such window');
        },
        trigger,
        settle: async () => {
          now = 1100;
          addElement('destination');
          await deliverMutations();
        },
      });

      expect(trigger).toHaveBeenCalledTimes(1);
      expect(result).toStrictEqual([{ id: 'step', value: 100, unit: 'ms' }]);
      expect(log).toHaveBeenCalledWith(
        '[benchmark] step readings: input delay 0.0 ms (event.timeStamp to listener); the read before the trigger failed: no such window',
      );
    });

    it('fails the iteration when the read before the trigger throws a FailIterationError, without running the trigger', async () => {
      const { driver, order } = fakeDriver();
      const trigger = jest.fn(async () => undefined);
      const settle = jest.fn(async () => undefined);
      class CappedWait extends FailIterationError {}

      await expect(
        measureStepInPage(driver, 'step', {
          endSelector: '#destination',
          readBeforeTrigger: async () => {
            throw new CappedWait('trigger-quiet page capped at 5000.0 ms');
          },
          trigger,
          settle,
        }),
      ).rejects.toThrow('trigger-quiet page capped at 5000.0 ms');
      expect(trigger).not.toHaveBeenCalled();
      expect(settle).not.toHaveBeenCalled();
      expect(order).toStrictEqual(['executeScript:installInPageStepProbe']);
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
      const onReading = jest.fn();

      expect(await finishInPageStep(driver, 'step', onReading)).toStrictEqual(
        [],
      );
      expect(onReading).not.toHaveBeenCalled();
    });

    it('hands a missing probe to `onReading` as a null reading', async () => {
      const driver = {
        executeScript: jest.fn(
          async (script: (args: unknown[]) => unknown, ...args: unknown[]) =>
            script(args),
        ),
      } as unknown as Driver;
      const onReading = jest.fn();

      await finishInPageStep(driver, 'step', onReading);

      expect(onReading).toHaveBeenCalledWith({ stepId: 'step', reading: null });
    });
  });

  describe('request log', () => {
    const EPOCH = 1_700_000_000_000;

    /**
     * A reading whose interval runs from 1000 to 1500 on the page clock,
     * which is `EPOCH` behind the wall clock.
     * @param overrides - Fields to change.
     */
    function readingOf(
      overrides: Partial<InPageProbeReading> = {},
    ): InPageProbeReading {
      return {
        start: 1000,
        end: 1500,
        startEvent: 'pointerdown',
        preexisting: false,
        extraInputs: 0,
        timedOut: false,
        unobserved: false,
        startTimeStamp: 1000,
        typedKeys: 0,
        lastTypedAt: null,
        typedBeforeTriggerTimeStamp: null,
        typedBeforeTriggerAt: null,
        heldMs: 0,
        longTasksReset: false,
        epochOffset: EPOCH,
        ...overrides,
      };
    }

    /**
     * A request as the mock server records it. `received` and `answered` are
     * ms from the trigger at wall-clock `EPOCH + 1000`; null means no answer.
     */
    function requestOf(
      method: string,
      url: string,
      received: number,
      answered: number | null,
    ): SeenRequest {
      // The monotonic clock has its own origin; only differences count.
      const startTimestamp = 50_000 + received;
      return {
        method,
        url,
        timingEvents: {
          startTime: EPOCH + 1000 + received,
          startTimestamp,
          ...(answered !== null && {
            responseSentTimestamp: startTimestamp + answered - received,
          }),
        },
      };
    }

    const requests = [
      requestOf('GET', 'https://api.test/v1/balances?chain=1', 100, 650),
      requestOf('GET', 'https://api.test/v1/balances?chain=2', 120, 700),
      // In flight at the trigger, answered inside the interval.
      requestOf('POST', 'https://rpc.test/', -200, 50),
      // Answered before the trigger.
      requestOf('GET', 'https://api.test/v1/prices', -300, -10),
      // Received after the destination.
      requestOf('GET', 'https://api.test/v1/late', 505, 520),
      // Received inside, never answered.
      requestOf('GET', 'https://api.test/v1/pending', 400, null),
      // Received before, never answered: cannot be placed.
      requestOf('GET', 'https://api.test/v1/stale', -50, null),
    ];

    it('lists the requests that overlapped the interval, grouped, in ms from the trigger', () => {
      expect(
        describeRequestsWithinInPageStep(
          { stepId: 'step', reading: readingOf() },
          requests,
        ),
      ).toBe(
        [
          '[benchmark] step requests: 4 at the mock server overlapped the 500.0 ms interval (ms from the trigger)',
          '  POST rpc.test/ x1: received -200, answered +50',
          '  GET api.test/v1/balances x2: received +100..+120, answered +650..+700',
          '  GET api.test/v1/pending x1: received +400, 1 without an answer',
        ].join('\n'),
      );
    });

    it('lists nothing for a step whose interval has no end', () => {
      expect(
        describeRequestsWithinInPageStep(
          { stepId: 'step', reading: readingOf({ end: null }) },
          requests,
        ),
      ).toBe('[benchmark] step requests: not listed, the interval has no end');
      expect(
        describeRequestsWithinInPageStep(
          { stepId: 'step', reading: null },
          requests,
        ),
      ).toBe('[benchmark] step requests: not listed, the interval has no end');
    });

    it('caps the groups it lists, and says how many it left out', () => {
      const many = Array.from({ length: 45 }, (_, index) =>
        requestOf('GET', `https://api.test/path/${index}`, index, index + 1),
      );

      const lines = describeRequestsWithinInPageStep(
        { stepId: 'step', reading: readingOf() },
        many,
      ).split('\n');

      expect(lines).toHaveLength(42);
      expect(lines[1]).toBe(
        '  GET api.test/path/0 x1: received +0, answered +1',
      );
      expect(lines[41]).toBe('  ... 5 more group(s)');
    });

    describe('logRequestsWithinInPageSteps', () => {
      function serverOf(
        endpoints: { getSeenRequests: () => Promise<SeenRequest[]> }[],
      ) {
        return {
          getMockedEndpoints: jest.fn(async () => endpoints),
        } as unknown as Pick<Mockttp, 'getMockedEndpoints'>;
      }

      it("reads every mock rule's record once and logs each step", async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const first = {
          getSeenRequests: jest.fn(async () => requests.slice(0, 3)),
        };
        const second = {
          getSeenRequests: jest.fn(async () => requests.slice(3)),
        };
        const steps = [
          { stepId: 'step', reading: readingOf() },
          { stepId: 'other', reading: null },
        ];

        await logRequestsWithinInPageSteps(serverOf([first, second]), steps);

        expect(first.getSeenRequests).toHaveBeenCalledTimes(1);
        expect(second.getSeenRequests).toHaveBeenCalledTimes(1);
        expect(log.mock.calls).toStrictEqual([
          [describeRequestsWithinInPageStep(steps[0], requests)],
          [describeRequestsWithinInPageStep(steps[1], requests)],
        ]);
        expect(jest.getTimerCount()).toBe(0);
      });

      it('leaves out a rule whose record is not ready in time, and says how many', async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const ready = { getSeenRequests: jest.fn(async () => requests) };
        const hung = {
          getSeenRequests: jest.fn(
            () => new Promise<SeenRequest[]>(() => undefined),
          ),
        };
        const failed = {
          getSeenRequests: jest.fn(async (): Promise<SeenRequest[]> => {
            throw new Error('gone');
          }),
        };
        const steps = [{ stepId: 'step', reading: readingOf() }];

        const logged = logRequestsWithinInPageSteps(
          serverOf([ready, hung, failed]),
          steps,
          100,
        );
        await jest.advanceTimersByTimeAsync(100);
        await logged;

        expect(log.mock.calls).toStrictEqual([
          [
            '[benchmark] request log: 2 of 3 mock rules failed or gave no record within 100 ms; their requests are not listed',
          ],
          [describeRequestsWithinInPageStep(steps[0], requests)],
        ]);
      });

      it('never throws', async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const server = {
          getMockedEndpoints: jest.fn(async () => {
            throw new Error('server stopped');
          }),
        } as unknown as Pick<Mockttp, 'getMockedEndpoints'>;

        await logRequestsWithinInPageSteps(server, [
          { stepId: 'step', reading: readingOf() },
        ]);

        expect(log).toHaveBeenCalledWith(
          '[benchmark] request log unavailable: server stopped',
        );
      });

      it('reads nothing when no step was read', async () => {
        const server = serverOf([]);

        await logRequestsWithinInPageSteps(server, []);

        expect(server.getMockedEndpoints).not.toHaveBeenCalled();
      });
    });
  });

  describe('destinations', () => {
    it('are all valid CSS selectors', () => {
      const selectors = [
        ...Object.values(IN_PAGE_DESTINATIONS).flat(),
        ...assetPriceChartDestination(
          '0x0000000000000000000000000000000000000000',
        ),
        ...assetPriceChartDestination(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        ),
      ];

      for (const selector of selectors) {
        expect(() => document.querySelector(selector)).not.toThrow();
      }
    });
  });
});
