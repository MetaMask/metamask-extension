import type { Hex } from '@metamask/utils';
import type { MoneyPayMessenger } from './pay-context';

export const VAULT_CONFIG_MOCK = {
  chainId: '0x8f' as Hex,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae' as Hex,
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117' as Hex,
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B' as Hex,
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947' as Hex,
};

export const MONEY_ACCOUNT_ADDRESS_MOCK =
  '0xd5fe9b0579443e7025cf3309ba420977710e7183' as Hex;

export const NETWORK_CLIENT_ID_MOCK = 'monad-network-client';

/** `previewDeposit` return value served by the mock provider. */
export const PREVIEW_DEPOSIT_SHARES_MOCK = 5_000_000n;

/** `getRate` return value served by the mock provider (1 share = 1.25 mUSD). */
export const VAULT_RATE_MOCK = 1_250_000n;

function encodeUint256(value: bigint): string {
  return `0x${value.toString(16).padStart(64, '0')}`;
}

/**
 * An EIP-1193 provider stub answering exactly the reads the batch builders
 * perform: `previewDeposit` on the lens and `getRate` on the accountant, plus
 * the network detection call `Web3Provider` makes first.
 *
 * @param chainId - The chain id to report.
 * @returns The provider mock.
 */
export function createProviderMock(chainId: Hex = VAULT_CONFIG_MOCK.chainId) {
  return {
    request: jest.fn(async ({ method, params }) => {
      if (method === 'eth_chainId') {
        return chainId;
      }
      if (method === 'net_version') {
        return String(parseInt(chainId, 16));
      }
      if (method === 'eth_call') {
        const { to } = (params as [{ to: string }])[0];
        if (to.toLowerCase() === VAULT_CONFIG_MOCK.lensAddress.toLowerCase()) {
          return encodeUint256(PREVIEW_DEPOSIT_SHARES_MOCK);
        }
        if (
          to.toLowerCase() === VAULT_CONFIG_MOCK.accountantAddress.toLowerCase()
        ) {
          return encodeUint256(VAULT_RATE_MOCK);
        }
        throw new Error(`Unexpected eth_call target: ${to}`);
      }
      throw new Error(`Unexpected provider method: ${method}`);
    }),
  };
}

export type MessengerMockOptions = {
  /** Remote flags returned by `RemoteFeatureFlagController:getState`. */
  remoteFeatureFlags?: Record<string, unknown>;
  /** The money account, or undefined for "not created yet". */
  moneyAccountAddress?: Hex;
  /** Throw from `findNetworkClientIdByChainId` ("chain not configured"). */
  chainNotConfigured?: boolean;
  /** Extra handlers keyed by action type, merged over the defaults. */
  handlers?: Record<string, (...args: unknown[]) => unknown>;
};

/**
 * A `MoneyPayMessenger` whose `call` routes to per-action handlers. Defaults
 * describe the fully-available state; options carve out each unavailable
 * state a callback must guard.
 *
 * @param options - The options bag.
 * @returns The messenger mock and the provider mock it serves.
 */
export function createMoneyPayMessengerMock(
  options: MessengerMockOptions = {},
) {
  const provider = createProviderMock();

  const remoteFeatureFlags = options.remoteFeatureFlags ?? {
    moneyAccountVaultConfig: VAULT_CONFIG_MOCK,
  };

  const handlers: Record<string, (...args: unknown[]) => unknown> = {
    'RemoteFeatureFlagController:getState': () => ({ remoteFeatureFlags }),
    'MoneyAccountController:getMoneyAccount': () =>
      'moneyAccountAddress' in options && !options.moneyAccountAddress
        ? undefined
        : {
            address: options.moneyAccountAddress ?? MONEY_ACCOUNT_ADDRESS_MOCK,
          },
    'NetworkController:findNetworkClientIdByChainId': () => {
      if (options.chainNotConfigured) {
        throw new Error('No network client for chain');
      }
      return NETWORK_CLIENT_ID_MOCK;
    },
    'NetworkController:getNetworkClientById': () => ({ provider }),
    ...options.handlers,
  };

  const call = jest.fn((actionType: string, ...args: unknown[]) => {
    const handler = handlers[actionType];
    if (!handler) {
      throw new Error(`Unexpected messenger action: ${actionType}`);
    }
    return handler(...args);
  });

  return {
    messenger: { call } as unknown as MoneyPayMessenger,
    call,
    provider,
  };
}
