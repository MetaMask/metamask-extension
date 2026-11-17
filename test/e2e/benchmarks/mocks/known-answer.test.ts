import { getKnownAnswerDelayMs, withKnownAnswerDelay } from './known-answer';

const NAME = 'BENCHMARK_KNOWN_ANSWER_TEST_DELAY_MS';

describe('known-answer', () => {
  afterEach(() => {
    delete process.env[NAME];
    jest.useRealTimers();
  });

  describe('getKnownAnswerDelayMs', () => {
    it('is 0 when the variable is unset or empty', () => {
      expect(getKnownAnswerDelayMs(NAME)).toBe(0);
      process.env[NAME] = '';
      expect(getKnownAnswerDelayMs(NAME)).toBe(0);
    });

    it('reads a non-negative integer', () => {
      process.env[NAME] = '300';
      expect(getKnownAnswerDelayMs(NAME)).toBe(300);
    });

    it('rejects anything but a non-negative integer', () => {
      for (const raw of ['-1', '1.5', 'abc']) {
        process.env[NAME] = raw;
        expect(() => getKnownAnswerDelayMs(NAME)).toThrow(
          `${NAME} must be a non-negative integer, got "${raw}"`,
        );
      }
    });
  });

  describe('withKnownAnswerDelay', () => {
    it('responds only after the delay', async () => {
      jest.useFakeTimers();
      process.env[NAME] = '300';
      const handler = jest.fn(async (request: string) => `reply to ${request}`);
      let reply: string | undefined;

      const delayed = withKnownAnswerDelay(NAME, handler);
      const pending = delayed('quote').then((value) => {
        reply = value;
      });
      await jest.advanceTimersByTimeAsync(299);
      expect(handler).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(1);
      await pending;

      expect(handler).toHaveBeenCalledWith('quote');
      expect(reply).toBe('reply to quote');
    });

    it('responds at once when the variable is unset', async () => {
      jest.useFakeTimers();
      const handler = jest.fn(() => 'reply');

      const reply = await withKnownAnswerDelay(NAME, handler)(undefined);

      expect(reply).toBe('reply');
      expect(jest.getTimerCount()).toBe(0);
    });

    it('reads the variable when the mock is registered, not per response', async () => {
      process.env[NAME] = '0';
      const delayed = withKnownAnswerDelay(NAME, () => 'reply');
      process.env[NAME] = '60000';
      jest.useFakeTimers();

      expect(await delayed(undefined)).toBe('reply');
    });
  });
});
