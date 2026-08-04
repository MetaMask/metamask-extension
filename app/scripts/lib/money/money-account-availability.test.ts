import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';
import { MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME } from '../../../../shared/lib/money/vault-config';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountAvailabilityService,
  type MoneyAccountAvailabilityMessenger,
} from './money-account-availability';

jest.mock('./get-money-account-address');

const MONEY_ADDRESS = '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;
const MONAD_NETWORK_CLIENT_ID = 'monad-mainnet';
const LINEA_NETWORK_CLIENT_ID = 'linea-mainnet';

/** The network clients the mock `NetworkController` knows about, by chain id. */
const NETWORK_CLIENT_IDS: Record<string, string> = {
  [CHAIN_IDS.MONAD]: MONAD_NETWORK_CLIENT_ID,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_NETWORK_CLIENT_ID,
};
const DELEGATION_TARGET = '1111111111111111111111111111111111111111';

/** The code of an EOA delegated to `DELEGATION_TARGET`. */
const DELEGATED_CODE = `0xef0100${DELEGATION_TARGET}`;

/** The code of an EOA with no delegation. */
const EMPTY_CODE = '0x';

const ENABLED_FLAG = { enabled: true, minimumVersion: '0.0.1' };

/**
 * A well-formed vault config naming Monad, as the flag serves it today. The gate
 * reads only `chainId`; the addresses are here because the parser rejects a
 * config missing any of them.
 */
const MONAD_VAULT_CONFIG = {
  chainId: CHAIN_IDS.MONAD,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
};

const deriveMoneyAccountAddressMock = jest.mocked(deriveMoneyAccountAddress);

/**
 * Build a messenger that answers the actions the service calls, and records the
 * `KeyringController:unlock` subscriber so a test can fire it.
 *
 * @param options - Options.
 * @param options.moneyFlag - The raw `moneyEnableMoneyAccount` flag value.
 * @param options.vaultConfig - The raw `moneyAccountVaultConfig` flag value.
 * Omit the key entirely to model an unserved flag; passing `undefined`
 * explicitly would take the default.
 * @param options.getCode - The `eth_getCode` handler.
 * @returns The messenger, its mocks, and a way to publish an unlock.
 */
function createMockMessenger(
  options: {
    moneyFlag?: unknown;
    vaultConfig?: unknown;
    getCode?: jest.Mock;
  } = {},
) {
  const {
    moneyFlag = ENABLED_FLAG as unknown,
    getCode = jest.fn(async () => DELEGATED_CODE as unknown),
  } = options;
  const vaultConfig =
    'vaultConfig' in options ? options.vaultConfig : MONAD_VAULT_CONFIG;
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
            [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: vaultConfig,
          },
        };
      case 'NetworkController:findNetworkClientIdByChainId': {
        const clientId = NETWORK_CLIENT_IDS[String(args[0])];
        if (!clientId) {
          throw new Error(
            `No network client found for chain id ${String(args[0])}`,
          );
        }
        return clientId;
      }
      case 'NetworkController:getNetworkClientById':
        if (!Object.values(NETWORK_CLIENT_IDS).includes(String(args[0]))) {
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
            [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: MONAD_VAULT_CONFIG,
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

  describe('the vault config', () => {
    it('is unavailable when the vault config is unserved, without reading the seed or the chain', async () => {
      const { messenger, request } = createMockMessenger({
        vaultConfig: undefined,
      });

      const availability = await new MoneyAccountAvailabilityService({
        messenger,
      }).getAvailability();

      // No fallback to a hardcoded Monad: without a config there is no chain
      // this client agrees with the balance service about.
      expect(availability).toStrictEqual({ isAvailable: false });
      expect(deriveMoneyAccountAddressMock).not.toHaveBeenCalled();
      expect(request).not.toHaveBeenCalled();
    });

    const MALFORMED_CONFIGS: [string, unknown][] = [
      ['is not an object', 'monad'],
      ['has a non-hex chain id', { ...MONAD_VAULT_CONFIG, chainId: 'monad' }],
      ['has no chain id', { ...MONAD_VAULT_CONFIG, chainId: undefined }],
      [
        'has a truncated address',
        { ...MONAD_VAULT_CONFIG, lensAddress: '0xA816ECd922de94c' },
      ],
      ['is missing its addresses', { chainId: CHAIN_IDS.MONAD }],
    ];

    for (const [description, vaultConfig] of MALFORMED_CONFIGS) {
      it(`is unavailable when the vault config ${description}`, async () => {
        const { messenger, request } = createMockMessenger({ vaultConfig });

        const availability = await new MoneyAccountAvailabilityService({
          messenger,
        }).getAvailability();

        expect(availability).toStrictEqual({ isAvailable: false });
        expect(request).not.toHaveBeenCalled();
      });
    }

    it('honours a config naming a chain other than Monad', async () => {
      const { messenger, call } = createMockMessenger({
        vaultConfig: {
          ...MONAD_VAULT_CONFIG,
          chainId: CHAIN_IDS.LINEA_MAINNET,
        },
      });

      const availability = await new MoneyAccountAvailabilityService({
        messenger,
      }).getAvailability();

      expect(availability).toStrictEqual({
        isAvailable: true,
        address: MONEY_ADDRESS,
      });
      expect(call).toHaveBeenCalledWith(
        'NetworkController:findNetworkClientIdByChainId',
        CHAIN_IDS.LINEA_MAINNET,
      );
      expect(call).toHaveBeenCalledWith(
        'NetworkController:getNetworkClientById',
        LINEA_NETWORK_CLIENT_ID,
      );
      expect(call).not.toHaveBeenCalledWith(
        'NetworkController:findNetworkClientIdByChainId',
        CHAIN_IDS.MONAD,
      );
    });

    it('re-reads the delegation when the config changes chain', async () => {
      let vaultConfig: unknown = MONAD_VAULT_CONFIG;
      const { call, request, subscribe } = createMockMessenger();
      const messenger = {
        call: jest.fn((action: string, ...args: unknown[]) => {
          if (action === 'RemoteFeatureFlagController:getState') {
            return {
              remoteFeatureFlags: {
                [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: ENABLED_FLAG,
                [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: vaultConfig,
              },
            };
          }
          return call(action, ...args);
        }),
        subscribe,
      } as unknown as MoneyAccountAvailabilityMessenger;
      const service = new MoneyAccountAvailabilityService({ messenger });

      await service.getAvailability();
      vaultConfig = {
        ...MONAD_VAULT_CONFIG,
        chainId: CHAIN_IDS.LINEA_MAINNET,
      };
      await service.getAvailability();

      // The cached answer was read on the old chain, so it cannot stand in for
      // the new one.
      expect(request).toHaveBeenCalledTimes(2);
      expect(messenger.call).toHaveBeenCalledWith(
        'NetworkController:findNetworkClientIdByChainId',
        CHAIN_IDS.LINEA_MAINNET,
      );
    });
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
                [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: MONAD_VAULT_CONFIG,
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
