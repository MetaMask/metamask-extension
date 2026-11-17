import type { Hex } from '@metamask/utils';
import {
  createSessionCapabilities,
  type SessionCapabilities,
} from './session-capabilities';

const ADDRESS = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const CAPABILITIES_MOCK: SessionCapabilities = {
  '0x1': { atomic: { status: 'supported' } },
};

const deferred = <Type>() => {
  let resolve: (value: Type) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<Type>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
};

describe('createSessionCapabilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getSessionCapabilities', () => {
    it('resolves to no capabilities without computing when the chain set is empty', async () => {
      const computeCapabilities = jest.fn();
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      expect(await getSessionCapabilities(ADDRESS, [])).toStrictEqual({});
      expect(computeCapabilities).not.toHaveBeenCalled();
    });

    it('computes capabilities for the given address and chains', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
      expect(computeCapabilities).toHaveBeenCalledWith(ADDRESS, ['0x1']);
    });

    it('serves a fresh cached value without computing again', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await getSessionCapabilities(ADDRESS, ['0x1']);
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
      expect(computeCapabilities).toHaveBeenCalledTimes(1);
    });

    it('shares a cached value across address and chain casing and order', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await getSessionCapabilities(ADDRESS, ['0x1', '0xA' as Hex]);
      await getSessionCapabilities(ADDRESS.toUpperCase(), [
        '0xa' as Hex,
        '0x1',
      ]);

      expect(computeCapabilities).toHaveBeenCalledTimes(1);
    });

    it('rejects concurrent calls instead of computing again while the first is in flight', async () => {
      const pending = deferred<SessionCapabilities>();
      const computeCapabilities = jest.fn().mockReturnValue(pending.promise);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      const first = getSessionCapabilities(ADDRESS, ['0x1']);
      await expect(getSessionCapabilities(ADDRESS, ['0x1'])).rejects.toThrow(
        'Session capabilities are still being computed',
      );
      pending.resolve(CAPABILITIES_MOCK);

      expect(await first).toStrictEqual(CAPABILITIES_MOCK);
      expect(computeCapabilities).toHaveBeenCalledTimes(1);
    });

    it('serves a stale value immediately and refreshes it in the background', async () => {
      let currentTime = 0;
      const refreshed: SessionCapabilities = { '0x1': {} };
      const computeCapabilities = jest
        .fn()
        .mockResolvedValueOnce(CAPABILITIES_MOCK)
        .mockResolvedValueOnce(refreshed);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
        freshMs: 1000,
        now: () => currentTime,
      });

      await getSessionCapabilities(ADDRESS, ['0x1']);
      currentTime = 2000;
      const stale = await getSessionCapabilities(ADDRESS, ['0x1']);
      await Promise.resolve();
      const fresh = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(stale).toStrictEqual(CAPABILITIES_MOCK);
      expect(fresh).toStrictEqual(refreshed);
      expect(computeCapabilities).toHaveBeenCalledTimes(2);
    });

    it('keeps serving the stale value when a refresh fails', async () => {
      let currentTime = 0;
      const computeCapabilities = jest
        .fn()
        .mockResolvedValueOnce(CAPABILITIES_MOCK)
        .mockRejectedValueOnce(new Error('rpc failed'));
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
        freshMs: 1000,
        now: () => currentTime,
      });

      await getSessionCapabilities(ADDRESS, ['0x1']);
      currentTime = 2000;
      await getSessionCapabilities(ADDRESS, ['0x1']);
      await Promise.resolve();
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
    });

    it('rejects and does not cache a failed first computation', async () => {
      const computeCapabilities = jest
        .fn()
        .mockRejectedValueOnce(new Error('rpc failed'))
        .mockResolvedValueOnce(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await expect(getSessionCapabilities(ADDRESS, ['0x1'])).rejects.toThrow(
        'rpc failed',
      );
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
    });

    it('rejects after the timeout and still warms the cache for later calls', async () => {
      const pending = deferred<SessionCapabilities>();
      const computeCapabilities = jest.fn().mockReturnValue(pending.promise);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
        timeoutMs: 1000,
      });

      const first = getSessionCapabilities(ADDRESS, ['0x1']);
      const firstRejection = expect(first).rejects.toThrow(
        'Timed out computing session capabilities',
      );
      jest.advanceTimersByTime(1000);
      await firstRejection;

      pending.resolve(CAPABILITIES_MOCK);
      await Promise.resolve();
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
      expect(computeCapabilities).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('drops cached values', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities, clear } = createSessionCapabilities({
        computeCapabilities,
      });

      await getSessionCapabilities(ADDRESS, ['0x1']);
      clear();
      await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(computeCapabilities).toHaveBeenCalledTimes(2);
    });
  });
});
