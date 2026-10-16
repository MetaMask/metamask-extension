import {
  buildNetworkPolicyRules,
  NETWORK_POLICY_RULE_ID,
  NETWORK_POLICY_RULE_LIMIT,
  normalizeNetworkPolicy,
  type NetworkPolicy,
} from '../../../shared/lib/network-policy';

export type NetworkPolicyDnr = {
  isRegexSupported: (
    options: chrome.declarativeNetRequest.RegexOptions,
  ) => Promise<chrome.declarativeNetRequest.IsRegexSupportedResult>;
  getSessionRules: () => Promise<chrome.declarativeNetRequest.Rule[]>;
  updateSessionRules: (
    options: chrome.declarativeNetRequest.UpdateRuleOptions,
  ) => Promise<void>;
};

export type NetworkPolicyEnforcement = {
  /** Resolves only after the browser enforces this complete policy snapshot. */
  update: (policy: NetworkPolicy) => Promise<void>;
  /** Grant only a dedicated trusted validation tab access to one endpoint. */
  allowRpcValidation: (options: {
    tabId: number;
    url: string;
  }) => Promise<() => Promise<void>>;
};

type Options = {
  extensionId: string;
  declarativeNetRequest: NetworkPolicyDnr;
};

const BLOCKED_POLICY: NetworkPolicy = Object.freeze({
  mode: 'blocked',
  allowedDomains: Object.freeze([]),
  allowedRpcUrls: Object.freeze([]),
});

const ownsRule = ({ id }: { id: number }): boolean =>
  id >= NETWORK_POLICY_RULE_ID &&
  id < NETWORK_POLICY_RULE_ID + NETWORK_POLICY_RULE_LIMIT;

const VALIDATION_RULE_ID = 2_000_000;
const VALIDATION_RULE_LIMIT = 1_000;

/**
 * Create the private background network-policy authority. Its handle must stay
 * in root application code; no globals, runtime messages, or dependency
 * endowments may expose rule mutation. Chrome's packaged rules protect the
 * pre-initialization period.
 *
 * @param options - Native browser APIs captured by the background entry point.
 * @param options.extensionId - The current extension ID.
 * @param options.declarativeNetRequest - Chrome MV3's DNR API.
 * @returns A handle owned exclusively by the background policy coordinator.
 */
export function createNetworkPolicyEnforcement({
  extensionId,
  declarativeNetRequest,
}: Options): NetworkPolicyEnforcement {
  if (!/^[a-p]{32}$/u.test(extensionId)) {
    throw new TypeError('Network policy requires a valid Chrome extension ID');
  }
  if (!declarativeNetRequest) {
    throw new Error('Browser network policy enforcement is unavailable');
  }
  let activePolicy = BLOCKED_POLICY;
  let initialized = false;
  let pending: Promise<void> = Promise.resolve();
  const sessionGrantOwners = new Map<number, symbol>();

  const enqueue = <Result>(action: () => Promise<Result>): Promise<Result> => {
    const result = pending.then(action);
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const closeAfterFailure = async (): Promise<void> => {
    sessionGrantOwners.clear();
    const sessionRules = await declarativeNetRequest.getSessionRules();
    await declarativeNetRequest.updateSessionRules({
      removeRuleIds: sessionRules
        .filter(
          ({ id }) =>
            ownsRule({ id }) ||
            (id >= VALIDATION_RULE_ID &&
              id < VALIDATION_RULE_ID + VALIDATION_RULE_LIMIT),
        )
        .map(({ id }) => id),
    });
    activePolicy = BLOCKED_POLICY;
  };

  const update = (policy: NetworkPolicy): Promise<void> => {
    // Snapshot inputs immediately: a queued caller cannot mutate its future
    // grant while an earlier browser update is pending.
    let normalized: NetworkPolicy;
    try {
      normalized = normalizeNetworkPolicy(policy);
    } catch (error) {
      return enqueue(async () => {
        await closeAfterFailure();
        throw error;
      });
    }
    const apply = async (): Promise<void> => {
      try {
        // Only allows are session rules. The packaged static deny is always
        // active, including browser restart and update before JS hydration.
        const nextRules = buildNetworkPolicyRules(
          normalized,
          extensionId,
        ).filter(({ action }) => action.type === 'allow');
        // Oversized regexes can be ignored in packaged static rules. For
        // dynamic policy, explicitly reject them before attempting publication.
        for (const rule of nextRules) {
          const { isSupported } = await declarativeNetRequest.isRegexSupported({
            regex: rule.condition.regexFilter as string,
            isCaseSensitive: rule.condition.isUrlFilterCaseSensitive,
          });
          if (!isSupported) {
            throw new Error('Network policy URL exceeds browser regex limits');
          }
        }
        const installed = await declarativeNetRequest.getSessionRules();
        await declarativeNetRequest.updateSessionRules({
          removeRuleIds: installed
            .filter(
              (rule) =>
                ownsRule(rule) ||
                ((!initialized || normalized.mode === 'blocked') &&
                  rule.id >= VALIDATION_RULE_ID &&
                  rule.id < VALIDATION_RULE_ID + VALIDATION_RULE_LIMIT),
            )
            .map(({ id }) => id),
          addRules: nextRules,
        });
        initialized = true;
        if (normalized.mode === 'blocked') {
          sessionGrantOwners.clear();
        }
        activePolicy = normalized;
      } catch (error) {
        // Do not retain a formerly broad policy after a restriction fails.
        // The caller still receives the error and must keep consumers stopped.
        try {
          await closeAfterFailure();
        } catch (closingError) {
          throw new AggregateError(
            [error, closingError],
            'Network policy update and fail-closed recovery failed',
          );
        }
        throw error;
      }
    };
    // A failed update must not permanently poison later reconciliation.
    return enqueue(apply);
  };

  return Object.freeze({
    update,
    allowRpcValidation: async ({ tabId, url }) => {
      if (!Number.isInteger(tabId) || tabId < 0) {
        throw new TypeError('RPC validation requires a dedicated browser tab');
      }
      const normalized = normalizeNetworkPolicy({
        mode: 'allowlist',
        allowedDomains: [],
        allowedRpcUrls: [url],
      });
      // Session rules cannot survive a browser restart or extension update.
      // The caller closes its minimal extension tab and removes the grant on
      // every validation exit path.
      return enqueue(async () => {
        if (activePolicy.mode === 'blocked') {
          throw new Error('RPC validation requires an initialized policy');
        }
        const installed = await declarativeNetRequest.getSessionRules();
        const occupied = new Set(installed.map(({ id }) => id));
        let ruleId = VALIDATION_RULE_ID;
        while (occupied.has(ruleId)) {
          ruleId += 1;
        }
        if (ruleId >= VALIDATION_RULE_ID + VALIDATION_RULE_LIMIT) {
          throw new RangeError('Too many concurrent RPC validation requests');
        }
        const rules = buildNetworkPolicyRules(normalized, extensionId).filter(
          ({ action }) => action.type === 'allow',
        );
        for (const rule of rules) {
          while (occupied.has(ruleId)) {
            ruleId += 1;
          }
          if (ruleId >= VALIDATION_RULE_ID + VALIDATION_RULE_LIMIT) {
            throw new RangeError('Too many concurrent RPC validation requests');
          }
          rule.id = ruleId;
          occupied.add(ruleId);
          rule.priority = 3;
          rule.condition.tabIds = [tabId];
          rule.condition.requestMethods = ['post', 'options'];
          rule.condition.resourceTypes = ['xmlhttprequest'];
        }
        await declarativeNetRequest.updateSessionRules({ addRules: rules });
        const owner = Symbol('rpc-validation');
        for (const { id } of rules) {
          sessionGrantOwners.set(id, owner);
        }
        let revocation: Promise<void> | undefined;
        return () => {
          revocation ??= enqueue(async () => {
            const removeRuleIds = rules
              .filter(({ id }) => sessionGrantOwners.get(id) === owner)
              .map(({ id }) => id);
            if (removeRuleIds.length) {
              await declarativeNetRequest.updateSessionRules({ removeRuleIds });
              removeRuleIds.forEach((id) => sessionGrantOwners.delete(id));
            }
          });
          return revocation;
        };
      });
    },
  });
}
