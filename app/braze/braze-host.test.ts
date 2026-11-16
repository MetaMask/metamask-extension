import { createBrazeHost } from './braze-host';

function createWorker() {
  const events = new EventTarget();
  const worker = {
    addEventListener: events.addEventListener.bind(events),
    postMessage: jest.fn(),
    terminate: jest.fn(),
  };
  return {
    worker: worker as unknown as Worker,
    postMessage: worker.postMessage,
    terminate: worker.terminate,
    reply: (data: unknown) =>
      events.dispatchEvent(new MessageEvent('message', { data })),
    fail: () => events.dispatchEvent(new Event('error')),
  };
}

describe('createBrazeHost', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts a worker only when identifying a user', async () => {
    const factory = jest.fn(() => createWorker().worker);
    const sync = createBrazeHost({ createWorker: factory });

    await sync(null);

    expect(factory).not.toHaveBeenCalled();
  });

  it('sends only the identity and waits for its acknowledgement', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });

    const result = sync('profile');
    expect(worker.postMessage).toHaveBeenCalledWith({
      id: 1,
      profileId: 'profile',
    });
    worker.reply({ id: 1, success: true });

    await expect(result).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ignores DOM commands and unmatched acknowledgements', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const completed = jest.fn();
    const result = sync('profile').then(completed);
    const createElement = jest.spyOn(document, 'createElement');

    worker.reply({
      id: 1,
      html: '<script src="https://example.test/remote.js"></script>',
    });
    worker.reply({ id: 2, success: true });
    await Promise.resolve();

    expect(completed).not.toHaveBeenCalled();
    expect(createElement).not.toHaveBeenCalled();
    worker.reply({ id: 1, success: true });
    await result;
  });

  it('rejects failed acknowledgements', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const result = sync('profile');

    worker.reply({ id: 1, success: false, error: 'SDK incompatible' });

    await expect(result).rejects.toThrow('SDK incompatible');
  });

  it('terminates the worker after clearing its identity', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const identify = sync('profile');
    worker.reply({ id: 1, success: true });
    await identify;

    const clear = sync(null);
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.reply({ id: 2, success: true });
    await clear;

    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('preserves the worker when a newer identity follows a clear', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const identify = sync('profile');
    const clear = sync(null);
    const next = sync('new-profile');

    worker.reply({ id: 1, success: true });
    worker.reply({ id: 2, success: true });
    worker.reply({ id: 3, success: true });
    await Promise.all([identify, clear, next]);

    expect(worker.terminate).not.toHaveBeenCalled();
  });

  it('terminates the worker even if SDK cleanup fails', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const identify = sync('profile');
    worker.reply({ id: 1, success: true });
    await identify;

    const clear = sync(null);
    worker.reply({ id: 2, success: false, error: 'Cleanup failed' });

    await expect(clear).rejects.toThrow('Cleanup failed');
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('retries a crashed worker and ignores its stale events', async () => {
    const first = createWorker();
    const second = createWorker();
    const factory = jest
      .fn()
      .mockReturnValueOnce(first.worker)
      .mockReturnValueOnce(second.worker);
    const sync = createBrazeHost({ createWorker: factory });
    const failed = sync('profile');
    first.fail();
    await expect(failed).rejects.toThrow('Braze worker failed');

    const retried = sync('profile');
    first.fail();
    first.reply({ id: 2, success: true });
    second.reply({ id: 2, success: true });
    await retried;

    expect(first.terminate).toHaveBeenCalledTimes(1);
    expect(second.terminate).not.toHaveBeenCalled();
  });

  it('terminates an unresponsive worker', async () => {
    const worker = createWorker();
    const sync = createBrazeHost({ createWorker: () => worker.worker });
    const result = sync('profile');

    jest.advanceTimersByTime(30_000);

    await expect(result).rejects.toThrow('Braze worker sync timed out');
    expect(worker.terminate).toHaveBeenCalled();
  });
});
