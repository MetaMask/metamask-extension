import { it } from '@jest/globals';
import { RpcEndpointType } from '@metamask/network-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  initializeNetworkRequestPolicy,
  refreshNetworkRequestPolicy,
  setOnboardingNetworkDomains,
  updateNetworkRequestDomains,
} from './network-request-policy';

describe('network request policy', () => {
  const updateSessionRules = jest.fn().mockResolvedValue(undefined);
  beforeEach(async () => {
    updateSessionRules.mockReset().mockResolvedValue(undefined);
    await initializeNetworkRequestPolicy('a'.repeat(32), {
      updateSessionRules,
    });
  });

  it('clears stale grants at startup', () => {
    expect(updateSessionRules).toHaveBeenCalledWith({
      removeRuleIds: [1000002, 1000003],
      addRules: [],
    });
  });

  it.each([[], ['rpc.example'], '*'] as const)(
    'publishes %j with extension-only scopes',
    async (domains) => {
      await updateNetworkRequestDomains(domains === '*' ? '*' : [...domains]);
      const { addRules } = updateSessionRules.mock.lastCall[0];
      expect(addRules).toHaveLength(domains.length ? 2 : 0);
      if (addRules.length) {
        expect(addRules[0].condition.initiatorDomains).toEqual([
          'a'.repeat(32),
        ]);
        expect(addRules[1].condition.topDomains).toEqual(['a'.repeat(32)]);
        expect(addRules[0].condition.requestDomains).toEqual(
          domains === '*' ? undefined : domains,
        );
      }
    },
  );

  it('permits a selected onboarding path and revokes it on reset', async () => {
    await setOnboardingNetworkDomains(['auth.example']);
    expect(
      updateSessionRules.mock.lastCall[0].addRules[0].condition.requestDomains,
    ).toEqual(['auth.example']);
    await setOnboardingNetworkDomains([]);
    expect(updateSessionRules.mock.lastCall[0].addRules).toEqual([]);
  });

  it('restricts SRP privacy mode to saved RPC and failover domains', async () => {
    const preferences = {
      useExternalServices: false,
      preferences: { hasLinkedSocialLoginProfile: true },
    };
    await refreshNetworkRequestPolicy({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: preferences,
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Test',
            nativeCurrency: 'ETH',
            blockExplorerUrls: [],
            defaultRpcEndpointIndex: 0,
            rpcEndpoints: [
              {
                type: RpcEndpointType.Custom,
                networkClientId: 'test-rpc',
                url: 'https://rpc.example:8545/key',
                failoverUrls: ['https://fallback.example', 'invalid'],
              },
            ],
          },
        },
      },
    });
    expect(
      updateSessionRules.mock.lastCall[0].addRules[0].condition.requestDomains,
    ).toEqual(['fallback.example', 'rpc.example']);
    await refreshNetworkRequestPolicy({
      OnboardingController: { completedOnboarding: true },
      PreferencesController: { useExternalServices: false },
      NetworkController: { networkConfigurationsByChainId: {} },
    });
    expect(updateSessionRules.mock.lastCall[0].addRules).toEqual([]);
  });

  it.each([
    FirstTimeFlowType.create,
    FirstTimeFlowType.socialCreate,
    FirstTimeFlowType.socialImport,
  ])(
    'allows completed %s onboarding according to the chosen wallet flow',
    async (firstTimeFlowType) => {
      await refreshNetworkRequestPolicy({
        OnboardingController: { completedOnboarding: true, firstTimeFlowType },
        PreferencesController: {
          useExternalServices: firstTimeFlowType === FirstTimeFlowType.create,
        },
      });
      expect(
        updateSessionRules.mock.lastCall[0].addRules[0].condition
          .requestDomains,
      ).toBeUndefined();
    },
  );

  it('removes stale grants after failure and permits a retry', async () => {
    await updateNetworkRequestDomains('*');
    updateSessionRules.mockRejectedValueOnce(new Error('DNR failed'));
    await expect(updateNetworkRequestDomains(['rpc.example'])).rejects.toThrow(
      'DNR failed',
    );
    expect(updateSessionRules.mock.lastCall[0]).toEqual({
      removeRuleIds: [1000002, 1000003],
    });
    await updateNetworkRequestDomains(['rpc.example']);
    expect(
      updateSessionRules.mock.lastCall[0].addRules[0].condition.requestDomains,
    ).toEqual(['rpc.example']);
  });
});
