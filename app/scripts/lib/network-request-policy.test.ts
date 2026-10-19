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
    jest.replaceProperty(process, 'env', { ...process.env, IN_TEST: '' });
    updateSessionRules.mockReset().mockResolvedValue(undefined);
    await initializeNetworkRequestPolicy('a'.repeat(32), {
      updateSessionRules,
      RuleConditionKeys: { TOP_DOMAINS: 'topDomains' },
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('clears stale grants at startup', () => {
    expect(updateSessionRules).toHaveBeenCalledWith({
      removeRuleIds: [1000001, 1000011, 1000002, 1000003],
      addRules: [
        {
          id: 1000001,
          priority: 1,
          action: { type: 'block' },
          condition: {
            regexFilter: '^(https?|wss?)://',
            topDomains: ['a'.repeat(32)],
          },
        },
      ],
    });
  });

  it('uses only initiator-scoped rules when the native capability is absent', async () => {
    await initializeNetworkRequestPolicy('a'.repeat(32), {
      updateSessionRules,
    });
    expect(updateSessionRules.mock.lastCall[0]).toEqual({
      removeRuleIds: [1000001, 1000011, 1000002, 1000003],
      addRules: [],
    });
    await updateNetworkRequestDomains(['rpc.example']);
    expect(updateSessionRules.mock.lastCall[0].addRules).toEqual([
      {
        id: 1000002,
        priority: 2,
        action: { type: 'allow' },
        condition: {
          regexFilter: '^(https?|wss?)://',
          initiatorDomains: ['a'.repeat(32)],
          requestDomains: ['rpc.example'],
        },
      },
    ]);
    await updateNetworkRequestDomains('*');
    expect(updateSessionRules.mock.lastCall[0].addRules).toHaveLength(1);
    expect(
      updateSessionRules.mock.lastCall[0].addRules[0].condition.requestDomains,
    ).toBeUndefined();
    await updateNetworkRequestDomains([]);
    expect(updateSessionRules.mock.lastCall[0].addRules).toEqual([]);
  });

  it('allows localhost in top-frame rules only for test packages', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, IN_TEST: 'true' });
    await initializeNetworkRequestPolicy('a'.repeat(32), {
      updateSessionRules,
      RuleConditionKeys: { TOP_DOMAINS: 'topDomains' },
    });
    expect(updateSessionRules.mock.lastCall[0].addRules[1]).toEqual({
      id: 1000011,
      priority: 3,
      action: { type: 'allow' },
      condition: {
        regexFilter: '^(https?|wss?)://',
        topDomains: ['a'.repeat(32)],
        requestDomains: ['localhost'],
      },
    });
  });

  it('revokes stale grants and rejects startup when installing the frame guard fails', async () => {
    updateSessionRules.mockRejectedValueOnce(new Error('DNR failed'));
    await expect(
      initializeNetworkRequestPolicy('a'.repeat(32), {
        updateSessionRules,
        RuleConditionKeys: { TOP_DOMAINS: 'topDomains' },
      }),
    ).rejects.toThrow('DNR failed');
    expect(updateSessionRules.mock.lastCall[0]).toEqual({
      removeRuleIds: [1000002, 1000003],
    });
  });

  it.each([[], ['rpc.example'], '*'] as const)(
    'publishes %j with extension-only scopes',
    async (domains) => {
      await updateNetworkRequestDomains('*');
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
