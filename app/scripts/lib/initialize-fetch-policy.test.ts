import { it } from '@jest/globals';
import {
  RpcEndpointType,
  type NetworkConfiguration,
  type NetworkState,
} from '@metamask/network-controller';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../shared/constants/onboarding';
import type { OnboardingControllerState } from '../controllers/onboarding';
import { initializeFetchPolicy } from './initialize-fetch-policy';

type InitialState = NonNullable<
  Parameters<typeof initializeFetchPolicy>[0]['state']
>;

function networkState(
  rpcEndpoints: NetworkConfiguration['rpcEndpoints'],
): NetworkState {
  return {
    selectedNetworkClientId: 'primary',
    networksMetadata: {},
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Test network',
        nativeCurrency: 'ETH',
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
        rpcEndpoints,
      },
    },
  };
}

function customRpc(
  url: string,
): Extract<
  NetworkConfiguration['rpcEndpoints'][number],
  { type: RpcEndpointType.Custom }
> {
  return { url, type: RpcEndpointType.Custom, networkClientId: url };
}

describe('initializeFetchPolicy', () => {
  const originalApi = globalThis.metamaskFetchPolicy;
  let update: jest.Mock;
  let subscribe: jest.Mock;
  let messenger: Parameters<typeof initializeFetchPolicy>[0]['messenger'];

  function initialize(onboardingState?: Partial<OnboardingControllerState>) {
    initializeFetchPolicy({
      messenger,
      state: { OnboardingController: onboardingState },
    });
  }

  beforeEach(() => {
    update = jest.fn();
    subscribe = jest.fn();
    messenger = { subscribe };
    globalThis.metamaskFetchPolicy = { update, getPolicy: jest.fn() };
  });

  afterEach(() => {
    globalThis.metamaskFetchPolicy = originalApi;
  });

  it('keeps a fresh wallet blocked with social domains inactive', () => {
    initialize();

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        completedOnboarding: false,
        onboardingPath: null,
        onboardingDomains: {
          social: expect.arrayContaining([
            'api.web3auth.io',
            'node-1.dev-node.web3auth.io',
          ]),
        },
      }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty('allowedDomains');
  });

  it('restores completed onboarding before controllers initialize', () => {
    initialize({ completedOnboarding: true });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        completedOnboarding: true,
        onboardingPath: null,
      }),
    );
  });

  it('restores a previously selected social onboarding path', () => {
    initialize({
      completedOnboarding: false,
      firstTimeFlowType: FirstTimeFlowType.socialImport,
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        completedOnboarding: false,
        onboardingPath: 'social',
      }),
    );
  });

  it('revokes social exceptions when switching to seed phrase onboarding', () => {
    initialize({
      firstTimeFlowType: FirstTimeFlowType.socialCreate,
    });
    const onChange = subscribe.mock.calls[0][1];

    onChange({
      completedOnboarding: false,
      firstTimeFlowType: FirstTimeFlowType.create,
    });

    expect(update).toHaveBeenLastCalledWith({
      completedOnboarding: false,
      onboardingPath: null,
      allowedRpcUrls: null,
    });
  });

  it('does not clear an ongoing OAuth selection on unrelated state changes', () => {
    initialize({ firstTimeFlowType: null });
    const onChange = subscribe.mock.calls[0][1];

    onChange({
      completedOnboarding: false,
      firstTimeFlowType: null,
      onboardingTabs: { 1: 'home' },
    });

    expect(update).toHaveBeenLastCalledWith({
      completedOnboarding: false,
      allowedRpcUrls: null,
    });
  });

  it('switches policy synchronously on completion and reset', () => {
    initialize();
    const onChange = subscribe.mock.calls[0][1];

    onChange({
      completedOnboarding: true,
      firstTimeFlowType: FirstTimeFlowType.socialCreate,
    });
    expect(update).toHaveBeenLastCalledWith({
      completedOnboarding: true,
      onboardingPath: null,
      allowedRpcUrls: null,
    });
    onChange({ completedOnboarding: false, firstTimeFlowType: null });
    expect(update).toHaveBeenLastCalledWith({
      completedOnboarding: false,
      onboardingPath: null,
      allowedRpcUrls: null,
    });
  });

  describe('Basic Functionality privacy mode', () => {
    function setup(overrides: InitialState = {}) {
      const state: InitialState = {
        OnboardingController: {
          completedOnboarding: true,
          firstTimeFlowType: FirstTimeFlowType.import,
        },
        PreferencesController: { useExternalServices: false },
        NetworkController: networkState([
          customRpc('https://rpc.example/api?key=test'),
        ]),
        ...overrides,
      };
      initializeFetchPolicy({
        messenger,
        state,
        infuraProjectId: 'test-project-id',
      });
      const onChange = (event: string, next: unknown) => {
        const subscription = subscribe.mock.calls.find(
          ([name]) => name === event,
        );
        if (!subscription) {
          throw new Error(`Missing subscription: ${event}`);
        }
        subscription[1](next);
      };
      return { onChange };
    }

    it('restores the saved RPC restriction before opening the gate', () => {
      setup();

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          completedOnboarding: true,
          allowedRpcUrls: ['https://rpc.example/api?key=test'],
        }),
      );
      expect(update.mock.calls[0][0]).not.toHaveProperty('allowedDomains');
    });

    it('follows the Basic Functionality toggle in both directions', () => {
      const { onChange } = setup({
        PreferencesController: { useExternalServices: true },
      });
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ allowedRpcUrls: null }),
      );

      onChange('PreferencesController:stateChange', {
        useExternalServices: false,
        preferences: { hasLinkedSocialLoginProfile: false },
      });
      expect(update).toHaveBeenLastCalledWith({
        allowedRpcUrls: ['https://rpc.example/api?key=test'],
      });
      onChange('PreferencesController:stateChange', {
        useExternalServices: true,
        preferences: { hasLinkedSocialLoginProfile: false },
      });
      expect(update).toHaveBeenLastCalledWith({ allowedRpcUrls: null });
    });

    it('tracks added, changed and removed RPCs', () => {
      const { onChange } = setup();
      onChange(
        'NetworkController:stateChange',
        networkState([
          customRpc('https://rpc.example/api?key=test'),
          customRpc('http://localhost:8545'),
        ]),
      );
      expect(update).toHaveBeenLastCalledWith({
        allowedRpcUrls: [
          'https://rpc.example/api?key=test',
          'http://localhost:8545/',
        ],
      });

      onChange(
        'NetworkController:stateChange',
        networkState([customRpc('http://localhost:9545')]),
      );
      expect(update).toHaveBeenLastCalledWith({
        allowedRpcUrls: ['http://localhost:9545/'],
      });
      onChange('NetworkController:stateChange', networkState([]));
      expect(update).toHaveBeenLastCalledWith({ allowedRpcUrls: [] });
    });

    it('uses all saved RPCs, including saved failover endpoints', () => {
      setup({
        NetworkController: networkState([
          {
            ...customRpc('https://rpc.example'),
            failoverUrls: ['https://backup.example/rpc'],
          },
          customRpc('https://secondary.example'),
          customRpc('https://rpc.example/'),
        ]),
      });

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          allowedRpcUrls: [
            'https://rpc.example/',
            'https://backup.example/rpc',
            'https://secondary.example/',
          ],
        }),
      );
    });

    it('resolves Infura templates with the NetworkController project ID', () => {
      setup({
        NetworkController: networkState([
          {
            type: RpcEndpointType.Infura,
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            networkClientId: 'mainnet',
          },
          customRpc('https://custom.example/{infuraProjectId}'),
        ]),
      });

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          allowedRpcUrls: [
            'https://mainnet.infura.io/v3/test-project-id',
            'https://custom.example/%7BinfuraProjectId%7D',
          ],
        }),
      );
    });

    it('uses default networks when no network state has been persisted', () => {
      setup({ NetworkController: undefined });

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          allowedRpcUrls: expect.arrayContaining([
            'https://mainnet.infura.io/v3/test-project-id',
          ]),
        }),
      );
    });

    it('skips malformed or unsupported saved endpoints without allowing other traffic', () => {
      setup({
        NetworkController: networkState([
          customRpc('bad-url'),
          customRpc('ftp://rpc.example'),
          customRpc('data:text/plain,not-an-RPC'),
        ]),
      });

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ allowedRpcUrls: [] }),
      );
    });

    it('matches RpcService URL normalization for HTTP credentials and fragments', () => {
      setup({
        NetworkController: networkState([
          customRpc('http://user:password@[::1]:8545/#fragment'),
        ]),
      });

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ allowedRpcUrls: ['http://[::1]:8545/'] }),
      );
    });

    it.each([
      {
        OnboardingController: {
          completedOnboarding: true,
          firstTimeFlowType: FirstTimeFlowType.socialCreate,
        },
      },
      {
        OnboardingController: {
          completedOnboarding: true,
          firstTimeFlowType: FirstTimeFlowType.socialImport,
        },
      },
      {
        SeedlessOnboardingController: { authConnection: AuthConnection.Google },
      },
      {
        PreferencesController: {
          useExternalServices: false,
          preferences: { hasLinkedSocialLoginProfile: true },
        },
      },
    ])('keeps social-login wallets out of the SRP restriction: %j', (state) => {
      setup(state);

      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ allowedRpcUrls: null }),
      );
    });

    it('reevaluates social login when a profile is linked', () => {
      const { onChange } = setup();
      onChange('PreferencesController:stateChange', {
        useExternalServices: false,
        preferences: { hasLinkedSocialLoginProfile: true },
      });

      expect(update).toHaveBeenLastCalledWith({ allowedRpcUrls: null });
    });

    it('reevaluates social login when authentication changes', () => {
      const { onChange } = setup();
      onChange('SeedlessOnboardingController:stateChange', {
        authConnection: AuthConnection.Google,
      });
      expect(update).toHaveBeenLastCalledWith({ allowedRpcUrls: null });

      onChange('SeedlessOnboardingController:stateChange', {});
      expect(update).toHaveBeenLastCalledWith({
        allowedRpcUrls: ['https://rpc.example/api?key=test'],
      });
    });

    it('applies the RPC restriction atomically with onboarding completion', () => {
      const { onChange } = setup({
        OnboardingController: {
          completedOnboarding: false,
          firstTimeFlowType: FirstTimeFlowType.create,
        },
      });
      onChange('OnboardingController:stateChange', {
        completedOnboarding: true,
        firstTimeFlowType: FirstTimeFlowType.create,
      });

      expect(update).toHaveBeenLastCalledWith({
        completedOnboarding: true,
        onboardingPath: null,
        allowedRpcUrls: ['https://rpc.example/api?key=test'],
      });
    });
  });
});
