import { it } from '@jest/globals';
import {
  getDefaultNetworkControllerState,
  RpcEndpointType,
  type NetworkState,
} from '@metamask/network-controller';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../shared/constants/onboarding';
import type { NetworkPolicy } from '../../../shared/lib/network-policy';
import {
  deriveNetworkPolicy,
  initializeNetworkPolicy,
  type NetworkPolicyState,
} from './initialize-network-policy';

function createPrivacyState(): NetworkPolicyState &
  Record<
    'NetworkController',
    Pick<NetworkState, 'networkConfigurationsByChainId'>
  > {
  return {
    OnboardingController: {
      completedOnboarding: true,
      firstTimeFlowType: FirstTimeFlowType.create,
    },
    PreferencesController: { useExternalServices: false },
    NetworkController: {
      networkConfigurationsByChainId: {
        '0x123': {
          chainId: '0x123',
          name: 'Saved network',
          nativeCurrency: 'ETH',
          defaultRpcEndpointIndex: 0,
          blockExplorerUrls: [],
          rpcEndpoints: [
            {
              type: RpcEndpointType.Custom,
              networkClientId: 'saved',
              url: 'https://rpc.example/api?key=secret',
            },
          ],
        },
      },
    },
  };
}

function setup(state: NetworkPolicyState = createPrivacyState()) {
  const subscribe = jest.fn();
  const updateNetworkPolicy = jest.fn<Promise<void>, [NetworkPolicy]>(() =>
    Promise.resolve(),
  );
  const onError = jest.fn();
  const policy = initializeNetworkPolicy({
    messenger: { subscribe },
    state,
    infuraProjectId: 'project-id',
    updateNetworkPolicy,
    onError,
  });
  const publish = (eventName: string, next: object) => {
    const subscription = subscribe.mock.calls.find(
      ([name]) => name === eventName,
    );
    if (!subscription) {
      throw new Error(`No subscription for ${eventName}`);
    }
    subscription[1](next, []);
  };
  return {
    policy,
    publish,
    subscribe,
    updateNetworkPolicy,
    onError,
  };
}

describe('deriveNetworkPolicy', () => {
  it('blocks requests before onboarding', () => {
    expect(deriveNetworkPolicy({ state: {} })).toStrictEqual({
      mode: 'blocked',
      allowedDomains: [],
      allowedRpcUrls: [],
    });
  });

  it('does not restore an onboarding grant from a saved social flow', () => {
    const state = createPrivacyState();
    state.OnboardingController = {
      completedOnboarding: false,
      firstTimeFlowType: FirstTimeFlowType.socialImport,
    };

    expect(deriveNetworkPolicy({ state }).mode).toBe('blocked');
  });

  it('allows post-onboarding requests when Basic Functionality is enabled', () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };

    expect(deriveNetworkPolicy({ state })).toStrictEqual({
      mode: 'allow-all',
      allowedDomains: [],
      allowedRpcUrls: [],
    });
  });

  it('restores a configured domain allowlist after onboarding', () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };
    state.NetworkPolicyController = {
      postOnboardingNetworkDomains: ['API.Example', 'rpc.example'],
    };

    expect(deriveNetworkPolicy({ state })).toStrictEqual({
      mode: 'allowlist',
      allowedDomains: ['api.example', 'rpc.example'],
      allowedRpcUrls: [],
    });
  });

  it('rejects a malformed null policy before granting startup network access', () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };
    state.NetworkPolicyController = {
      postOnboardingNetworkDomains: null,
    } as unknown as NonNullable<NetworkPolicyState['NetworkPolicyController']>;

    expect(() => deriveNetworkPolicy({ state })).toThrow(
      'Invalid network policy',
    );
  });

  it.each([
    { persistedPolicy: null },
    { persistedPolicy: [] },
    { persistedPolicy: false },
    { persistedPolicy: '*' },
  ])(
    'rejects malformed persisted controller state before startup grants (%j)',
    ({ persistedPolicy }) => {
      const state = createPrivacyState();
      state.PreferencesController = { useExternalServices: true };
      state.NetworkPolicyController =
        persistedPolicy as unknown as NetworkPolicyState['NetworkPolicyController'];

      expect(() => deriveNetworkPolicy({ state })).toThrow(
        'Invalid network policy controller state',
      );
    },
  );

  it('keeps SRP privacy mode limited to saved RPCs despite wildcard configuration', () => {
    const state = createPrivacyState();
    state.NetworkPolicyController = { postOnboardingNetworkDomains: '*' };

    expect(deriveNetworkPolicy({ state })).toStrictEqual({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://rpc.example/api?key=secret'],
    });
  });

  it.each([FirstTimeFlowType.socialCreate, FirstTimeFlowType.socialImport])(
    'preserves social wallet connectivity for %s',
    (firstTimeFlowType) => {
      const state = createPrivacyState();
      state.OnboardingController = {
        completedOnboarding: true,
        firstTimeFlowType,
      };

      expect(deriveNetworkPolicy({ state }).mode).toBe('allow-all');
    },
  );

  it('keeps unknown onboarding history restricted despite residual social authentication', () => {
    const state = createPrivacyState();
    state.OnboardingController = { completedOnboarding: true };
    state.SeedlessOnboardingController = {
      authConnection: AuthConnection.Google,
    };

    expect(deriveNetworkPolicy({ state })).toStrictEqual({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://rpc.example/api?key=secret'],
    });
  });

  it('keeps linked SRP wallets restricted to saved endpoints', () => {
    const state = createPrivacyState();
    state.PreferencesController = {
      useExternalServices: false,
      preferences: { hasLinkedSocialLoginProfile: true },
    };
    state.SeedlessOnboardingController = {
      authConnection: AuthConnection.Google,
    };

    expect(deriveNetworkPolicy({ state })).toStrictEqual({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://rpc.example/api?key=secret'],
    });
  });

  it('includes saved fallback URLs without adding build-time failovers', () => {
    const state = createPrivacyState();
    const endpoint =
      state.NetworkController.networkConfigurationsByChainId['0x123']
        .rpcEndpoints[0];
    endpoint.failoverUrls = ['https://saved-fallback.example/rpc'];
    const previousQuicknode = process.env.QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_MAINNET_URL =
      'https://automatic-failover.example/rpc';

    try {
      expect(deriveNetworkPolicy({ state }).allowedRpcUrls).toStrictEqual([
        'https://rpc.example/api?key=secret',
        'https://saved-fallback.example/rpc',
      ]);
    } finally {
      if (previousQuicknode === undefined) {
        delete process.env.QUICKNODE_MAINNET_URL;
      } else {
        process.env.QUICKNODE_MAINNET_URL = previousQuicknode;
      }
    }
  });

  it('fills Infura project IDs using the NetworkController configuration', () => {
    const state = createPrivacyState();
    state.NetworkController = getDefaultNetworkControllerState();

    const policy = deriveNetworkPolicy({ state, infuraProjectId: 'saved-id' });

    expect(policy.allowedRpcUrls).toContain(
      'https://mainnet.infura.io/v3/saved-id',
    );
    expect(policy.allowedRpcUrls.some((url) => url.includes('{'))).toBe(false);
  });

  it('does not authorize Infura URLs without a project ID', () => {
    const state = createPrivacyState();
    state.NetworkController = getDefaultNetworkControllerState();

    const policy = deriveNetworkPolicy({ state });

    expect(policy.allowedRpcUrls.some((url) => url.includes('infura.io'))).toBe(
      false,
    );
  });

  it('drops invalid saved URLs while preserving exact paths and queries', () => {
    const state = createPrivacyState();
    const endpoint =
      state.NetworkController.networkConfigurationsByChainId['0x123']
        .rpcEndpoints[0];
    endpoint.url =
      'https://user:password@rpc.example:443/api?key=secret#section';
    endpoint.failoverUrls = ['not a URL', 'ftp://invalid.example/rpc'];

    expect(deriveNetworkPolicy({ state }).allowedRpcUrls).toStrictEqual([
      'https://rpc.example/api?key=secret',
    ]);
  });
});

describe('initializeNetworkPolicy', () => {
  it('registers listeners without replacing the already restored policy', () => {
    const { subscribe, updateNetworkPolicy } = setup();

    expect(subscribe).toHaveBeenCalledTimes(4);
    expect(updateNetworkPolicy).not.toHaveBeenCalled();
  });

  it('applies controller changes before acknowledgement resolves', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();
    let finishUpdate: () => void = () => undefined;
    updateNetworkPolicy.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishUpdate = resolve;
        }),
    );
    publish('PreferencesController:stateChange', {
      useExternalServices: true,
    });
    const acknowledged = jest.fn();
    const settled = policy.runWithPolicy(() => undefined).then(acknowledged);

    await Promise.resolve();
    expect(acknowledged).not.toHaveBeenCalled();
    finishUpdate();
    await settled;
    expect(acknowledged).toHaveBeenCalledTimes(1);
  });

  it('updates saved endpoints when network configuration changes', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();
    const networkState = createPrivacyState().NetworkController;
    networkState.networkConfigurationsByChainId['0x123'].rpcEndpoints[0].url =
      'https://new-rpc.example/rpc';

    publish('NetworkController:stateChange', networkState);
    await policy.runWithPolicy(() => undefined);

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://new-rpc.example/rpc'],
    });
  });

  it('applies trusted domain configuration updates while the extension is running', async () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };
    const { policy, publish, updateNetworkPolicy } = setup(state);

    publish('NetworkPolicyController:stateChange', {
      postOnboardingNetworkDomains: ['approved.example'],
    });
    await policy.runWithPolicy(() => undefined);

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'allowlist',
      allowedDomains: ['approved.example'],
      allowedRpcUrls: [],
    });
  });

  it('preserves SRP privacy restrictions while changing the configured domains', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();

    await policy.runWithPolicy(
      () => {
        publish('NetworkPolicyController:stateChange', {
          postOnboardingNetworkDomains: '*',
        });
      },
      { NetworkPolicyController: { postOnboardingNetworkDomains: '*' } },
    );

    expect(
      updateNetworkPolicy.mock.calls.map(([snapshot]) => snapshot),
    ).toStrictEqual([
      {
        mode: 'allowlist',
        allowedDomains: [],
        allowedRpcUrls: ['https://rpc.example/api?key=secret'],
      },
      {
        mode: 'allowlist',
        allowedDomains: [],
        allowedRpcUrls: ['https://rpc.example/api?key=secret'],
      },
    ]);
  });

  it('restores a blocked policy when onboarding is reset', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();

    publish('OnboardingController:stateChange', {
      completedOnboarding: false,
      firstTimeFlowType: null,
    });
    await policy.runWithPolicy(() => undefined);

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'blocked',
      allowedDomains: [],
      allowedRpcUrls: [],
    });
  });

  it('applies a prospective preference before its controller mutation', async () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };
    const { policy, updateNetworkPolicy } = setup(state);

    await policy.runWithPolicy(
      () => {
        expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
          mode: 'allowlist',
          allowedDomains: [],
          allowedRpcUrls: ['https://rpc.example/api?key=secret'],
        });
      },
      {
        PreferencesController: { useExternalServices: false },
      },
    );
  });

  it('restores the actual policy after a failed controller mutation', async () => {
    const { policy, updateNetworkPolicy } = setup();

    await expect(
      policy.runWithPolicy(
        () => {
          throw new Error('Controller rejected the change');
        },
        { PreferencesController: { useExternalServices: true } },
      ),
    ).rejects.toThrow('Controller rejected the change');

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://rpc.example/api?key=secret'],
    });
  });

  it('does not grant a new RPC until its controller mutation succeeds', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();
    const next = createPrivacyState().NetworkController;
    next.networkConfigurationsByChainId['0x123'].rpcEndpoints[0].url =
      'https://new-rpc.example/rpc';

    await policy.runWithPolicy(
      () => {
        expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
          mode: 'allowlist',
          allowedDomains: [],
          allowedRpcUrls: [],
        });
        publish('NetworkController:stateChange', next);
      },
      { NetworkController: next },
    );

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'allowlist',
      allowedDomains: [],
      allowedRpcUrls: ['https://new-rpc.example/rpc'],
    });
  });

  it('never publishes a prospective wildcard when its mutation fails', async () => {
    const { policy, updateNetworkPolicy } = setup();

    await expect(
      policy.runWithPolicy(
        () => {
          throw new Error('Save failed');
        },
        { PreferencesController: { useExternalServices: true } },
      ),
    ).rejects.toThrow('Save failed');

    expect(
      updateNetworkPolicy.mock.calls.every(
        ([snapshot]) =>
          snapshot.mode === 'allowlist' &&
          snapshot.allowedRpcUrls.includes(
            'https://rpc.example/api?key=secret',
          ),
      ),
    ).toBe(true);
  });

  it('keeps only shared domains authorized until a domain change commits', async () => {
    const state = createPrivacyState();
    state.PreferencesController = { useExternalServices: true };
    const { policy, publish, updateNetworkPolicy } = setup({
      ...state,
      NetworkPolicyController: {
        postOnboardingNetworkDomains: ['kept.example', 'old.example'],
      },
    });
    const next = {
      postOnboardingNetworkDomains: ['kept.example', 'new.example'],
    };

    await policy.runWithPolicy(
      () => {
        expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
          mode: 'allowlist',
          allowedDomains: ['kept.example'],
          allowedRpcUrls: [],
        });
        publish('NetworkPolicyController:stateChange', next);
      },
      { NetworkPolicyController: next },
    );

    expect(updateNetworkPolicy).toHaveBeenLastCalledWith({
      mode: 'allowlist',
      allowedDomains: ['kept.example', 'new.example'],
      allowedRpcUrls: [],
    });
  });

  it('reports enforcement failures without acknowledging a successful change', async () => {
    const { policy, publish, updateNetworkPolicy, onError } = setup();
    const error = new Error('Browser rejected rule update');
    updateNetworkPolicy.mockRejectedValueOnce(error);

    publish('PreferencesController:stateChange', { useExternalServices: true });

    await expect(policy.runWithPolicy(() => undefined)).rejects.toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('does not rewrite rules for unrelated preference changes', () => {
    const { publish, updateNetworkPolicy } = setup();

    publish('PreferencesController:stateChange', {
      useExternalServices: false,
      preferences: { hasLinkedSocialLoginProfile: true },
    });

    expect(updateNetworkPolicy).not.toHaveBeenCalled();
  });

  it('keeps resetWallet intermediate preferences behind the blocked policy', async () => {
    const { policy, publish, updateNetworkPolicy } = setup();

    await policy.runWithPolicy(
      () => {
        publish('PreferencesController:stateChange', {
          useExternalServices: true,
        });
        publish('OnboardingController:stateChange', {
          completedOnboarding: false,
          firstTimeFlowType: null,
        });
      },
      { OnboardingController: { completedOnboarding: false } },
    );

    expect(
      updateNetworkPolicy.mock.calls.map(([snapshot]) => snapshot.mode),
    ).toStrictEqual(['blocked', 'blocked']);
  });

  it('does not mutate controllers when the browser rejects prospective restrictions', async () => {
    const { policy, updateNetworkPolicy } = setup();
    const operation = jest.fn();
    updateNetworkPolicy.mockRejectedValueOnce(new Error('Rule update failed'));

    await expect(
      policy.runWithPolicy(operation, {
        OnboardingController: { completedOnboarding: false },
      }),
    ).rejects.toThrow('Rule update failed');

    expect(operation).not.toHaveBeenCalled();
  });
});
