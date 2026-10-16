import startupRules from '../constants/network-policy-rules.json';

/** A background-owned snapshot of the user's approved network access. */
export type NetworkPolicy = Readonly<{
  mode: 'blocked' | 'allow-all' | 'allowlist';
  /** Exact hostnames, including every port, without an implicit subdomain grant. */
  allowedDomains: readonly string[];
  /** Exact HTTP(S) request URLs. Credentials are transported in headers. */
  allowedRpcUrls: readonly string[];
}>;

export const NETWORK_POLICY_RULE_ID = 1_000_000;
export const NETWORK_POLICY_RULE_LIMIT = 1_000;

const REMOTE_URL_PATTERN = '^(https?|wss?)://';
const NativeURL = URL;
const stringifyUrl = NativeURL.prototype.toString;
const { apply } = Reflect;

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

const normalizeDomain = (domain: string): string => {
  if (
    typeof domain !== 'string' ||
    !domain ||
    /[\s/@?#*\\]/u.test(domain) ||
    (domain.includes(':') && !(domain.startsWith('[') && domain.endsWith(']')))
  ) {
    throw new TypeError('Network policy domains must be bare hostnames');
  }
  const canonical: string = apply(
    stringifyUrl,
    new NativeURL(`https://${domain}`),
    [],
  );
  return canonical.slice('https://'.length, -1).replace(/\.$/u, '');
};

const normalizeRpcUrl = (value: string): string => {
  if (typeof value !== 'string') {
    throw new TypeError('Network policy RPC endpoints must be HTTP(S) URLs');
  }
  const url: string = apply(stringifyUrl, new NativeURL(value), []);
  if (!/^https?:\/\//u.test(url)) {
    throw new TypeError('Network policy RPC endpoints must be HTTP(S) URLs');
  }
  // RpcService moves HTTP Basic credentials into the Authorization header.
  // Neither credentials nor fragments are part of Chrome's request URL.
  return url.replace(/^(https?:\/\/)[^/]*@/u, '$1').replace(/#.*$/u, '');
};

/**
 * Validate and copy a complete policy before publishing it to the browser.
 *
 * @param policy - The proposed policy snapshot.
 * @returns An immutable normalized snapshot.
 */
export function normalizeNetworkPolicy(policy: NetworkPolicy): NetworkPolicy {
  if (
    !policy ||
    !['blocked', 'allow-all', 'allowlist'].includes(policy.mode) ||
    !Array.isArray(policy.allowedDomains) ||
    !Array.isArray(policy.allowedRpcUrls)
  ) {
    throw new TypeError('Invalid network policy');
  }
  return Object.freeze({
    mode: policy.mode,
    allowedDomains: Object.freeze([
      ...new Set(policy.allowedDomains.map(normalizeDomain)),
    ]),
    allowedRpcUrls: Object.freeze([
      ...new Set(policy.allowedRpcUrls.map(normalizeRpcUrl)),
    ]),
  });
}

/**
 * Check a normalized policy before enabling an automatic RPC failover URL.
 *
 * @param policy - The immutable active policy.
 * @param requestUrl - The browser's request URL.
 * @returns Whether this policy permits the destination.
 */
export function isNetworkRequestAllowed(
  policy: NetworkPolicy,
  requestUrl: string,
): boolean {
  // Callers supply a canonical URL. Match the same exact destinations as DNR.
  if (!/^(?:https?|wss?):\/\//u.test(requestUrl)) {
    return /^[a-z][a-z0-9+.-]*:/iu.test(requestUrl);
  }
  if (policy.mode === 'blocked') {
    return false;
  }
  if (policy.mode === 'allow-all') {
    return true;
  }
  if (
    policy.allowedDomains.some((domain) =>
      new RegExp(
        `^(https?|wss?)://${escapeRegex(domain)}\\.?(:[0-9]+)?/`,
        'u',
      ).test(requestUrl),
    )
  ) {
    return true;
  }
  return (
    /^https?:\/\//u.test(requestUrl) &&
    policy.allowedRpcUrls.includes(requestUrl)
  );
}

/**
 * Generate the packaged startup deny rule. The build must supply its extension
 * ID: static rules cannot interpolate runtime.id. Never omit initiatorDomains.
 *
 * @param extensionId - The target build's extension ID.
 * @returns An extension-scoped deny rule for every remote request type.
 */
export function createBlockedNetworkPolicyRules(
  extensionId: string,
): chrome.declarativeNetRequest.Rule[] {
  if (!/^[a-p]{32}$/u.test(extensionId)) {
    throw new TypeError('Network policy requires a valid Chrome extension ID');
  }
  return startupRules.map(
    (rule): chrome.declarativeNetRequest.Rule => ({
      ...rule,
      action: { type: 'block' },
      condition: {
        ...rule.condition,
        ...('topDomains' in rule.condition
          ? { topDomains: [extensionId] }
          : { initiatorDomains: [extensionId] }),
        resourceTypes: [
          ...rule.condition.resourceTypes,
        ] as chrome.declarativeNetRequest.RuleCondition['resourceTypes'],
      },
    }),
  );
}

/**
 * Compile policy into scoped DNR rules. Allow rules have higher priority than
 * the permanent startup deny rule. Each redirect target is evaluated anew.
 *
 * @param policy - The proposed policy snapshot.
 * @param extensionId - The current extension ID.
 * @returns The static baseline plus allows for an atomic updateSessionRules call.
 */
export function buildNetworkPolicyRules(
  policy: NetworkPolicy,
  extensionId: string,
): chrome.declarativeNetRequest.Rule[] {
  const normalized = normalizeNetworkPolicy(policy);
  const rules = createBlockedNetworkPolicyRules(extensionId);
  let patterns: string[] = [];
  if (normalized.mode === 'allow-all') {
    patterns = [REMOTE_URL_PATTERN];
  } else if (normalized.mode === 'allowlist') {
    patterns = [
      ...normalized.allowedDomains.map(
        (domain) => `^(https?|wss?)://${escapeRegex(domain)}\\.?(:[0-9]+)?/`,
      ),
      ...normalized.allowedRpcUrls.map((url) => `^${escapeRegex(url)}$`),
    ];
  }
  if (rules.length * (patterns.length + 1) > NETWORK_POLICY_RULE_LIMIT) {
    throw new RangeError('Network policy exceeds the browser rule limit');
  }
  const scopes = rules.map(({ condition }) => condition);
  patterns.forEach((regexFilter) => {
    scopes.forEach((condition) => {
      rules.push({
        id: NETWORK_POLICY_RULE_ID + rules.length,
        priority: 2,
        action: { type: 'allow' },
        condition: {
          ...condition,
          regexFilter,
          isUrlFilterCaseSensitive: true,
          resourceTypes: [...(condition.resourceTypes ?? [])],
        },
      });
    });
  });
  return rules;
}
