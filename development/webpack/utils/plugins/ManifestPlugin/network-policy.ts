import { createHash, createPublicKey } from 'node:crypto';

const ruleTemplate: chrome.declarativeNetRequest.Rule[] = require('../../../../../shared/constants/network-policy-rules.json');

export const NETWORK_POLICY_RULESET_ID = 'network_policy_default';
export const NETWORK_POLICY_RULES_PATH = 'network-policy-rules.json';

// These are the published Chrome Web Store IDs from shared/constants/app.ts.
// Other stores must explicitly supply their own signing ID when packaging.
const PRODUCTION_EXTENSION_IDS: Record<string, string> = {
  main: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  beta: 'pbbkamfgmaedccnfkmjcofcecjhfgldn',
  flask: 'ljfoeinjpaedjfecbmggjgodbgkmjkjk',
};

/**
 * Compile a startup deny ruleset scoped to the effective manifest's extension.
 * Chrome activates this packaged ruleset before any extension JavaScript runs.
 *
 * @param manifest - The final manifest, including development key overrides.
 * @param buildType - The published distribution for keyless production builds.
 * @param testBuild - Whether to compile the fixed local E2E infrastructure.
 * @param targetExtensionId - The signing ID for a different production store.
 * @returns The scoped startup rules, or undefined for manifests without them.
 */
export function createPackagedNetworkPolicyRules(
  manifest: chrome.runtime.Manifest,
  buildType: string,
  testBuild = false,
  targetExtensionId?: string,
): chrome.declarativeNetRequest.Rule[] | undefined {
  if (manifest.manifest_version !== 3) {
    return undefined;
  }
  const ruleset = manifest.declarative_net_request?.rule_resources?.find(
    ({ id }) => id === NETWORK_POLICY_RULESET_ID,
  );
  if (!ruleset) {
    return undefined;
  }
  const minimumChromeVersion = Number(
    manifest.minimum_chrome_version?.split('.')[0],
  );
  if (
    ruleset.enabled !== true ||
    ruleset.path !== NETWORK_POLICY_RULES_PATH ||
    !manifest.permissions?.includes('declarativeNetRequestWithHostAccess') ||
    !Number.isSafeInteger(minimumChromeVersion) ||
    minimumChromeVersion < 145
  ) {
    throw new Error(
      'The packaged network policy must be enabled with host access and require Chrome 145',
    );
  }

  if (
    targetExtensionId !== undefined &&
    (typeof targetExtensionId !== 'string' ||
      targetExtensionId.length !== 32 ||
      !/^[a-p]{32}$/u.test(targetExtensionId))
  ) {
    throw new Error(
      'The network policy target extension ID must contain exactly 32 lowercase letters from a to p',
    );
  }

  let extensionId: string;
  if (manifest.key) {
    if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(manifest.key)) {
      throw new Error(
        'The network policy requires a valid manifest public key',
      );
    }
    const key = Buffer.from(manifest.key, 'base64');
    // Reject malformed overrides rather than emitting rules for an unrelated ID.
    createPublicKey({ key, format: 'der', type: 'spki' });
    extensionId = createHash('sha256')
      .update(key)
      .digest('hex')
      .slice(0, 32)
      .replace(/[0-9a-f]/gu, (digit) =>
        String.fromCharCode(97 + parseInt(digit, 16)),
      );
    if (targetExtensionId !== undefined && targetExtensionId !== extensionId) {
      throw new Error(
        'The network policy target extension ID conflicts with the manifest public key',
      );
    }
  } else {
    extensionId = targetExtensionId ?? PRODUCTION_EXTENSION_IDS[buildType];
    if (typeof extensionId !== 'string' || !/^[a-p]{32}$/u.test(extensionId)) {
      throw new Error(
        `No Chrome extension ID is configured for the ${buildType} network policy`,
      );
    }
  }

  const rules: chrome.declarativeNetRequest.Rule[] = ruleTemplate.map(
    (rule) => ({
      ...structuredClone(rule),
      condition: {
        ...structuredClone(rule.condition),
        ...('topDomains' in rule.condition
          ? { topDomains: [extensionId] }
          : { initiatorDomains: [extensionId] }),
      },
    }),
  );

  const testingFlags = (
    manifest as chrome.runtime.Manifest & {
      _flags?: {
        testing?: {
          fixtureServerPort?: unknown;
          forceExtensionStore?: boolean;
        };
      };
    }
  )._flags?.testing;
  const infrastructureRequests: chrome.declarativeNetRequest.RuleCondition[] =
    [];
  if (
    (testBuild || testingFlags?.fixtureServerPort !== undefined) &&
    testingFlags?.forceExtensionStore !== true
  ) {
    const configuredPort = testingFlags?.fixtureServerPort;
    const port =
      typeof configuredPort === 'number' &&
      Number.isInteger(configuredPort) &&
      configuredPort > 0 &&
      configuredPort <= 65535
        ? configuredPort
        : 12345;
    // FixtureExtensionStore loads this exact URL before controllers exist.
    infrastructureRequests.push({
      regexFilter: `^http://localhost:${port}/state\\.json$`,
      isUrlFilterCaseSensitive: true,
      requestMethods: ['get'],
      resourceTypes: ['xmlhttprequest'],
    });
  }
  if (testBuild) {
    // The E2E runner's background socket is bundled only in test builds.
    infrastructureRequests.push({
      regexFilter: '^ws://localhost:8111/$',
      resourceTypes: ['websocket'],
    });
  }
  for (const condition of infrastructureRequests) {
    // Compile both extension-origin and opaque child-frame scopes. These fixed
    // infrastructure exceptions are absent from normal production packages.
    for (const scope of ruleTemplate) {
      rules.push({
        id: 2_000_000 + rules.length - ruleTemplate.length,
        priority: 3,
        action: { type: 'allow' },
        condition: {
          ...condition,
          ...('topDomains' in scope.condition
            ? { topDomains: [extensionId] }
            : { initiatorDomains: [extensionId] }),
        },
      });
    }
  }
  return rules;
}
