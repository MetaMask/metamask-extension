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

const SPECULOS_LOCKDOWN_MARKER = '/* __SPECULOS_MOCK__ */';

function patchLockdownRunForSpeculos(wsPort: number): void {
  // The offscreen's built-in mock (speculos-webhid-mock.ts) needs a working
  // WebSocket constructor, but LavaMoat lockdown scuttles it. We inject a
  // pre-lockdown script that sets up the full mock BEFORE lockdown runs,
  // so the mock's navigator.hid replacement is already in place when the
  // LavaMoat module checks and skips re-installation.
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

  const offscreenHtmlPath = path.join('dist', 'chrome', 'offscreen.html');
  if (!fs.existsSync(offscreenHtmlPath)) {
    console.warn(`[Speculos] ${offscreenHtmlPath} not found, skipping patch`);
    return;
  }

  let html = fs.readFileSync(offscreenHtmlPath, 'utf-8');

  if (html.includes('speculos-webhid-mock.js')) {
    console.log('[Speculos] offscreen.html already patched');
    return;
  }

  html = html.replace(
    '<script src="./scripts/runtime-lavamoat.js"',
    '<script src="./scripts/speculos-webhid-mock.js"></script>\n    <script src="./scripts/runtime-lavamoat.js"',
  );

  fs.writeFileSync(offscreenHtmlPath, html);
  console.log(
    '[Speculos] Injected WebHID mock script into offscreen.html (pre-lockdown)',
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
  wsBridgePort: number;
};

export async function withSpeculosFixtures(
  options: WithSpeculosFixturesOptions,
  testSuite: (args: SpeculosFixturesTestSuiteArgs) => Promise<void>,
): Promise<void> {
  validateSpeculosTestEnv();

  const { speculosOptions = {}, ...restOfOptions } = options;

  const {
    composeFile = SPECULOS_COMPOSE_FILE,
    apduPort,
    apiPort,
    autoApprove = false,
    wsBridgePort: preferredPort = SPECULOS_WS_BRIDGE_PORT,
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

  const wsBridgePort = await findAvailablePort(preferredPort);

  // Patch lockdown-run.js in dist so offscreen document gets WebHID mock
  // (CDP injection only reaches the popup page, not the offscreen document)
  patchLockdownRunForSpeculos(wsBridgePort);

  const speculosHelper = new SpeculosTestHelper({
    composeFile,
    apduPort,
    apiPort,
  });
  const speculosClient = speculosHelper.getClient();
  const automation = new SpeculosAutomation(speculosClient);
  const apduBridge = new ApduBridge(speculosClient, wsBridgePort);

  console.log(`[Speculos] Starting container (compose: ${composeFile})...`);

  await speculosHelper.start();
  console.log('[Speculos] Container started and ready');

  await apduBridge.start();
  console.log(`[Speculos] APDU bridge listening on port ${wsBridgePort}`);

  const cleanup = async () => {
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
        speculosOptions: {
          wsBridgePort,
        },
      },
      async ({ driver, ...restOfArgs }: any) => {
        console.log('[Speculos] WebHID mock configured for offscreen document');

        // Use CDP to inject mock on every new document in main context
        await driver.injectWebHIDMockViaCDP(wsBridgePort);

        // Also inject immediately in current context
        // CDP injection runs in main world; executeScript runs in SES/LavaMoat
        // context where WebSocket may be blocked by scuttling, so catch gracefully
        try {
          await injectWebHIDMock(driver, wsBridgePort);
        } catch (e) {
          console.log(
            '[Speculos] executeScript injection failed (LavaMoat scuttling), CDP injection is sufficient',
            (e as Error).message,
          );
        }

        if (autoApprove) {
          console.log('[Speculos] Enabling auto-approval mode...');
          await automation.enableAutoApprove();
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
