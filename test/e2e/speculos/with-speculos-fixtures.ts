/* eslint-disable @typescript-eslint/no-explicit-any */
import net from 'net';
import fs from 'fs';
import path from 'path';
import { withFixtures } from '../helpers';
import { Anvil } from '../seeder/anvil';
import { Driver } from '../webdriver/driver';
import { SpeculosTestHelper } from './test-helper';
import { SpeculosClient } from './client';
import { SpeculosAutomation } from './automation';
import { ApduBridge } from './apdu-bridge';
import { validateSpeculosTestEnv } from './build-config';
import { SPECULOS_COMPOSE_FILE, SPECULOS_WS_BRIDGE_PORT } from './constants';
import { getWebHidMockScript } from './webhid-mock-script';
import type { SharedSpeculosContext } from './shared-context';

export type { SharedSpeculosContext } from './shared-context';
export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';

const SPECULOS_LOCKDOWN_MARKER = '/* __SPECULOS_MOCK__ */';

function patchLockdownRunForSpeculos(wsPort: number): void {
  // LavaMoat lockdown scuttles navigator.hid (and WebSocket) in every
  // extension page's SES compartment.  We inject a pre-lockdown script
  // that sets up the full WebHID mock BEFORE lockdown runs, so
  // navigator.hid is already available when the app code checks for it.
  // This must be done for ALL extension HTML pages (popup, notification
  // dialog, home, sidepanel, offscreen) — not just offscreen.
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
  const htmlFiles = fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith('.html'));

  let patchedCount = 0;
  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(distDir, htmlFile);
    let html = fs.readFileSync(htmlPath, 'utf-8');

    if (html.includes('speculos-webhid-mock.js')) {
      continue;
    }

    if (!html.includes('runtime-lavamoat.js')) {
      continue;
    }

    html = html.replace(
      '<script src="./scripts/runtime-lavamoat.js"',
      '<script src="./scripts/speculos-webhid-mock.js"></script>\n    <script src="./scripts/runtime-lavamoat.js"',
    );

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
    composeFile?: string;
    apduPort?: number;
    apiPort?: number;
    autoApprove?: boolean;
    timeout?: number;
    wsBridgePort?: number;
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
  contractRegistry?: unknown;
  driver: Driver;
  localNodes?: Anvil[];
  mockedEndpoint?: unknown[];
  mockServer?: unknown;
  extensionId?: string;
  getNetworkReport?: () => unknown;
  clearNetworkReport?: () => unknown;
  speculosClient: SpeculosClient;
  automation: SpeculosAutomation;
  speculosHelper: SpeculosTestHelper;
  apduBridge: ApduBridge;
  wsBridgePort: number;
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

  const {
    composeFile = SPECULOS_COMPOSE_FILE,
    apduPort,
    apiPort,
    autoApprove = false,
  } = speculosOptions;

  // Find an available port
  const findAvailablePort = async (startPort: number): Promise<number> => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const { port } = server.address() as net.AddressInfo;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        // Port in use, try next
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      });
    });
  };

  let speculosHelper: SpeculosTestHelper;
  let speculosClient: SpeculosClient;
  let automation: SpeculosAutomation;
  let apduBridge: ApduBridge;
  let wsBridgePort: number;
  let ownsContainer = false;

  if (sharedContext) {
    speculosHelper = sharedContext.helper;
    speculosClient = sharedContext.client;
    automation = sharedContext.automation;
    apduBridge = sharedContext.apduBridge;
    wsBridgePort = sharedContext.wsBridgePort;
  } else {
    wsBridgePort = await findAvailablePort(
      speculosOptions.wsBridgePort ?? SPECULOS_WS_BRIDGE_PORT,
    );

    speculosHelper = new SpeculosTestHelper({
      composeFile,
      apduPort,
      apiPort,
    });
    speculosClient = speculosHelper.getClient();
    automation = new SpeculosAutomation(speculosClient);
    apduBridge = new ApduBridge(speculosClient, wsBridgePort);
    ownsContainer = true;

    console.log(`[Speculos] Starting container (compose: ${composeFile})...`);

    await speculosHelper.start();
    console.log('[Speculos] Container started and ready');

    await apduBridge.start();
    console.log(`[Speculos] APDU bridge listening on port ${wsBridgePort}`);
  }

  // Patch lockdown-run.js in dist so offscreen document gets WebHID mock
  // (CDP injection only reaches the popup page, not the offscreen document)
  patchLockdownRunForSpeculos(wsBridgePort);

  const cleanup = async () => {
    if (!ownsContainer) {
      return;
    }
    console.log('[Speculos] Stopping APDU bridge...');
    await apduBridge.stop();
    console.log('[Speculos] Stopping container...');
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
        speculosOptions: {
          wsBridgePort,
        },
      },
      async ({ driver, ...restOfArgs }: any) => {
        // The pre-lockdown HTML patching (patchLockdownRunForSpeculos) injects
        // the WebHID mock into every extension page BEFORE runtime-lavamoat.js
        // runs, so navigator.hid survives LavaMoat scuttling. The CDP and
        // executeScript injection methods are no longer needed and would
        // actually interfere by setting __webHIDMockInjected before the
        // pre-lockdown script gets a chance to run.

        // shared context may have leftover automation rules from the previous test
        if (sharedContext && !autoApprove) {
          try {
            await automation.disableAutoApprove();
          } catch {
            // ignore — rules may already be clear
          }
        }

        if (autoApprove) {
          console.log('[Speculos] Auto-approval mode requested (no-op with manual approval)');
        }

        console.log('[Speculos] Ready for test execution');

        // Increase controller-loaded timeout — LavaMoat + mock setup adds overhead
        driver.timeout = 30_000;

        await testSuite({
          driver,
          ...restOfArgs,
          speculosClient,
          automation,
          speculosHelper,
          apduBridge,
          wsBridgePort,
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export async function withSpeculosAutoApprove(
  options: WithSpeculosFixturesOptions,
  testSuite: (args: SpeculosFixturesTestSuiteArgs) => Promise<void>,
): Promise<void> {
  return withSpeculosFixtures(
    {
      ...options,
      speculosOptions: {
        ...options.speculosOptions,
        autoApprove: true,
      },
    },
    testSuite,
  );
}

async function injectWebHIDMock(driver: Driver, wsPort: number): Promise<void> {
  await driver.executeScript(getWebHidMockScript(wsPort));
}

export { ApduBridge };
