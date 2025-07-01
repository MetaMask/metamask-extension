import 'navigator.locks';
import log from 'loglevel';
import { OperationSafener } from './operation-safener';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const mockLocksRequest = jest.fn().mockImplementation((_, __, callback) => {
  try {
    return callback();
  } catch (error) {
    // Swallow the error in tests to prevent console noise
    return Promise.resolve(); // Resolve successfully even on error
  }
});
navigator.locks.request = mockLocksRequest;

jest.mock('loglevel', () => ({
  warn: jest.fn(),
}));

describe('OperationSafener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute an operation', async () => {
    const mockOp = jest.fn().mockResolvedValue('success');
    const safener = new OperationSafener({
      op: mockOp,
    });

    safener.execute('param1', 'param2');

    // Since debounce has a default wait of 0ms, we need to wait for the next tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockOp).toHaveBeenCalledWith('param1', 'param2');
    expect(mockLocksRequest).toHaveBeenCalled();
  });

  describe('With long wait option', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it('should handle consecutive evacuate calls', async () => {
      const mockOp = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10)),
        );
      const safener = new OperationSafener({
        op: mockOp,
      });

      safener.execute('param');

      // Start first evacuation
      const firstEvacuatePromise = safener.evacuate();

      // Start second evacuation, should be identical to first return value
      const secondEvacuatePromise = safener.evacuate();

      jest.advanceTimersByTime(10);

      await Promise.all([firstEvacuatePromise, secondEvacuatePromise]);

      // The operation should only be called once
      expect(mockOp).toHaveBeenCalledTimes(1);

      // they should be the same promise
      expect(firstEvacuatePromise === secondEvacuatePromise).toBe(true);
    });

    it('should debounce multiple calls', async () => {
      const mockOp = jest.fn().mockResolvedValue('success');
      const safener = new OperationSafener({
        op: mockOp,
        wait: 100,
      });

      safener.execute('call1');
      safener.execute('call2');
      safener.execute('call3');

      // "Wait" some time, but not all of it. ensure no calls are made yet
      jest.advanceTimersByTime(50);
      await Promise.resolve();

      expect(mockOp).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      await Promise.resolve();

      // Only the last call should be executed
      expect(mockOp).toHaveBeenCalledTimes(1);
      expect(mockOp).toHaveBeenCalledWith('call3');
    });
  });

  it('should return true when execute is called and not evacuating', () => {
    const mockOp = jest.fn();
    const safener = new OperationSafener({
      op: mockOp,
    });

    const result = safener.execute('param');
    expect(result).toBe(true);
  });

  it('should return false when execute is called during evacuation', async () => {
    const mockOp = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );
    const safener = new OperationSafener({
      op: mockOp,
    });

    // Start evacuation process
    const evacuatePromise = safener.evacuate();

    // Try to execute during evacuation
    const result = safener.execute('param');

    expect(result).toBe(false);

    await evacuatePromise;
  });

  it('should evacuate and execute the pending operation', async () => {
    const mockOp = jest.fn().mockResolvedValue('success');
    const safener = new OperationSafener({
      op: mockOp,
      wait: 100,
    });

    safener.execute('param1');

    // Should immediately execute the pending operation
    await safener.evacuate();

    expect(mockOp).toHaveBeenCalledWith('param1');
  });

  describe('Errors', () => {
    beforeEach(() => {
      process.setIgnoreUnhandled(true);
    });
    afterEach(() => {
      setTimeout(() => {
        process.resetIgnoreUnhandled();
      }, 1000);
    });

    it('should handle errors during operation execution', async () => {
      // Create a mock operation that returns a rejected promise
      const mockOp = jest.fn().mockRejectedValue(new Error('Test error'));

      const safener = new OperationSafener({
        op: mockOp,
        wait: 150,
      });

      safener.execute('param');

      // Should not throw when the operation fails
      await expect(safener.evacuate()).resolves.not.toThrow();

      expect(mockOp).toHaveBeenCalledWith('param');

      await expect(mockOp).rejects.toEqual(new Error('Test error'));
    });
  });

  it('should create instance with debounce options', () => {
    // Just test that we can create an instance with options
    const mockOp = jest.fn();
    const safener = new OperationSafener({
      op: mockOp,
      wait: 10,
      options: { maxWait: 20 },
    });

    // Just verify the instance was created
    expect(safener).toBeInstanceOf(OperationSafener);
  });

  it('should prevent further executions after evacuation completes', async () => {
    // Use a simple mock that doesn't throw
    const mockOp = jest.fn();
    const safener = new OperationSafener({
      op: mockOp,
      wait: 0,
    });

    // First execution
    safener.execute('param1');

    // Evacuate which should trigger the execution of param1
    await safener.evacuate();

    // This should return false and not be executed
    const result = safener.execute('param2');

    expect(result).toBe(false);
    expect(mockOp).toHaveBeenCalledTimes(1);
    expect(mockOp).toHaveBeenCalledWith('param1');
  });

  it('should log warning when execute is called during evacuation', async () => {
    const mockOp = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );
    const safener = new OperationSafener({
      op: mockOp,
    });

    // Mock log.warn
    const logWarnSpy = jest.spyOn(log, 'warn');

    // Start evacuation process
    const evacuatePromise = safener.evacuate();

    // Try to execute during evacuation
    safener.execute('param');

    expect(logWarnSpy).toHaveBeenCalledWith(
      'evacuating, ignoring call to `execute`',
    );

    await evacuatePromise;
  });

  it('should log warning when evacuate is called multiple times', async () => {
    const mockOp = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );
    const safener = new OperationSafener({
      op: mockOp,
    });

    // Mock log.warn
    const logWarnSpy = jest.spyOn(log, 'warn');

    // Start first evacuation
    const firstEvacuatePromise = safener.evacuate();

    // Start second evacuation
    safener.evacuate();

    expect(logWarnSpy).toHaveBeenCalledWith('already evacuating');

    await firstEvacuatePromise;
  });
});
