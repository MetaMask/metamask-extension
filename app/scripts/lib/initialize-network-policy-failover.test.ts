import { RpcEndpointType } from '@metamask/network-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { initializeNetworkPolicyFailover } from './initialize-network-policy-failover';
import type { NetworkPolicyState } from './initialize-network-policy';

function setup({
  savedFailovers = [] as string[],
  clientFailovers = ['https://automatic-failover.example/rpc'],
  useExternalServices = false,
  mode = 'forced',
} = {}) {
  const state = {
    OnboardingController: {
      completedOnboarding: true,
      firstTimeFlowType: FirstTimeFlowType.create,
    },
    PreferencesController: { useExternalServices },
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
              networkClientId: 'primary',
              url: 'https://primary.example/rpc',
              failoverUrls: savedFailovers,
            },
          ],
        },
      },
    },
  } satisfies NetworkPolicyState;
  const subscribe = jest.fn();
  const call = jest.fn().mockReturnValue({
    remoteFeatureFlags: { corePlatformRpcFailoverMode: mode },
  });
  const setRpcFailoverMode = jest.fn();
  const networkController = {
    getNetworkClientRegistry: jest.fn().mockReturnValue({
      primary: {
        configuration: { failoverRpcUrls: clientFailovers },
        setRpcFailoverMode,
      },
    }),
  };

  initializeNetworkPolicyFailover({
    messenger: { call, subscribe },
    networkController,
    state,
  });

  const publish = (eventName: string, next: object) => {
    const listener = subscribe.mock.calls.find(([name]) => name === eventName);
    if (!listener) {
      throw new Error(`No subscription for ${eventName}`);
    }
    listener[1](next, []);
  };
  return { setRpcFailoverMode, publish, state };
}

describe('initializeNetworkPolicyFailover', () => {
  it('disables automatic failovers outside the saved privacy policy', () => {
    const { setRpcFailoverMode } = setup();

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('disabled');
  });

  it('preserves a failover that the saved RPC list permits', () => {
    const { setRpcFailoverMode } = setup({
      savedFailovers: ['https://saved-failover.example/rpc'],
      clientFailovers: ['https://saved-failover.example/rpc'],
    });

    expect(setRpcFailoverMode).not.toHaveBeenCalled();
  });

  it('restores configured failover after Basic Functionality is enabled', () => {
    const { publish, setRpcFailoverMode } = setup();

    publish('PreferencesController:stateChange', { useExternalServices: true });

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('forced');
  });

  it('overrides later feature-flag attempts to force unapproved destinations', () => {
    const { publish, setRpcFailoverMode } = setup({ mode: 'disabled' });

    publish('RemoteFeatureFlagController:stateChange', {
      remoteFeatureFlags: { corePlatformRpcFailoverMode: 'forced' },
    });

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('disabled');
  });

  it('does not recreate RPC clients for unrelated feature flag updates', () => {
    const { publish, setRpcFailoverMode } = setup();
    setRpcFailoverMode.mockClear();

    publish('RemoteFeatureFlagController:stateChange', {
      remoteFeatureFlags: {
        corePlatformRpcFailoverMode: 'forced',
        unrelatedFeature: true,
      },
    });

    expect(setRpcFailoverMode).not.toHaveBeenCalled();
  });

  it('disables a fallback after it is removed from saved networks', () => {
    const { publish, setRpcFailoverMode, state } = setup({
      savedFailovers: ['https://saved-failover.example/rpc'],
      clientFailovers: ['https://saved-failover.example/rpc'],
    });
    const networks = structuredClone(state.NetworkController);
    networks.networkConfigurationsByChainId[
      '0x123'
    ].rpcEndpoints[0].failoverUrls = [];

    publish('NetworkController:stateChange', networks);

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('disabled');
  });

  it('disables fallback routing while onboarding is incomplete', () => {
    const { publish, setRpcFailoverMode } = setup({
      useExternalServices: true,
    });

    publish('OnboardingController:stateChange', {
      completedOnboarding: false,
      firstTimeFlowType: null,
    });

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('disabled');
  });

  it('rejects malformed fallback destinations', () => {
    const { setRpcFailoverMode } = setup({
      clientFailovers: ['not a URL'],
    });

    expect(setRpcFailoverMode).toHaveBeenLastCalledWith('disabled');
  });
});
