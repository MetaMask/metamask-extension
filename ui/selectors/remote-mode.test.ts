import { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import type { Json } from '@metamask/utils';
import type { DelegationEntry } from '@metamask/delegation-controller';
import {
  getIsRemoteModeEnabled,
  getEIP7702ContractAddresses,
  getRemoteModeConfig,
  getRemoteModeDelegationEntries,
  RemoteModeState,
} from './remote-mode';

function getMockState(vaultRemoteMode?: boolean): RemoteModeState {
  const featureFlags: FeatureFlags = {};
  if (vaultRemoteMode !== undefined) {
    featureFlags.vaultRemoteMode = vaultRemoteMode;
  }
  return {
    metamask: {
      remoteFeatureFlags: featureFlags,
      delegations: {},
    },
  };
}

describe('Remote Mode Selectors', () => {
  describe('#getIsRemoteModeEnabled', () => {
    it('returns true if the vaultRemoteMode flag is enabled', () => {
      expect(getIsRemoteModeEnabled(getMockState(true))).toStrictEqual(true);
    });

    it('returns false if the vaultRemoteMode flag is disabled', () => {
      expect(getIsRemoteModeEnabled(getMockState(false))).toStrictEqual(false);
    });

    it('returns false if the vaultRemoteMode flag is not present', () => {
      expect(getIsRemoteModeEnabled(getMockState())).toStrictEqual(false);
    });
  });

  describe('#getEIP7702ContractAddresses', () => {
    function getMockStateWithFlag(flagValue: unknown): RemoteModeState {
      return {
        metamask: {
          remoteFeatureFlags: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            confirmations_eip_7702: flagValue as Json,
          },
          delegations: {},
        },
      };
    }

    it('returns the EIP7702 contract addresses if present', () => {
      const addresses = ['0x123', '0x456'];
      expect(
        getEIP7702ContractAddresses(getMockStateWithFlag(addresses)),
      ).toStrictEqual(addresses);
    });

    it('returns undefined if the flag is not present', () => {
      expect(
        getEIP7702ContractAddresses(getMockStateWithFlag(undefined)),
      ).toBeUndefined();
    });
  });

  describe('#getRemoteModeConfig', () => {
    const account = '0xabc' as `0x${string}`;
    const chainId = '0x1';
    const delegate = '0xdef' as `0x${string}`;
    const authority = '0xauth' as `0x${string}`;
    const delegation = {
      delegate,
      delegator: account,
      authority,
      caveats: [],
      salt: '0xsalt' as `0x${string}`,
      signature: '0xsig' as `0x${string}`,
    };

    type DelegationOptions = {
      vaultRemoteMode?: boolean;
      swapMeta?: object;
      dailyMeta?: object;
    };

    function getStateWithDelegations(options: DelegationOptions = {}) {
      const { vaultRemoteMode = true, swapMeta, dailyMeta } = options;
      const delegations: Record<string, unknown> = {};
      if (swapMeta) {
        delegations['0xswap'] = {
          tags: ['swap'],
          chainId,
          delegation,
          meta: JSON.stringify(swapMeta),
        };
      }
      if (dailyMeta) {
        delegations['0xdaily'] = {
          tags: ['daily-allowance'],
          chainId,
          delegation,
          meta: JSON.stringify(dailyMeta),
        };
      }
      return {
        metamask: {
          remoteFeatureFlags: { vaultRemoteMode },
          delegations,
        },
      };
    }

    it('returns null allowances if no delegations exist', () => {
      const state = getStateWithDelegations({ vaultRemoteMode: true });
      expect(getRemoteModeConfig(state, account, chainId)).toStrictEqual({
        swapAllowance: null,
        dailyAllowance: null,
      });
    });

    it('returns swapAllowance if swap delegation exists', () => {
      const swapMeta = { allowances: [{ from: 'ETH', to: 'USDC', amount: 1 }] };
      const state = getStateWithDelegations({ swapMeta });
      expect(getRemoteModeConfig(state, account, chainId)).toStrictEqual({
        swapAllowance: {
          allowances: swapMeta.allowances,
          delegation,
        },
        dailyAllowance: null,
      });
    });

    it('returns dailyAllowance if daily-allowance delegation exists', () => {
      const dailyMeta = {
        allowances: [{ tokenType: 'ETH', amount: 2, iconUrl: 'icon.png' }],
      };
      const state = getStateWithDelegations({ dailyMeta });
      expect(getRemoteModeConfig(state, account, chainId)).toStrictEqual({
        swapAllowance: null,
        dailyAllowance: {
          allowances: dailyMeta.allowances,
          delegation,
        },
      });
    });

    it('returns both allowances if both delegations exist', () => {
      const swapMeta = { allowances: [{ from: 'ETH', to: 'USDC', amount: 1 }] };
      const dailyMeta = {
        allowances: [{ tokenType: 'ETH', amount: 2, iconUrl: 'icon.png' }],
      };
      const state = getStateWithDelegations({ swapMeta, dailyMeta });
      expect(getRemoteModeConfig(state, account, chainId)).toStrictEqual({
        swapAllowance: {
          allowances: swapMeta.allowances,
          delegation,
        },
        dailyAllowance: {
          allowances: dailyMeta.allowances,
          delegation,
        },
      });
    });

    it('returns null allowances if vaultRemoteMode is false', () => {
      const swapMeta = { allowances: [{ from: 'ETH', to: 'USDC', amount: 1 }] };
      const dailyMeta = {
        allowances: [{ tokenType: 'ETH', amount: 2, iconUrl: 'icon.png' }],
      };
      const state = getStateWithDelegations({
        vaultRemoteMode: false,
        swapMeta,
        dailyMeta,
      });
      expect(getRemoteModeConfig(state, account, chainId)).toStrictEqual({
        swapAllowance: null,
        dailyAllowance: null,
      });
    });
  });

  describe('#getRemoteModeDelegationEntries', () => {
    const account = '0xabc' as `0x${string}`;
    const chainId = '0x1';
    const delegate = '0xdef' as `0x${string}`;
    const authority = '0xauth' as `0x${string}`;
    const delegation = {
      delegate,
      delegator: account,
      authority,
      caveats: [],
      salt: '0xsalt' as `0x${string}`,
      signature: '0xsig' as `0x${string}`,
    };

    type DelegationOptions = {
      vaultRemoteMode?: boolean;
      swap?: boolean;
      daily?: boolean;
    };

    function getStateWithDelegations(options: DelegationOptions = {}) {
      const { vaultRemoteMode = true, swap = false, daily = false } = options;
      const delegations: { [key: `0x${string}`]: DelegationEntry } = {};
      if (swap) {
        delegations['0xswap'] = {
          tags: ['swap'],
          chainId,
          delegation,
          meta: '{}',
        };
      }
      if (daily) {
        delegations['0xdaily'] = {
          tags: ['daily-allowance'],
          chainId,
          delegation,
          meta: '{}',
        };
      }
      return {
        metamask: {
          remoteFeatureFlags: { vaultRemoteMode },
          delegations,
        },
      };
    }

    it('returns null entries if vaultRemoteMode is false', () => {
      const state = getStateWithDelegations({
        vaultRemoteMode: false,
        swap: true,
        daily: true,
      });
      expect(
        getRemoteModeDelegationEntries(state, account, chainId),
      ).toStrictEqual({
        swapDelegationEntry: null,
        dailyDelegationEntry: null,
      });
    });

    it('returns null entries if no delegations exist', () => {
      const state = getStateWithDelegations({ vaultRemoteMode: true });
      expect(
        getRemoteModeDelegationEntries(state, account, chainId),
      ).toStrictEqual({
        swapDelegationEntry: undefined,
        dailyDelegationEntry: undefined,
      });
    });

    it('returns only swap delegation if only swap exists', () => {
      const state = getStateWithDelegations({ swap: true });
      expect(
        getRemoteModeDelegationEntries(state, account, chainId),
      ).toStrictEqual({
        swapDelegationEntry: expect.objectContaining({ tags: ['swap'] }),
        dailyDelegationEntry: undefined,
      });
    });

    it('returns only daily delegation if only daily exists', () => {
      const state = getStateWithDelegations({ daily: true });
      expect(
        getRemoteModeDelegationEntries(state, account, chainId),
      ).toStrictEqual({
        swapDelegationEntry: undefined,
        dailyDelegationEntry: expect.objectContaining({
          tags: ['daily-allowance'],
        }),
      });
    });

    it('returns both delegations if both exist', () => {
      const state = getStateWithDelegations({ swap: true, daily: true });
      expect(
        getRemoteModeDelegationEntries(state, account, chainId),
      ).toStrictEqual({
        swapDelegationEntry: expect.objectContaining({ tags: ['swap'] }),
        dailyDelegationEntry: expect.objectContaining({
          tags: ['daily-allowance'],
        }),
      });
    });
  });
});
