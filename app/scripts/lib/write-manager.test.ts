import 'navigator.locks';
import log from 'loglevel';
import browser from 'webextension-polyfill';
import { WriteManager } from './write-manager';

// Mock browser.runtime.reload
jest.mock('webextension-polyfill', () => ({
  runtime: {
    reload: jest.fn(),
  },
}));

// Silence logs during tests
log.setLevel('silent');

describe('WriteManager', () => {
  let mockWrite: jest.Mock<Promise<void>, unknown[]>;
  let writeManager: WriteManager;
  const frequency = 100;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockWrite = jest.fn().mockResolvedValue(undefined);
    writeManager = new WriteManager({ write: mockWrite, frequency });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('debounces write operations when not stopped', async () => {
    const params = ['data1'];
    writeManager.write(...params);
    expect(mockWrite).not.toHaveBeenCalled();
    jest.advanceTimersByTime(frequency);
    await Promise.resolve();
    expect(mockWrite).toHaveBeenCalledWith(...params);
  });

  it('only executes the last write within debounce period', async () => {
    writeManager.write('data1');
    writeManager.write('data2');
    writeManager.write('data3');
    jest.advanceTimersByTime(frequency);
    await Promise.resolve();
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenCalledWith('data3');
  });

  it('waits for ongoing writes before reloading', async () => {
    let resolveWrite: () => void;
    mockWrite.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWrite = resolve;
        }),
    );
    writeManager.write('data1');
    jest.advanceTimersByTime(frequency);
    await Promise.resolve();
    expect(mockWrite).toHaveBeenCalledWith('data1');
    const reloadPromise = writeManager.safeReload();
    expect(browser.runtime.reload).not.toHaveBeenCalled();
    // @ts-expect-error
    resolveWrite();
    await reloadPromise;
    expect(browser.runtime.reload).toHaveBeenCalled();
  });

  it('flushes pending debounced writes before reloading', async () => {
    writeManager.write('data1');
    const reloadPromise = writeManager.safeReload();
    await reloadPromise;
    expect(mockWrite).toHaveBeenCalledWith('data1');
    expect(browser.runtime.reload).toHaveBeenCalled();
  });

  it('cancels pending debounced writes when stopped', async () => {
    writeManager.write('data1');
    writeManager.stop();
    jest.advanceTimersByTime(frequency);
    await Promise.resolve();
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('handles safeReload when already stopped', async () => {
    writeManager.stop();
    await writeManager.safeReload();
    expect(browser.runtime.reload).toHaveBeenCalled();
  });
});
