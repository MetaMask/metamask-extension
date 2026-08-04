import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountAvailabilityService,
  type MoneyAccountAvailabilityMessenger,
} from './money-account-availability';

jest.mock('./get-money-account-address');

const MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;
const MONAD_NETWORK_CLIENT_ID = 'monad-mainnet';
const DELEGATION_TARGET = '1111111111111111111111111111111111111111';

/** The code of an EOA delegated to `DELEGATION_TARGET`. */
const DELEGATED_CODE = `0xef0100${DELEGATION_TARGET}`;

/** The code of an EOA with no delegation. */
const EMPTY_CODE = '0x';

const ENABLED_FLAG = { enabled: true, minimumVersion: '0.0.1' };

const deriveMoneyAccountAddressMock = jest.mocked(deriveMoneyAccountAddress);

/**
 * Build a messenger that answers the actions the service calls, and records the
 * `KeyringController:unlock` subscriber so a test can fire it.
 *
 * @param options - Options.
 * @param options.moneyFlag - The raw `moneyEnableMoneyAccount` flag value.
 * @param options.getCode - The `eth_getCode` handler.
 * @returns The messenger, its mocks, and a way to publish an unlock.
 */
function createMockMessenger({
  moneyFlag = ENABLED_FLAG as unknown,
  getCode = jest.fn(async () => DELEGATED_CODE as unknown),
}: {
  moneyFlag?: unknown;
  getCode?: jest.Mock;
} = {}) {
  const request = jest.fn(
    async ({ method, params }: { method: string; params: unknown[] }) => {
      if (method !== 'eth_getCode') {
        throw new Error(`Unexpected RPC method: ${method}`);
      }
      return await getCode(params);
    },
  );

  const call = jest.fn((action: string, ...args: unknown[]) => {
    switch (action) {
      case 'RemoteFeatureFlagController:getState':
        return {
          remoteFeatureFlags: {
            [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: moneyFlag,
          },
        };
      case 'NetworkController:findNetworkClientIdByChainId':
        if (args[0] !== CHAIN_IDS.MONAD) {
          throw new Error(`Unexpected chain id: ${String(args[0])}`);
        }
        return MONAD_NETWORK_CLIENT_ID;
      case 'NetworkController:getNetworkClientById':
        if (args[0] !== MONAD_NETWORK_CLIENT_ID) {
          throw new Error(`Unexpected network client: ${String(args[0])}`);
        }
        return { provider: { request } };
      default:
        throw new Error(`Unexpected action: ${action}`);
    }
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
    subscribe,
    request,
    getCode,
    publishUnlock: () => subscribers.forEach((handler) => handler()),
  };
}

describe('MoneyAccountAvailabilityService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    deriveMoneyAccountAddressMock.mockResolvedValue(MONEY_ADDRESS);
  });

  it('is available when the flag is on and the derived address is delegated', async () => {
    const { messenger } = createMockMessenger();

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });
  });

  it('is unavailable when the address has no delegation', async () => {
    const { messenger } = createMockMessenger({
      getCode: jest.fn(async () => EMPTY_CODE),
    });

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
  });

  it('is unavailable when the code is delegation-length but not a delegation', async () => {
    const { messenger } = createMockMessenger({
      // A 48-character contract code that does not start with the prefix.
      getCode: jest.fn(async () => `0x60806040${'ab'.repeat(20)}`),
    });

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
  });

  it('is unavailable with the flag off, without reading the chain or the seed', async () => {
    const { messenger, request } = createMockMessenger({
      moneyFlag: { enabled: false, minimumVersion: '0.0.1' },
    });

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
    expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('is unavailable when the flag is unserved, even though the address is delegated', async () => {
    const { messenger } = createMockMessenger({ moneyFlag: null });

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
  });

  it('is unavailable when the wallet is locked, so the address cannot be derived', async () => {
    deriveMoneyAccountAddressMock.mockRejectedValue(
      new Error('KeyringController - Cannot unlock without a previous vault.'),
    );
    const { messenger, request } = createMockMessenger();

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
    expect(request).not.toHaveBeenCalled();
  });

  it('is unavailable when Monad has no network client', async () => {
    const { messenger, call } = createMockMessenger();
    call.mockImplementation((action: string) => {
      if (action === 'RemoteFeatureFlagController:getState') {
        return {
          remoteFeatureFlags: {
            [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: ENABLED_FLAG,
          },
        };
      }
      throw new Error('No network client found for chain id 0x8f');
    });

    const availability = await new MoneyAccountAvailabilityService({
      messenger,
    }).getAvailability();

    expect(availability).toStrictEqual({ isAvailable: false });
  });

  describe('caching', () => {
    it('reads the chain once across repeated calls', async () => {
      const { messenger, request } = createMockMessenger();
      const service = new MoneyAccountAvailabilityService({ messenger });

      const first = await service.getAvailability();
      const second = await service.getAvailability();
      const third = await service.getAvailability();

      expect(first).toStrictEqual({
        isAvailable: true,
        address: MONEY_ADDRESS,
      });
      expect(second).toStrictEqual(first);
      expect(third).toStrictEqual(first);
      expect(request).toHaveBeenCalledTimes(1);
      expect(deriveMoneyAccountAddressMock).toHaveBeenCalledTimes(1);
    });

    it('shares one in-flight read between concurrent callers', async () => {
      const { messenger, request } = createMockMessenger();
      const service = new MoneyAccountAvailabilityService({ messenger });

      await Promise.all([
        service.getAvailability(),
        service.getAvailability(),
        service.getAvailability(),
      ]);

      expect(request).toHaveBeenCalledTimes(1);
    });

    it('caches the unavailable answer too, so a hidden surface costs one read', async () => {
      const { messenger, request } = createMockMessenger({
        getCode: jest.fn(async () => EMPTY_CODE),
      });
      const service = new MoneyAccountAvailabilityService({ messenger });

      await service.getAvailability();
      await service.getAvailability();

      expect(request).toHaveBeenCalledTimes(1);
    });

    it('re-reads after an unlock, so an upgrade done elsewhere is picked up', async () => {
      const getCode = jest
        .fn()
        .mockResolvedValueOnce(EMPTY_CODE)
        .mockResolvedValueOnce(DELEGATED_CODE);
      const { messenger, request, publishUnlock } = createMockMessenger({
        getCode,
      });
      const service = new MoneyAccountAvailabilityService({ messenger });

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: false,
      });

      publishUnlock();

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: true,
        address: MONEY_ADDRESS,
      });
      expect(request).toHaveBeenCalledTimes(2);
    });

    it('does not cache a failed read', async () => {
      const getCode = jest
        .fn()
        .mockRejectedValueOnce(new Error('network request failed'))
        .mockResolvedValueOnce(DELEGATED_CODE);
      const { messenger } = createMockMessenger({ getCode });
      const service = new MoneyAccountAvailabilityService({ messenger });

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: false,
      });
      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: true,
        address: MONEY_ADDRESS,
      });
    });

    it('re-reads the flag on every call, so it can be turned off mid-session', async () => {
      let moneyFlag: unknown = ENABLED_FLAG;
      const { call, request, subscribe } = createMockMessenger();
      const messenger = {
        call: jest.fn((action: string, ...args: unknown[]) => {
          if (action === 'RemoteFeatureFlagController:getState') {
            return {
              remoteFeatureFlags: {
                [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: moneyFlag,
              },
            };
          }
          return call(action, ...args);
        }),
        subscribe,
      } as unknown as MoneyAccountAvailabilityMessenger;
      const service = new MoneyAccountAvailabilityService({ messenger });

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: true,
        address: MONEY_ADDRESS,
      });

      moneyFlag = { enabled: false, minimumVersion: '0.0.1' };

      expect(await service.getAvailability()).toStrictEqual({
        isAvailable: false,
      });
      expect(request).toHaveBeenCalledTimes(1);
    });
  });
});
