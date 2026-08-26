import { CHAIN_IDS } from '../../../../shared/constants/chain-ids';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import type { MoneyAccountVaultConfig } from '../../../../shared/lib/money/vault-config';
import {
  createMoneyChainConfigurator,
  type MoneyChainConfigMessenger,
} from './money-chain-config';

const VAULT_CONFIG = {
  chainId: CHAIN_IDS.MONAD,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
} as MoneyAccountVaultConfig;

const MONAD_NETWORK_CONFIGURATION = FEATURED_RPCS.find(
  ({ chainId }) => chainId === CHAIN_IDS.MONAD,
);

function createConfigurator({
  networkConfigured = false,
  addNetwork = jest.fn().mockResolvedValue(MONAD_NETWORK_CONFIGURATION),
}: {
  networkConfigured?: boolean;
  addNetwork?: jest.Mock;
} = {}) {
  const call = jest.fn((action: string, ...args: unknown[]) => {
    if (action === 'NetworkController:getState') {
      return {
        networkConfigurationsByChainId: networkConfigured
          ? { [CHAIN_IDS.MONAD]: MONAD_NETWORK_CONFIGURATION }
          : {},
      };
    }
    if (action === 'LegacyBackgroundApiService:addNetwork') {
      return addNetwork(...args);
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  const messenger = { call } as unknown as MoneyChainConfigMessenger;

  return {
    ensureMoneyChainConfigured: createMoneyChainConfigurator(messenger),
    addNetwork,
  };
}

describe('createMoneyChainConfigurator', () => {
  it('adds the chain without making it active when it is not configured', async () => {
    const { ensureMoneyChainConfigured, addNetwork } = createConfigurator();

    await ensureMoneyChainConfigured(VAULT_CONFIG);

    expect(MONAD_NETWORK_CONFIGURATION).toBeDefined();
    expect(addNetwork).toHaveBeenCalledWith(MONAD_NETWORK_CONFIGURATION, {
      setActive: false,
    });
  });

  it('does not add a duplicate when the chain is configured', async () => {
    const { ensureMoneyChainConfigured, addNetwork } = createConfigurator({
      networkConfigured: true,
    });

    await ensureMoneyChainConfigured(VAULT_CONFIG);

    expect(addNetwork).not.toHaveBeenCalled();
  });

  it('throws when the chain is not a featured network', async () => {
    const { ensureMoneyChainConfigured, addNetwork } = createConfigurator();

    await expect(
      ensureMoneyChainConfigured({ ...VAULT_CONFIG, chainId: '0x539' }),
    ).rejects.toThrow('Money Account chain 0x539 is not a featured network');
    expect(addNetwork).not.toHaveBeenCalled();
  });

  it('shares one in-flight configuration between concurrent callers', async () => {
    let resolveAddNetwork: (value?: unknown) => void = () => undefined;
    const addNetwork = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAddNetwork = resolve;
        }),
    );
    const { ensureMoneyChainConfigured } = createConfigurator({ addNetwork });

    const first = ensureMoneyChainConfigured(VAULT_CONFIG);
    const second = ensureMoneyChainConfigured(VAULT_CONFIG);
    resolveAddNetwork();
    await Promise.all([first, second]);

    expect(addNetwork).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failure, so the next call retries', async () => {
    const addNetwork = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(MONAD_NETWORK_CONFIGURATION);
    const { ensureMoneyChainConfigured } = createConfigurator({ addNetwork });

    await expect(ensureMoneyChainConfigured(VAULT_CONFIG)).rejects.toThrow(
      'offline',
    );
    await ensureMoneyChainConfigured(VAULT_CONFIG);

    expect(addNetwork).toHaveBeenCalledTimes(2);
  });
});
