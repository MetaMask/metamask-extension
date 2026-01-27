import { delay, retryUntil } from './retry';

describe('retryUntil', () => {
  it('returns the first successful result', async () => {
    let attempts = 0;

    const result = await retryUntil(
      async () => {
        attempts += 1;
        return attempts;
      },
      (value) => value >= 2,
      { attempts: 3, delayMs: 1 },
    );

    expect(result).toBe(2);
  });

  it('returns the last attempt result when never successful', async () => {
    const result = await retryUntil(
      async () => 'still-failing',
      () => false,
      { attempts: 2, delayMs: 1 },
    );

    expect(result).toBe('still-failing');
  });
});

describe('delay', () => {
  it('waits for the provided duration', async () => {
    const start = Date.now();

    await delay(5);

    expect(Date.now() - start).toBeGreaterThanOrEqual(0);
  });
});
