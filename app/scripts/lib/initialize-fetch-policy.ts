import { getEnvUrls } from '@metamask/profile-sync-controller/sdk';
import {
  getDefaultNetworkControllerState,
  RpcEndpointType,
  type NetworkState,
  type NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type {
  SeedlessOnboardingControllerState,
  SeedlessOnboardingControllerStateChangeEvent,
} from '@metamask/seedless-onboarding-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { isBasicFunctionalitySocialLoginUser } from '../../../shared/lib/basic-functionality-consolidation';
import type { Preferences } from '../../../shared/types/preferences';
import type {
  OnboardingControllerState,
  OnboardingControllerStateChangeEvent,
} from '../controllers/onboarding';
import type {
  PreferencesControllerState,
  PreferencesControllerStateChangeEvent,
} from '../controllers/preferences-controller';
import { isDevOrTestBuild, loadOAuthConfig } from '../services/oauth/config';
import type { RootMessenger } from './messenger';

type FetchPolicyEvents =
  | OnboardingControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent
  | SeedlessOnboardingControllerStateChangeEvent;

type FetchPolicyInitialState = Partial<
  Record<'OnboardingController', Partial<OnboardingControllerState>> &
    Record<
      'PreferencesController',
      Partial<Pick<PreferencesControllerState, 'useExternalServices'>> & {
        preferences?: Partial<Pick<Preferences, 'hasLinkedSocialLoginProfile'>>;
      }
    > &
    Record<
      'NetworkController',
      Partial<Pick<NetworkState, 'networkConfigurationsByChainId'>>
    > &
    Record<
      'SeedlessOnboardingController',
      Pick<SeedlessOnboardingControllerState, 'authConnection'>
    >
>;

/**
 * Restore onboarding policy before constructing controllers and subscribe before
 * any controller's completion listener can start network work.
 *
 * @param options - Background initialization options.
 * @param options.messenger - The background's root messenger.
 * @param options.state - Persisted controller state, if any.
 * @param options.infuraProjectId - The same project ID used by NetworkController.
 */
export function initializeFetchPolicy({
  messenger,
  state = {},
  infuraProjectId,
}: {
  messenger: Pick<RootMessenger<never, FetchPolicyEvents>, 'subscribe'>;
  state?: FetchPolicyInitialState;
  infuraProjectId?: string;
}): void {
  const api = globalThis.metamaskFetchPolicy;
  if (!api) {
    // Unit tests and non-extension consumers do not install a browser runtime.
    return;
  }
  const config = loadOAuthConfig();
  const { authApiUrl, oidcApiUrl } = getEnvUrls(config.profileSyncEnv);
  const nodeDomain = isDevOrTestBuild() ? 'dev-node' : 'node';
  const isSocial = (flow: FirstTimeFlowType | null | undefined) =>
    flow === FirstTimeFlowType.socialCreate ||
    flow === FirstTimeFlowType.socialImport;
  let onboardingState = state.OnboardingController;
  let preferencesState = state.PreferencesController;
  let authConnection = state.SeedlessOnboardingController?.authConnection;
  let networks =
    state.NetworkController?.networkConfigurationsByChainId ??
    getDefaultNetworkControllerState().networkConfigurationsByChainId;

  const getRpcUrls = (): string[] => [
    ...new Set(
      Object.values(networks).flatMap(({ rpcEndpoints }) =>
        rpcEndpoints.flatMap((endpoint) => {
          let primaryUrl: string | null = endpoint.url;
          if (endpoint.type === RpcEndpointType.Infura) {
            primaryUrl = infuraProjectId
              ? endpoint.url.replace('{infuraProjectId}', infuraProjectId)
              : null;
          }
          return [primaryUrl, ...(endpoint.failoverUrls ?? [])].flatMap(
            (value) => {
              if (!value) {
                return [];
              }
              try {
                const url = new URL(value);
                if (!['http:', 'https:'].includes(url.protocol)) {
                  return [];
                }
                url.username = '';
                url.password = '';
                url.hash = '';
                return [url.href];
              } catch {
                // Bad persisted endpoints must not open the gate or block startup.
                return [];
              }
            },
          );
        }),
      ),
    ),
  ];
  let rpcUrls = getRpcUrls();
  const getRpcRestriction = () => {
    const socialLogin = isBasicFunctionalitySocialLoginUser({
      firstTimeFlowType: onboardingState?.firstTimeFlowType ?? undefined,
      authConnection,
      hasLinkedSocialLoginProfile:
        preferencesState?.preferences?.hasLinkedSocialLoginProfile,
    });
    return preferencesState?.useExternalServices === false && !socialLogin
      ? rpcUrls
      : null;
  };

  api.update({
    completedOnboarding: onboardingState?.completedOnboarding === true,
    allowedRpcUrls: getRpcRestriction(),
    onboardingPath:
      !onboardingState?.completedOnboarding &&
      isSocial(onboardingState?.firstTimeFlowType)
        ? 'social'
        : null,
    onboardingDomains: {
      social: [
        new URL(config.authServerUrl).hostname,
        new URL(authApiUrl).hostname,
        new URL(oidcApiUrl).hostname,
        // Node discovery and the five TOPRF/metadata nodes used by the
        // installed seedless-onboarding-controller / topRF secure backup SDK.
        'api.web3auth.io',
        ...[1, 2, 3, 4, 5].map(
          (node) => `node-${node}.${nodeDomain}.web3auth.io`,
        ),
      ],
    },
  });

  messenger.subscribe('OnboardingController:stateChange', (next) => {
    const leftSocialFlow =
      next.firstTimeFlowType !== onboardingState?.firstTimeFlowType &&
      !isSocial(next.firstTimeFlowType);
    const reset =
      onboardingState?.completedOnboarding && !next.completedOnboarding;
    onboardingState = next;
    api.update({
      completedOnboarding: next.completedOnboarding,
      allowedRpcUrls: getRpcRestriction(),
      ...(next.completedOnboarding || leftSocialFlow || reset
        ? { onboardingPath: null }
        : {}),
    });
  });

  messenger.subscribe('PreferencesController:stateChange', (next) => {
    const changed =
      next.useExternalServices !== preferencesState?.useExternalServices ||
      next.preferences.hasLinkedSocialLoginProfile !==
        preferencesState?.preferences?.hasLinkedSocialLoginProfile;
    preferencesState = next;
    if (changed) {
      api.update({ allowedRpcUrls: getRpcRestriction() });
    }
  });
  messenger.subscribe('NetworkController:stateChange', (next) => {
    if (next.networkConfigurationsByChainId !== networks) {
      networks = next.networkConfigurationsByChainId;
      rpcUrls = getRpcUrls();
      api.update({ allowedRpcUrls: getRpcRestriction() });
    }
  });
  messenger.subscribe('SeedlessOnboardingController:stateChange', (next) => {
    if (next.authConnection !== authConnection) {
      authConnection = next.authConnection;
      api.update({ allowedRpcUrls: getRpcRestriction() });
    }
  });
}
