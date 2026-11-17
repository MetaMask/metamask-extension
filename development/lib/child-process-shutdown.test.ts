/**
 * @jest-environment node
 */
import {
  notifyParentOfBuildCompletion,
  requestChildShutdown,
} from './child-process-shutdown';

describe('requestChildShutdown', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('waits for IPC delivery before releasing the parent', () => {
    jest.useFakeTimers();
    let delivered: ((error: Error | null) => void) | undefined;
    const child = {
      channel: {},
      send: jest.fn(
        (_message: string, callback: (error: Error | null) => void) => {
          delivered = callback;
          return false;
        },
      ),
      kill: jest.fn(() => true),
    };
    const releaseParent = jest.fn();

    requestChildShutdown(child, 'SIGINT', releaseParent);
    jest.advanceTimersByTime(500);

    expect(releaseParent).not.toHaveBeenCalled();
    expect(child.kill).not.toHaveBeenCalled();
    delivered?.(null);
    expect(releaseParent).toHaveBeenCalledTimes(1);
  });

  it('sends a POSIX shutdown signal when there is no IPC channel', () => {
    const child = { channel: null, kill: jest.fn(() => true) };
    const releaseParent = jest.fn();

    requestChildShutdown(child, 'SIGTERM', releaseParent);

    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    expect(releaseParent).toHaveBeenCalledTimes(1);
  });

  it('falls back to a signal when IPC delivery fails', () => {
    const child = {
      channel: {},
      send: jest.fn(
        (_message: string, callback: (error: Error | null) => void) => {
          callback(new Error('IPC failed'));
          return false;
        },
      ),
      kill: jest.fn(() => true),
    };
    const releaseParent = jest.fn();

    requestChildShutdown(child, 'SIGTERM', releaseParent);

    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    expect(releaseParent).toHaveBeenCalledTimes(1);
  });

  it('releases the parent when sending over a closed channel throws', () => {
    const child = {
      channel: {},
      send: jest.fn(() => {
        throw new Error('IPC closed');
      }),
      kill: jest.fn(() => false),
    };
    const releaseParent = jest.fn();

    requestChildShutdown(child, 'SIGINT', releaseParent);

    expect(child.kill).toHaveBeenCalledWith('SIGINT');
    expect(releaseParent).toHaveBeenCalledTimes(1);
  });
});

describe('notifyParentOfBuildCompletion', () => {
  it('does not fall back to a signal when IPC is backpressured', () => {
    const signalProcess = {
      ppid: 123,
      connected: true,
      send: jest.fn(() => false),
      kill: jest.fn(() => true),
    };

    notifyParentOfBuildCompletion(signalProcess, 123);

    expect(signalProcess.send).toHaveBeenCalledWith(
      'SIGUSR2',
      expect.any(Function),
    );
    expect(signalProcess.kill).not.toHaveBeenCalled();
  });

  it('does not signal a PID after the parent has exited', () => {
    const signalProcess = { ppid: 1, kill: jest.fn(() => true) };

    notifyParentOfBuildCompletion(signalProcess, 123);

    expect(signalProcess.kill).not.toHaveBeenCalled();
  });

  it('ignores a disconnected IPC channel', () => {
    const signalProcess = {
      ppid: 123,
      connected: false,
      send: jest.fn(() => true),
      kill: jest.fn(() => true),
    };

    notifyParentOfBuildCompletion(signalProcess, 123);

    expect(signalProcess.send).not.toHaveBeenCalled();
    expect(signalProcess.kill).not.toHaveBeenCalled();
  });

  it('ignores asynchronous channel-closed errors', () => {
    const signalProcess = {
      ppid: 123,
      connected: true,
      send: jest.fn(
        (_message: string, callback?: (error: Error | null) => void) => {
          callback?.(
            Object.assign(new Error('closed'), {
              code: 'ERR_IPC_CHANNEL_CLOSED',
            }),
          );
          return true;
        },
      ),
      kill: jest.fn(() => true),
    };

    expect(() =>
      notifyParentOfBuildCompletion(signalProcess, 123),
    ).not.toThrow();
    expect(signalProcess.kill).not.toHaveBeenCalled();
  });

  it('signals a live POSIX parent', () => {
    const signalProcess = { ppid: 123, kill: jest.fn(() => true) };

    notifyParentOfBuildCompletion(signalProcess, 123);

    expect(signalProcess.kill).toHaveBeenCalledWith(123, 'SIGUSR2');
  });
});
