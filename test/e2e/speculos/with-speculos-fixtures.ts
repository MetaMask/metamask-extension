/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { withFixtures } from '../helpers';
import { Anvil } from '../seeder/anvil';
import { Driver } from '../webdriver/driver';
import { SpeculosTestHelper } from './test-helper';
import { SpeculosClient } from './client';
import { ApduBridge } from './apdu-bridge';
import { validateSpeculosTestEnv } from './build-config';
import {
  SPECULOS_WS_BRIDGE_PORT,
  ensureDeviceEnv,
  getDeviceModel,
} from './constants';
import { getWebHidMockScript } from './webhid-mock-script';
import type { SharedSpeculosContext } from './shared-context';
import type { DeviceInteraction } from './device-interaction';
import type { DeviceModel } from './constants';
import { createDeviceInteraction } from './device-interaction';

export type { SharedSpeculosContext } from './shared-context';
export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';

const SPECULOS_LOCKDOWN_MARKER = '/* __SPECULOS_MOCK__ */';

function revertLockdownRunPatches(): void {
  const distDir = path.join('dist', 'chrome');
  const htmlFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.html'));

  const mockScriptTag =
    '<script src="./scripts/speculos-webhid-mock.js"></script>\n    ';
  const mockScriptTagAlt =
    '<script src="scripts/speculos-webhid-mock.js"></script>\n<script ';

  let revertedCount = 0;
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf-8');

    if (!html.includes('speculos-webhid-mock.js')) {
      continue;
    }

    html = html.replace(mockScriptTag, '');
    html = html.replace(mockScriptTagAlt, '<script ');

    fs.writeFileSync(htmlPath, html);
    revertedCount += 1;
  }

  const mockScriptPath = path.join(
    'dist',
    'chrome',
    'scripts',
    'speculos-webhid-mock.js',
  );
  try {
    fs.unlinkSync(mockScriptPath);
  } catch {
    // file may not exist
  }

  if (revertedCount > 0) {
    console.log(
      `[Speculos] Reverted WebHID mock script from ${revertedCount} HTML files`,
    );
  }
}

function patchLockdownRunForSpeculos(wsPort: number): void {
  // LavaMoat lockdown scuttles navigator.hid (and WebSocket) in every
  // extension page's SES compartment.  We inject a pre-lockdown script
  // that sets up the full WebHID mock BEFORE lockdown runs, so
  // navigator.hid is already available when the app code checks for it.
  // This must be done for ALL extension HTML pages (popup, notification
  // dialog, home, sidepanel, offscreen) — not just offscreen.
  //
  // Supports two build types:
  //   - Browserify / LavaMoat production build: HTML references
  //     ./scripts/runtime-lavamoat.js
  //   - Webpack dev/test build: HTML references bootstrap.js or runtime.js
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webhidMockModule = require('./webhid-mock-script');
  const mockScript = webhidMockModule.getWebHidMockScript(wsPort);

  const scriptPath = path.join(
    'dist',
    'chrome',
    'scripts',
    'speculos-webhid-mock.js',
  );
  fs.writeFileSync(scriptPath, mockScript);

  const distDir = path.join('dist', 'chrome');
  const htmlFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.html'));

  // Injection anchors, in priority order — first match wins per file.
  const injectionAnchors = [
    // Browserify / LavaMoat production build
    {
      pattern: '<script src="./scripts/runtime-lavamoat.js"',
      replacement:
        '<script src="./scripts/speculos-webhid-mock.js"></script>\n    <script src="./scripts/runtime-lavamoat.js"',
    },
    // Webpack dev/test build — inject before bootstrap.js
    {
      pattern: '<script src="bootstrap.js"',
      replacement:
        '<script src="scripts/speculos-webhid-mock.js"></script>\n<script src="bootstrap.js"',
    },
    // Webpack dev/test build — inject before runtime.js (fallback for
    // pages like offscreen.html that have no bootstrap.js)
    {
      pattern: '<script src="runtime.js"',
      replacement:
        '<script src="scripts/speculos-webhid-mock.js"></script>\n<script src="runtime.js"',
    },
  ];

  let patchedCount = 0;
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf-8');

    if (html.includes('speculos-webhid-mock.js')) {
      continue;
    }

    let patched = false;
    for (const anchor of injectionAnchors) {
      if (html.includes(anchor.pattern)) {
        html = html.replace(anchor.pattern, anchor.replacement);
        patched = true;
        break;
      }
    }

    if (!patched) {
      continue;
    }

    fs.writeFileSync(htmlPath, html);
    patchedCount += 1;
  }

  console.log(
    `[Speculos] Injected WebHID mock script into ${patchedCount} HTML files (pre-lockdown)`,
  );
}

export type WithSpeculosFixturesOptions = {
  fixtures: unknown;
  title?: string;
  localNodeOptions?: string | object | unknown[];
  driverOptions?: unknown;
  dappOptions?: unknown;
  staticServerOptions?: unknown;
  ignoredConsoleErrors?: string[];
  disableServerMochaToBackground?: boolean;
  testSpecificMock?: () => Promise<unknown>;
  useMockingPassThrough?: boolean;
  useBundler?: boolean;
  usePaymaster?: boolean;
  ethConversionInUsd?: number;
  monConversionInUsd?: number;
  manifestFlags?: object;
  solanaWebSocketSpecificMocks?: unknown[];
  accountActivityWebSocketSpecificMocks?: unknown[];
  perpsWebSocketSpecificMocks?: unknown[];
  extendedTimeoutMultiplier?: number;

  speculosOptions?: {
    apduPort?: number;
    apiPort?: number;
    timeout?: number;
  };

  sharedContext?: SharedSpeculosContext;
  seedBalances?: { address: string; balance: string }[];
  smartContract?:
    | string
    | { name: string; deployerOptions?: object }
    | (string | { name: string; deployerOptions?: object })[];
};

export type SpeculosFixturesTestSuiteArgs = {
  bundlerServer?: unknown;
  contractRegistry: {
    getContractAddress: (name: string) => string | undefined;
    getAllDeployedContractAddresses: () => string[];
  };
  driver: Driver;
  localNodes?: Anvil[];
  mockedEndpoint?: unknown[];
  mockServer?: unknown;
  extensionId?: string;
  getNetworkReport?: () => unknown;
  clearNetworkReport?: () => unknown;
  speculosClient: SpeculosClient;
  speculosHelper: SpeculosTestHelper;
  apduBridge: ApduBridge;
  wsBridgePort: number;
  interaction: DeviceInteraction;
  deviceModel: DeviceModel;
};

export async function withSpeculosFixtures(
  options: WithSpeculosFixturesOptions,
  testSuite: (args: SpeculosFixturesTestSuiteArgs) => Promise<void>,
): Promise<void> {
  validateSpeculosTestEnv();

  const {
    speculosOptions = {},
    sharedContext,
    seedBalances,
    ...restOfOptions
  } = options;

  const { apduPort, apiPort } = speculosOptions;

  let speculosHelper: SpeculosTestHelper;
  let speculosClient: SpeculosClient;
  let apduBridge: ApduBridge;
  const wsBridgePort = SPECULOS_WS_BRIDGE_PORT;
  let ownsContainer = false;
  let interaction: DeviceInteraction;
  let deviceModel: DeviceModel;

  if (sharedContext) {
    speculosHelper = sharedContext.helper;
    speculosClient = sharedContext.client;
    apduBridge = sharedContext.apduBridge;
    interaction = sharedContext.interaction;
    deviceModel = sharedContext.deviceModel;
  } else {
    speculosHelper = new SpeculosTestHelper({
      apduPort,
      apiPort,
    });
    speculosClient = speculosHelper.getClient();
    apduBridge = new ApduBridge(speculosClient, wsBridgePort);
    ownsContainer = true;
    deviceModel = getDeviceModel();
    interaction = createDeviceInteraction(speculosClient, deviceModel);
    ensureDeviceEnv();

    console.log('[Speculos] Starting...');

    await speculosHelper.start();
    console.log('[Speculos] Started and ready');

    await apduBridge.start();
    await interaction.enableBlindSigning();
    console.log(`[Speculos] APDU bridge listening on port ${wsBridgePort}`);
  }

  // Patch lockdown-run.js in dist so offscreen document gets WebHID mock
  // (CDP injection only reaches the popup page, not the offscreen document)
  patchLockdownRunForSpeculos(wsBridgePort);

  const cleanup = async () => {
    revertLockdownRunPatches();
    if (!ownsContainer) {
      return;
    }
    console.log('[Speculos] Stopping APDU bridge...');
    await apduBridge.stop();
    console.log('[Speculos] Stopping...');
    await speculosHelper.stop();
  };

  const speculosIgnoredErrors = [
    'runtime.getManifest is not a function',
    'setupSentry',
    'getManifestFlags',
    'runtimeManifest',
    'Error getting extension installType',
  ];

  const existingIgnored = (restOfOptions as any).ignoredConsoleErrors ?? [];
  const mergedIgnored = [...existingIgnored, ...speculosIgnoredErrors];

  try {
    await withFixtures(
      {
        ...restOfOptions,
        ignoredConsoleErrors: mergedIgnored,
        seedBalances,
      },
      async ({ driver, ...restOfArgs }: any) => {
        // The pre-lockdown HTML patching (patchLockdownRunForSpeculos) injects
        // the WebHID mock into every extension page BEFORE runtime-lavamoat.js
        // runs, so navigator.hid survives LavaMoat scuttling. The CDP and
        // executeScript injection methods are no longer needed and would
        // actually interfere by setting __webHIDMockInjected before the
        // pre-lockdown script gets a chance to run.

        console.log('[Speculos] Ready for test execution');

        // Increase controller-loaded timeout — LavaMoat + mock setup adds overhead
        driver.timeout = 30_000;

        await testSuite({
          driver,
          ...restOfArgs,
          speculosClient,
          speculosHelper,
          apduBridge,
          wsBridgePort,
          interaction,
          deviceModel,
        } as SpeculosFixturesTestSuiteArgs);

        console.log('[Speculos] Test execution completed');
      },
    );
  } catch (error: unknown) {
    console.error('[Speculos] Test execution failed:', error);
    throw error;
  } finally {
    await cleanup();
    // Give Docker and the OS time to release ports before the next test starts
    if (ownsContainer) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function injectWebHIDMock(driver: Driver, wsPort: number): Promise<void> {
  await driver.executeScript(getWebHidMockScript(wsPort));
}

export { ApduBridge };
