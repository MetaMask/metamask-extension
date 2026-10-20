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
// Reserve a pair per operation so overlapping callbacks can release independently.
const TEMPORARY_RULE_IDS = Array.from(
  { length: 64 },
  (_, index) => 1000100 + index,
);

type Domains = '*' | string[];
type ReleaseAllowance = () => Promise<void>;
let state: PolicyState = {};
let onboardingDomains: string[] = [];
let publish: (domains: Domains) => Promise<void> = async () => undefined;
let acquireTemporaryAllowance:
  | ((url: URL) => Promise<ReleaseAllowance>)
  | undefined;

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
  acquireTemporaryAllowance = undefined;
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
  // Clear interrupted temporary grants, then atomically install the frame guard
  // and revoke stale policy grants before controllers and Snap sandboxes start.
  // The packaged initiator guard is already active on every supported version.
  let pendingUpdate = dnr
    .updateSessionRules({
      removeRuleIds: TEMPORARY_RULE_IDS,
    })
    .then(() =>
      dnr.updateSessionRules({
        removeRuleIds: [
          FRAME_BLOCK_RULE_ID,
          FRAME_LOCALHOST_RULE_ID,
          ...ALLOW_RULE_IDS,
        ],
        addRules: frameRules,
      }),
    )
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

  const activeAllowances = new Set<number>();
  const acquire = async (url: URL): Promise<ReleaseAllowance> => {
    await pendingUpdate;
    if (acquireTemporaryAllowance !== acquire) {
      throw new Error('Network request policy was reinitialized');
    }
    const firstRuleId = TEMPORARY_RULE_IDS.find(
      (id, index) => index % 2 === 0 && !activeAllowances.has(id),
    );
    if (firstRuleId === undefined) {
      throw new Error('Too many concurrent temporary network allowances');
    }
    activeAllowances.add(firstRuleId);
    const ruleIds = requestScopes.map((_, index) => firstRuleId + index);
    const regexFilter = `^${url.href.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}$`;
    try {
      await dnr.updateSessionRules({
        addRules: requestScopes.map((scope, index) => ({
          id: ruleIds[index],
          priority: 2,
          action: { type: 'allow' },
          condition: {
            regexFilter,
            isUrlFilterCaseSensitive: true,
            [scope]: [extensionId],
          },
        })),
      });
    } catch (error) {
      activeAllowances.delete(firstRuleId);
      throw error;
    }
    return async () => {
      // Initialization already cleared grants belonging to an older instance.
      if (acquireTemporaryAllowance !== acquire) {
        return;
      }
      await dnr.updateSessionRules({ removeRuleIds: ruleIds });
      activeAllowances.delete(firstRuleId);
    };
  };
  acquireTemporaryAllowance = acquire;
  return pendingUpdate;
}

/**
 * Allow an exact HTTP(S) URL while a background callback runs, then revoke it.
 * Matching requests elsewhere in the extension can also use this allowance.
 * Await all work (including response consumption) inside the callback.
 *
 * @param url - Absolute URL to allow; fragments are ignored, credentials rejected.
 * @param callback - Work to run after browser enforcement confirms the allowance.
 * @returns The callback result after the allowance has been removed.
 */
export async function withTemporaryAllowance<Result>(
  url: string,
  callback: () => Result | Promise<Result>,
): Promise<Result> {
  const endpoint = new URL(url);
  if (
    !['http:', 'https:'].includes(endpoint.protocol) ||
    endpoint.username ||
    endpoint.password
  ) {
    throw new Error(
      'Temporary network allowances require an HTTP(S) URL without credentials',
    );
  }
  endpoint.hash = '';
  if (!acquireTemporaryAllowance) {
    throw new Error(
      'Network request policy is not initialized in this background context',
    );
  }
  const release = await acquireTemporaryAllowance(endpoint);
  try {
    return await callback();
  } finally {
    await release();
  }
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
