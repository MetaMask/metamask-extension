import type { DeclarativeNetRequest } from 'webextension-polyfill';
import {
  getDefaultNetworkControllerState,
  type NetworkState,
} from '@metamask/network-controller';
import {
  createAllowRules,
  supportsTopDomains,
  TEMPORARY_RULE_PAIRS,
  type NetworkRequestRuleApi,
} from '../../../shared/lib/network-request-policy';
import type { OnboardingControllerState } from '../controllers/onboarding';
import type { PreferencesControllerState } from '../controllers/preferences-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';

/* eslint-disable @typescript-eslint/naming-convention -- Match persisted controller names. */
type PolicyState = {
  OnboardingController?: Partial<OnboardingControllerState>;
  PreferencesController?: Partial<
    Pick<PreferencesControllerState, 'useExternalServices'>
  >;
  NetworkController?: Partial<NetworkState>;
};
/* eslint-enable @typescript-eslint/naming-convention */

const FRAME_BLOCK_RULE_ID = 1000001;
const FRAME_LOCALHOST_RULE_ID = 1000011;
const ALLOW_RULE_IDS = [1000002, 1000003];
const REMOTE_REQUEST_PATTERN = '^(https?|wss?)://';
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
  dnr: NetworkRequestRuleApi,
): Promise<void> {
  // Never submit unsupported top-only rules: an ignored condition could make
  // them match ordinary browser traffic instead of just extension frames.
  const hasTopDomains = supportsTopDomains(dnr);
  const frameCondition = {
    regexFilter: REMOTE_REQUEST_PATTERN,
    topDomains: [extensionId],
  };
  const frameRules: DeclarativeNetRequest.Rule[] = hasTopDomains
    ? [
        {
          id: FRAME_BLOCK_RULE_ID,
          priority: 1,
          action: { type: 'block' },
          condition: frameCondition,
        },
      ]
    : [];
  if (hasTopDomains && process.env.IN_TEST) {
    frameRules.push({
      id: FRAME_LOCALHOST_RULE_ID,
      priority: 3,
      action: { type: 'allow' },
      condition: {
        ...frameCondition,
        requestDomains: ['localhost'],
      },
    });
  }
  // Clear stale grants and install the frame guard atomically before controllers
  // and Snap sandboxes start. The packaged initiator guard is already active.
  const grantRuleIds = [...ALLOW_RULE_IDS, ...TEMPORARY_RULE_PAIRS.flat()];
  let pendingUpdate = dnr
    .updateSessionRules({
      removeRuleIds: [
        FRAME_BLOCK_RULE_ID,
        FRAME_LOCALHOST_RULE_ID,
        ...grantRuleIds,
      ],
      addRules: frameRules,
    })
    .catch(async (error) => {
      await dnr.updateSessionRules({ removeRuleIds: grantRuleIds });
      throw error;
    });
  let publishedPolicyKey = '[]';
  state = {};
  onboardingDomains = [];
  publish = (domains) => {
    const allowedDomains = domains === '*' ? '*' : [...new Set(domains)].sort();
    const policyKey = JSON.stringify(allowedDomains);
    const result = pendingUpdate
      .catch(() => undefined)
      .then(async () => {
        if (policyKey === publishedPolicyKey) {
          return;
        }
        const addRules =
          allowedDomains !== '*' && allowedDomains.length === 0
            ? []
            : createAllowRules({
                extensionId,
                dnr,
                ruleIds: ALLOW_RULE_IDS,
                condition: {
                  regexFilter: REMOTE_REQUEST_PATTERN,
                  ...(allowedDomains === '*'
                    ? {}
                    : { requestDomains: allowedDomains }),
                },
              });
        try {
          await dnr.updateSessionRules({
            removeRuleIds: ALLOW_RULE_IDS,
            addRules,
          });
        } catch (error) {
          publishedPolicyKey = '';
          await dnr.updateSessionRules({ removeRuleIds: ALLOW_RULE_IDS });
          throw error;
        }
        publishedPolicyKey = policyKey;
      });
    pendingUpdate = result;
    return result;
  };

  return pendingUpdate;
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
  const isSocialOnboarding =
    onboarding.firstTimeFlowType === FirstTimeFlowType.socialCreate ||
    onboarding.firstTimeFlowType === FirstTimeFlowType.socialImport;
  if (
    isSocialOnboarding ||
    state.PreferencesController?.useExternalServices !== false
  ) {
    return updateNetworkRequestDomains('*');
  }
  const networkConfigurations =
    state.NetworkController?.networkConfigurationsByChainId ??
    getDefaultNetworkControllerState().networkConfigurationsByChainId;
  const domains = Object.values(networkConfigurations).flatMap(
    ({ rpcEndpoints }) =>
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
