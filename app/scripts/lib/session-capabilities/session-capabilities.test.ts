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

// A cold cache rejects and computes in the background, so warm it and let the
// computation settle.
const warm = async (
  getSessionCapabilities: (
    address: string,
    chainIds?: Hex[],
  ) => Promise<SessionCapabilities>,
  chainIds: Hex[],
) => {
  await getSessionCapabilities(ADDRESS, chainIds).catch(() => undefined);
  await Promise.resolve();
};

describe('createSessionCapabilities', () => {
  describe('getSessionCapabilities', () => {
    it('resolves to no capabilities without computing when the chain set is empty', async () => {
      const computeCapabilities = jest.fn();
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      expect(await getSessionCapabilities(ADDRESS, [])).toStrictEqual({});
      expect(computeCapabilities).not.toHaveBeenCalled();
    });

    it('rejects without waiting on a cold cache and computes in the background', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await expect(getSessionCapabilities(ADDRESS, ['0x1'])).rejects.toThrow(
        'Session capabilities are not ready yet',
      );

      expect(computeCapabilities).toHaveBeenCalledWith(ADDRESS, ['0x1']);
      expect(await getSessionCapabilities(ADDRESS, ['0x1'])).toStrictEqual(
        CAPABILITIES_MOCK,
      );
    });

    it('serves a fresh cached value without computing again', async () => {
      const computeCapabilities = jest
        .fn()
        .mockResolvedValue(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await warm(getSessionCapabilities, ['0x1']);
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

      await warm(getSessionCapabilities, ['0x1', '0xA' as Hex]);
      await getSessionCapabilities(ADDRESS.toUpperCase(), [
        '0xa' as Hex,
        '0x1',
      ]);

      expect(computeCapabilities).toHaveBeenCalledTimes(1);
    });

    it('does not compute again while the first computation is in flight', async () => {
      const pending = deferred<SessionCapabilities>();
      const computeCapabilities = jest.fn().mockReturnValue(pending.promise);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await expect(getSessionCapabilities(ADDRESS, ['0x1'])).rejects.toThrow(
        'not ready yet',
      );
      await expect(getSessionCapabilities(ADDRESS, ['0x1'])).rejects.toThrow(
        'not ready yet',
      );
      pending.resolve(CAPABILITIES_MOCK);
      await Promise.resolve();

      expect(computeCapabilities).toHaveBeenCalledTimes(1);
      expect(await getSessionCapabilities(ADDRESS, ['0x1'])).toStrictEqual(
        CAPABILITIES_MOCK,
      );
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

      await warm(getSessionCapabilities, ['0x1']);
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

      await warm(getSessionCapabilities, ['0x1']);
      currentTime = 2000;
      await getSessionCapabilities(ADDRESS, ['0x1']);
      await Promise.resolve();
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
    });

    it('does not cache a failed first computation and retries on the next call', async () => {
      const computeCapabilities = jest
        .fn()
        .mockRejectedValueOnce(new Error('rpc failed'))
        .mockResolvedValueOnce(CAPABILITIES_MOCK);
      const { getSessionCapabilities } = createSessionCapabilities({
        computeCapabilities,
      });

      await warm(getSessionCapabilities, ['0x1']);
      await warm(getSessionCapabilities, ['0x1']);
      const result = await getSessionCapabilities(ADDRESS, ['0x1']);

      expect(result).toStrictEqual(CAPABILITIES_MOCK);
      expect(computeCapabilities).toHaveBeenCalledTimes(2);
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

      await warm(getSessionCapabilities, ['0x1']);
      clear();
      await warm(getSessionCapabilities, ['0x1']);

      expect(computeCapabilities).toHaveBeenCalledTimes(2);
    });
  });
});
