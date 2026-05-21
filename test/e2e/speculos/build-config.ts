/**
 * Build / runtime configuration for Speculos E2E tests.
 *
 * Architecture:
 * - MetaMask uses REAL LedgerOffscreenBridge (production code)
 * - WebHID is mocked in offscreen + extension pages → ApduBridge → Speculos TCP
 * - @ledgerhq/hw-transport-webhid HID framing is handled in ApduBridge
 */

export type SpeculosBuildConfig = {
  useRealBridge: boolean;
  mockWebHIDOnly: boolean;
  chromeFlags: string[];
};

export function getSpeculosBuildConfig(): SpeculosBuildConfig {
  return {
    useRealBridge: true,
    mockWebHIDOnly: true,
    chromeFlags: [
      '--enable-features=WebHID',
      '--disable-features=WebHidBlocklist',
    ],
  };
}

/**
 * Chrome flags for Speculos E2E (used by test/e2e/webdriver/chrome.js when SPECULOS_E2E=1).
 */
export function getChromeFlags(): string[] {
  return getSpeculosBuildConfig().chromeFlags;
}

/**
 * Validates Node-side test runner env before Speculos tests.
 */
export function validateSpeculosTestEnv(): void {
  const errors: string[] = [];

  if (process.env.SKIP_SPECULOS_TESTS === 'true') {
    return;
  }

  if (!process.env.SPECULOS_E2E && process.env.NODE_ENV !== 'test') {
    errors.push(
      'Set SPECULOS_E2E=1 (yarn test:e2e:speculos) or NODE_ENV=test for Speculos tests.',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Speculos test configuration invalid:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }
}
