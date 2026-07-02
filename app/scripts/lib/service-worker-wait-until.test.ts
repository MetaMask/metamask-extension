import { waitUntil } from './service-worker-wait-until';

describe('waitUntil', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    globalThis.chrome = {
      runtime: {
        getPlatformInfo: jest.fn().mockResolvedValue({}),
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves when the promise resolves', async () => {
    const waitUntilPromise = waitUntil(Promise.resolve());

    await expect(waitUntilPromise).resolves.toBeUndefined();
  });

  it('rejects when the promise rejects', async () => {
    const waitUntilPromise = waitUntil(
      Promise.reject(new Error('startup failed')),
    );

    await expect(waitUntilPromise).rejects.toThrow('startup failed');
  });

  it('calls getPlatformInfo periodically while waiting', async () => {
    const getPlatformInfo = jest.fn().mockResolvedValue({});
    globalThis.chrome = {
      runtime: { getPlatformInfo },
    } as unknown as typeof chrome;

    let resolveDeferred!: () => void;
    const deferred = new Promise<void>((resolve) => {
      resolveDeferred = resolve;
    });

    const waitUntilPromise = waitUntil(deferred);

    jest.advanceTimersByTime(25 * 1000);
    expect(getPlatformInfo).toHaveBeenCalledTimes(1);

    resolveDeferred();
    await waitUntilPromise;

    jest.advanceTimersByTime(25 * 1000);
    expect(getPlatformInfo).toHaveBeenCalledTimes(1);
  });
});
