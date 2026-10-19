import type { DeclarativeNetRequest } from 'webextension-polyfill';
import {
  getDefaultNetworkControllerState,
  type NetworkState,
} from '@metamask/network-controller';
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
  dnr: Pick<DeclarativeNetRequest.Static, 'updateSessionRules'> & {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Native Chrome API spelling.
    RuleConditionKeys?: Partial<Record<'TOP_DOMAINS', string>>;
  },
): Promise<void> {
  // Chrome 145+ exposes this enum specifically for condition feature detection.
  // Never submit an unsupported top-only rule: an ignored condition could make
  // it match ordinary browser traffic instead of just extension frames.
  const supportsTopDomains =
    dnr.RuleConditionKeys?.TOP_DOMAINS === 'topDomains';
  const requestScopes = [
    'initiatorDomains',
    ...(supportsTopDomains ? ['topDomains'] : []),
  ];
  const frameCondition = {
    regexFilter: REMOTE_REQUEST_PATTERN,
    topDomains: [extensionId],
  };
  const frameRules: DeclarativeNetRequest.Rule[] = supportsTopDomains
    ? [
        {
          id: FRAME_BLOCK_RULE_ID,
          priority: 1,
          action: { type: 'block' },
          condition: frameCondition,
        },
      ]
    : [];
  if (supportsTopDomains && process.env.IN_TEST) {
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
  // Install the frame guard and revoke stale grants atomically, before any
  // controllers (and therefore Snap sandboxes) start. The static initiator
  // guard is already active before background/UI JavaScript on every version.
  let pendingUpdate = dnr
    .updateSessionRules({
      removeRuleIds: [
        FRAME_BLOCK_RULE_ID,
        FRAME_LOCALHOST_RULE_ID,
        ...ALLOW_RULE_IDS,
      ],
      addRules: frameRules,
    })
    .catch(async (error) => {
      await dnr.updateSessionRules({ removeRuleIds: ALLOW_RULE_IDS });
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
        const addRules: DeclarativeNetRequest.Rule[] =
          allowedDomains !== '*' && allowedDomains.length === 0
            ? []
            : requestScopes.map((scope, index) => ({
                id: ALLOW_RULE_IDS[index],
                priority: 2,
                action: { type: 'allow' },
                condition: {
                  regexFilter: REMOTE_REQUEST_PATTERN,
                  [scope]: [extensionId],
                  ...(allowedDomains === '*'
                    ? {}
                    : { requestDomains: allowedDomains }),
                },
              }));
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
