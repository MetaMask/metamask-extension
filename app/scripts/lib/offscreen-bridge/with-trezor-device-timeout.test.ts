import { TREZOR_DEVICE_OPERATION_TIMEOUT_MS } from '../../../../shared/constants/hardware-wallets';
import { withTrezorDeviceTimeout } from './with-trezor-device-timeout';

describe('withTrezorDeviceTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with the value when the wrapped promise resolves before the timeout', async () => {
    const result = await withTrezorDeviceTimeout(Promise.resolve('payload'));

    expect(result).toBe('payload');
  });

  it('rejects with the original error when the wrapped promise rejects before the timeout', async () => {
    const originalError = new Error('device error');

    await expect(
      withTrezorDeviceTimeout(Promise.reject(originalError)),
    ).rejects.toBe(originalError);
  });

  it('rejects with a timeout error when the wrapped promise never settles', async () => {
    jest.useFakeTimers();

    const promise = withTrezorDeviceTimeout(new Promise(() => undefined));
    // Prevent an unhandled rejection warning while timers advance.
    const assertion = expect(promise).rejects.toThrow(
      `Operation cancelled by timeout after ${TREZOR_DEVICE_OPERATION_TIMEOUT_MS} ms`,
    );

    jest.advanceTimersByTime(TREZOR_DEVICE_OPERATION_TIMEOUT_MS);

    await assertion;
  });

  it('does not time out when the promise resolves just before the deadline', async () => {
    jest.useFakeTimers();

    let resolvePromise: (value: string) => void = () => undefined;
    const pending = new Promise<string>((resolve) => {
      resolvePromise = resolve;
    });

    const promise = withTrezorDeviceTimeout(pending);

    jest.advanceTimersByTime(TREZOR_DEVICE_OPERATION_TIMEOUT_MS - 1);
    resolvePromise('done');

    await expect(promise).resolves.toBe('done');
  });

  it('clears the timeout timer once the wrapped promise settles', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    await withTrezorDeviceTimeout(Promise.resolve('payload'));

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    clearTimeoutSpy.mockRestore();
  });
});
