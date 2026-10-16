import type { DeclarativeNetRequest } from 'webextension-polyfill';
import {
  getDefaultNetworkControllerState,
  type NetworkState,
} from '@metamask/network-controller';
import type { OnboardingControllerState } from '../controllers/onboarding';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';

type PolicyState = Partial<
  Record<'OnboardingController', Partial<OnboardingControllerState>> &
    Record<
      'PreferencesController',
      Pick<Partial<PreferencesControllerState>, 'useExternalServices'>
    > &
    Record<'NetworkController', Partial<NetworkState>>
>;
type Domains = '*' | string[];
let state: PolicyState = {};
let onboardingDomains: string[] = [];
let publish: (domains: Domains) => Promise<void> = async () => undefined;

/**
 * Install the Chrome request backstop and clear stale session allowances.
 * @param extensionId
 * @param dnr
 */
export function initializeNetworkRequestPolicy(
  extensionId: string,
  dnr: Pick<DeclarativeNetRequest.Static, 'updateSessionRules'>,
): Promise<void> {
  let pending = Promise.resolve();
  let previous = '';
  state = {};
  onboardingDomains = [];
  publish = (domains) => {
    const snapshot = domains === '*' ? '*' : [...new Set(domains)].sort();
    const key = JSON.stringify(snapshot);
    const result = pending
      .catch(() => undefined)
      .then(async () => {
        if (key === previous) {
          return;
        }
        const addRules: DeclarativeNetRequest.Rule[] =
          snapshot !== '*' && snapshot.length === 0
            ? []
            : ['initiatorDomains', 'topDomains'].map((scope, index) => ({
                id: 1000002 + index,
                priority: 2,
                action: { type: 'allow' },
                condition: {
                  regexFilter: '^(https?|wss?)://',
                  [scope]: [extensionId],
                  ...(snapshot === '*' ? {} : { requestDomains: snapshot }),
                },
              }));
        try {
          await dnr.updateSessionRules({
            removeRuleIds: [1000002, 1000003],
            addRules,
          });
        } catch (error) {
          previous = '';
          await dnr.updateSessionRules({ removeRuleIds: [1000002, 1000003] });
          throw error;
        }
        previous = key;
      });
    pending = result;
    return result;
  };
  return updateNetworkRequestDomains([]);
}

/**
 * Update '*' or domain allowances; callers can await browser enforcement.
 * @param domains
 */
export function updateNetworkRequestDomains(domains: Domains): Promise<void> {
  return publish(domains);
}

/**
 * Reconcile existing wallet state without adding a controller or persisted state.
 * @param nextState
 */
export function refreshNetworkRequestPolicy(nextState = state): Promise<void> {
  state = nextState;
  const onboarding = state.OnboardingController;
  if (onboarding?.completedOnboarding !== true) {
    return updateNetworkRequestDomains(onboardingDomains);
  }
  onboardingDomains = [];
  const social =
    onboarding.firstTimeFlowType === FirstTimeFlowType.socialCreate ||
    onboarding.firstTimeFlowType === FirstTimeFlowType.socialImport;
  if (social || state.PreferencesController?.useExternalServices !== false) {
    return updateNetworkRequestDomains('*');
  }
  const networks =
    state.NetworkController?.networkConfigurationsByChainId ??
    getDefaultNetworkControllerState().networkConfigurationsByChainId;
  const domains = Object.values(networks).flatMap(({ rpcEndpoints }) =>
    rpcEndpoints.flatMap(({ url, failoverUrls = [] }) =>
      [url, ...failoverUrls].flatMap((endpoint) => {
        try {
          return [new URL(endpoint).hostname];
        } catch {
          return [];
        }
      }),
    ),
  );
  return updateNetworkRequestDomains(domains);
}

/**
 * Allow only a user-selected onboarding path; never restore this from storage.
 * @param domains
 */
export function setOnboardingNetworkDomains(domains: string[]): Promise<void> {
  onboardingDomains = [...domains];
  return refreshNetworkRequestPolicy();
}
