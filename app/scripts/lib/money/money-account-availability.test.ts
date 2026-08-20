import type { Hex } from '@metamask/utils';
import { MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountAvailabilityService,
  type MoneyAccountAvailabilityMessenger,
} from './money-account-availability';

jest.mock('./get-money-account-address');

const MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;

const deriveMoneyAccountAddressMock = jest.mocked(deriveMoneyAccountAddress);

function createMockMessenger({
  geoFlag,
  location = 'US',
  getGeolocation,
}: {
  geoFlag?: unknown;
  location?: string;
  getGeolocation?: () => Promise<string> | string;
} = {}) {
  const call = jest.fn((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: {
          ...(geoFlag === undefined
            ? {}
            : { [MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME]: geoFlag }),
        },
      };
    }
    if (action === 'GeolocationController:getGeolocation') {
      if (getGeolocation) {
        return getGeolocation();
      }
      return location;
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  const unlockSubscribers: (() => void)[] = [];
  const lockSubscribers: (() => void)[] = [];
  const subscribe = jest.fn((event: string, handler: () => void) => {
    if (event === 'KeyringController:unlock') {
      unlockSubscribers.push(handler);
    } else if (event === 'KeyringController:lock') {
      lockSubscribers.push(handler);
    } else {
      throw new Error(`Unexpected event: ${event}`);
    }
  });

  const registerMethodActionHandlers = jest.fn();
  const messenger = {
    call,
    subscribe,
    registerMethodActionHandlers,
  } as unknown as MoneyAccountAvailabilityMessenger;

  return {
    messenger,
    call,
    publishUnlock: () => unlockSubscribers.forEach((handler) => handler()),
    publishLock: () => lockSubscribers.forEach((handler) => handler()),
  };
}

function createService(options?: Parameters<typeof createMockMessenger>[0]) {
  const mock = createMockMessenger(options);
  const service = new MoneyAccountAvailabilityService({
    messenger: mock.messenger,
  });
  return { service, ...mock };
}

describe('MoneyAccountAvailabilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deriveMoneyAccountAddressMock.mockResolvedValue(MONEY_ADDRESS);
  });

  it('answers available with the derived address', async () => {
    const { service } = createService();

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
  });

  it('answers unavailable when the user is in a blocked region, without touching the seed', async () => {
    const { service } = createService({ location: 'GB' });

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: false,
    });
    expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
  });

  it('answers unavailable when geolocation is unknown', async () => {
    const { service } = createService({ location: 'UNKNOWN' });

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: false,
    });
    expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
  });

  it('answers unavailable when geolocation throws', async () => {
    const { service } = createService({
      getGeolocation: () => {
        throw new Error('geolocation failed');
      },
    });

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: false,
    });
    expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
  });

  it('answers available when blockedRegions is empty, even in an otherwise blocked country', async () => {
    const { service } = createService({
      location: 'GB',
      geoFlag: { blockedRegions: [] },
    });

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
  });

  it('answers unavailable when the address cannot be derived, and retries next call', async () => {
    deriveMoneyAccountAddressMock.mockRejectedValueOnce(
      new Error('wallet is locked'),
    );
    const { service } = createService();

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: false,
    });

    // The failure was not cached: the next call derives again and succeeds.
    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(2);
  });

  it('caches the derived address across calls', async () => {
    const { service } = createService();

    await service.getAvailability();
    await service.getAvailability();

    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight derivation between concurrent callers', async () => {
    const { service } = createService();

    const [first, second] = await Promise.all([
      service.getAvailability(),
      service.getAvailability(),
    ]);

    expect(first).toStrictEqual(second);
    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(1);
  });

  it('drops the cached address on unlock so a vault restore re-derives', async () => {
    const { service, publishUnlock } = createService();

    await service.getAvailability();

    const restoredAddress = '0x1111111111111111111111111111111111111111';
    deriveMoneyAccountAddressMock.mockResolvedValue(restoredAddress as Hex);
    publishUnlock();

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: restoredAddress,
    });
    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(2);
  });

  it('drops the cached address on lock so a locked wallet is not served a stale address', async () => {
    const { service, publishLock } = createService();

    await service.getAvailability();
    publishLock();

    await service.getAvailability();

    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(2);
  });

  it('does not clear a newer cached derivation when an older, superseded one rejects', async () => {
    const { service, publishUnlock } = createService();

    let rejectFirst: (error: Error) => void = () => undefined;
    deriveMoneyAccountAddressMock.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectFirst = reject;
      }),
    );

    const firstCall = service.getAvailability();

    // Unlock clears the cache and starts a second, successful derivation.
    publishUnlock();
    deriveMoneyAccountAddressMock.mockResolvedValueOnce(MONEY_ADDRESS);
    const secondCall = service.getAvailability();

    // The first (now superseded) derivation finally rejects.
    rejectFirst(new Error('wallet was locked'));

    await Promise.all([firstCall, secondCall]);

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
    expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(2);
  });
});
