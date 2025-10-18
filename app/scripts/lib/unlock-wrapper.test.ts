import {
  withUnlockPrompt,
  createUnlockedMethodWrappers,
} from './unlock-wrapper';

describe('unlock-wrapper', () => {
  describe('withUnlockPrompt', () => {
    it('should call the function immediately if wallet is unlocked', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const mockGetUnlockPromise = jest.fn();
      const mockIsUnlocked = jest.fn().mockReturnValue(true);

      const wrappedFn = withUnlockPrompt(
        mockFn,
        mockGetUnlockPromise,
        mockIsUnlocked,
      );

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(mockGetUnlockPromise).not.toHaveBeenCalled();
      expect(mockIsUnlocked).toHaveBeenCalled();
    });

    it('should wait for unlock if wallet is locked', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const mockGetUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const mockIsUnlocked = jest.fn().mockReturnValue(false);

      const wrappedFn = withUnlockPrompt(
        mockFn,
        mockGetUnlockPromise,
        mockIsUnlocked,
      );

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(mockGetUnlockPromise).toHaveBeenCalledWith(true);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should pass shouldShowUnlockRequest as true to trigger popup', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      const mockGetUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const mockIsUnlocked = jest.fn().mockReturnValue(false);

      const wrappedFn = withUnlockPrompt(
        mockFn,
        mockGetUnlockPromise,
        mockIsUnlocked,
      );

      await wrappedFn();

      expect(mockGetUnlockPromise).toHaveBeenCalledWith(true);
    });

    it('should propagate errors from the wrapped function', async () => {
      const mockError = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(mockError);
      const mockGetUnlockPromise = jest.fn();
      const mockIsUnlocked = jest.fn().mockReturnValue(true);

      const wrappedFn = withUnlockPrompt(
        mockFn,
        mockGetUnlockPromise,
        mockIsUnlocked,
      );

      await expect(wrappedFn()).rejects.toThrow('test error');
      expect(mockFn).toHaveBeenCalled();
    });

    it('should preserve function context and arguments', async () => {
      const mockFn = jest.fn(async (a, b, c) => `${a}-${b}-${c}`);
      const mockGetUnlockPromise = jest.fn();
      const mockIsUnlocked = jest.fn().mockReturnValue(true);

      const wrappedFn = withUnlockPrompt(
        mockFn,
        mockGetUnlockPromise,
        mockIsUnlocked,
      );

      const result = await wrappedFn('one', 'two', 'three');

      expect(result).toBe('one-two-three');
      expect(mockFn).toHaveBeenCalledWith('one', 'two', 'three');
    });
  });

  describe('createUnlockedMethodWrappers', () => {
    it('should create wrapper with bound methods', () => {
      const mockAppStateController = {
        getUnlockPromise: jest.fn(),
      };
      const mockKeyringController = {
        state: {
          isUnlocked: true,
        },
      };

      const { wrapWithUnlock } = createUnlockedMethodWrappers({
        appStateController: mockAppStateController,
        keyringController: mockKeyringController,
      });

      expect(wrapWithUnlock).toBeInstanceOf(Function);
    });

    it('should correctly wrap methods with unlock logic', async () => {
      const mockGetUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const mockAppStateController = {
        getUnlockPromise: mockGetUnlockPromise,
      };
      const mockKeyringController = {
        state: {
          isUnlocked: false,
        },
      };

      const { wrapWithUnlock } = createUnlockedMethodWrappers({
        appStateController: mockAppStateController,
        keyringController: mockKeyringController,
      });

      const mockFn = jest.fn().mockResolvedValue('wrapped-result');
      const wrappedFn = wrapWithUnlock(mockFn);

      const result = await wrappedFn('test-arg');

      expect(result).toBe('wrapped-result');
      expect(mockGetUnlockPromise).toHaveBeenCalledWith(true);
      expect(mockFn).toHaveBeenCalledWith('test-arg');
    });

    it('should use keyring state to check unlock status', async () => {
      const mockAppStateController = {
        getUnlockPromise: jest.fn(),
      };
      const mockKeyringController = {
        state: {
          isUnlocked: true,
        },
      };

      const { wrapWithUnlock } = createUnlockedMethodWrappers({
        appStateController: mockAppStateController,
        keyringController: mockKeyringController,
      });

      const mockFn = jest.fn().mockResolvedValue('result');
      const wrappedFn = wrapWithUnlock(mockFn);

      await wrappedFn();

      expect(mockAppStateController.getUnlockPromise).not.toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalled();
    });
  });
});
