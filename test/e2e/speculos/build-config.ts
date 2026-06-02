/**
 * Build / runtime configuration for Speculos E2E tests.
 *
 * Architecture:
 * - MetaMask uses REAL LedgerOffscreenBridge (production code)
 * - WebHID is mocked in offscreen + extension pages → ApduBridge → Speculos TCP
 * - @ledgerhq/hw-transport-webhid HID framing is handled in ApduBridge
 */

import { getDeviceModel, type DeviceModel } from '@metamask/hw-emulator';

export type SpeculosBuildConfig = {
  useRealBridge: boolean;
  mockWebHIDOnly: boolean;
  chromeFlags: string[];
};

export type { DeviceModel };

export function getDeviceModelFromEnv(): DeviceModel {
  const id = process.env.SPECULOS_DEVICE ?? 'flex';
  return getDeviceModel(id);
}

export function ensureDeviceEnv(): void {
  const model = getDeviceModelFromEnv();
  if (!process.env.SPECULOS_DEVICE) {
    process.env.SPECULOS_DEVICE = model.id;
  }
  if (!process.env.SPECULOS_ELF) {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}

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

/**
 * Detects whether the speculos WebHID mock was injected by the webpack build
 * (as opposed to post-build patching at test time).
 */
export function isSpeculosMockInBuild(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const distDir = path.join('dist', 'chrome');
    const htmlFiles = fs
      .readdirSync(distDir)
      .filter((f: string) => f.endsWith('.html'));
    if (htmlFiles.length === 0) {
      return false;
    }
    const sampleHtml = fs.readFileSync(
      path.join(distDir, htmlFiles[0]),
      'utf-8',
    );
    return sampleHtml.includes('speculos-webhid-mock');
  } catch {
    return false;
  }
}
