import { createHash } from 'node:crypto';
import type { Manifest } from '../../helpers';

const CHROME_EXTENSION_IDS: Partial<Record<string, string>> = {
  main: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  beta: 'pbbkamfgmaedccnfkmjcofcecjhfgldn',
  flask: 'ljfoeinjpaedjfecbmggjgodbgkmjkjk',
};

/**
 * Package extension-scoped denies, active before background/UI JavaScript.
 * @param manifest
 * @param buildType
 * @param test
 */
export function createNetworkRequestRules(
  manifest: Manifest,
  buildType: string,
  test: boolean,
): chrome.declarativeNetRequest.Rule[] {
  const extensionId = manifest.key
    ? createHash('sha256')
        .update(Buffer.from(manifest.key, 'base64'))
        .digest('hex')
        .slice(0, 32)
        .replace(/[0-9a-f]/gu, (digit) =>
          String.fromCharCode(97 + parseInt(digit, 16)),
        )
    : CHROME_EXTENSION_IDS[buildType];
  if (!extensionId) {
    throw new Error(
      'A Chrome signing ID is required for network request rules',
    );
  }
  // Only package conditions understood by every supported Chrome version.
  // The background installs top-frame rules after native feature detection.
  const condition = {
    regexFilter: '^(https?|wss?)://',
    initiatorDomains: [extensionId],
  };
  const rules: chrome.declarativeNetRequest.Rule[] = [
    {
      id: 1000000,
      priority: 1,
      action: { type: 'block' },
      condition,
    },
  ];
  if (test) {
    // Test fixtures and the browser-test socket need local infrastructure.
    rules.push({
      id: 1000010,
      priority: 3,
      action: { type: 'allow' },
      condition: { ...condition, requestDomains: ['localhost'] },
    });
  }
  return rules;
}
