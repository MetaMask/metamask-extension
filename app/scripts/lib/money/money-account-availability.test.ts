import type { Hex } from '@metamask/utils';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountAvailabilityService,
  type MoneyAccountAvailabilityMessenger,
} from './money-account-availability';

jest.mock('./get-money-account-address');

const MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;

const ENABLED_FLAG = { enabled: true, minimumVersion: '0.0.1' };
const DISABLED_FLAG = { enabled: false, minimumVersion: '0.0.1' };

const deriveMoneyAccountAddressMock = jest.mocked(deriveMoneyAccountAddress);

/**
 * Build a messenger that answers the actions the service calls, and records
 * the `KeyringController:unlock` subscriber so a test can fire it.
 *
 * @param options - Options.
 * @param options.moneyFlag - The raw `moneyEnableMoneyAccount` flag value.
 * @returns The messenger, its mocks, and a way to publish an unlock.
 */
function createMockMessenger({
  moneyFlag = ENABLED_FLAG as unknown,
}: {
  moneyFlag?: unknown;
} = {}) {
  const call = jest.fn((action: string) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: {
          [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: moneyFlag,
        },
      };
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  const subscribers: (() => void)[] = [];
  const subscribe = jest.fn((event: string, handler: () => void) => {
    expect(event).toBe('KeyringController:unlock');
    subscribers.push(handler);
  });

  const messenger = {
    call,
    subscribe,
  } as unknown as MoneyAccountAvailabilityMessenger;

  return {
    messenger,
    call,
    publishUnlock: () => subscribers.forEach((handler) => handler()),
  };
}

function createService(
  options: Parameters<typeof createMockMessenger>[0] = {},
) {
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

  it('answers available with the derived address when the flag is on', async () => {
    const { service } = createService();

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
  });

  it('answers unavailable when the flag is off, without touching the seed', async () => {
    const { service } = createService({ moneyFlag: DISABLED_FLAG });

    expect(await service.getAvailability()).toStrictEqual({
      isAvailable: false,
    });
    expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
  });

  it('answers unavailable when the flag is absent or malformed', async () => {
    for (const moneyFlag of [null, 'yes', { enabled: true }]) {
      const { service } = createService({ moneyFlag });

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: false,
      });
    }
  });

  it('re-reads the flag on every call so a remote-flag refresh takes effect', async () => {
    let flag: unknown = DISABLED_FLAG;
    const call = jest.fn(() => ({
      remoteFeatureFlags: { [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: flag },
    }));
    const messenger = {
      call,
      subscribe: jest.fn(),
    } as unknown as MoneyAccountAvailabilityMessenger;
    const service = new MoneyAccountAvailabilityService({ messenger });

    expect((await service.getAvailability()).isAvailable).toBe(false);

    flag = ENABLED_FLAG;
    expect((await service.getAvailability()).isAvailable).toBe(true);
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
});
