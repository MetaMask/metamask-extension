/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Speculos,
  SpeculosClient,
  ApduBridge,
  SPECULOS_WS_BRIDGE_PORT,
  getDeviceModel,
  type LedgerDeviceInteraction,
  type DeviceModel,
} from '@metamask/hw-emulator';
import { withFixtures } from '../helpers';
import { Anvil } from '../seeder/anvil';
import { Driver } from '../webdriver/driver';
import { validateSpeculosTestEnv } from './build-config';
import type { SharedSpeculosContext } from './shared-context';

export type { SharedSpeculosContext } from './shared-context';
export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';

/** Options accepted by {@link withSpeculosFixtures}. Extends the standard `withFixtures` options with Speculos-specific fields. */
export type WithSpeculosFixturesOptions = {
  fixtures: unknown;
  title?: string;
  localNodeOptions?: string | object | unknown[];
  driverOptions?: unknown;
  dappOptions?: unknown;
  staticServerOptions?: unknown;
  ignoredConsoleErrors?: string[];
  disableServerMochaToBackground?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testSpecificMock?: (...args: any[]) => Promise<any>;
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

/** Arguments passed to the test suite callback inside {@link withSpeculosFixtures}. */
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
  speculos: Speculos;
  apduBridge: ApduBridge;
  wsBridgePort: number;
  interaction: LedgerDeviceInteraction;
  deviceModel: DeviceModel;
};

/**
 * Read the device model from the SPECULOS_DEVICE env var (falls back to flex).
 */
function getDeviceModelFromEnv(): DeviceModel {
  const id = process.env.SPECULOS_DEVICE ?? 'flex';
  return getDeviceModel(id);
}

/**
 * Ensure SPECULOS_DEVICE and SPECULOS_ELF env vars are set.
 * These are read by docker-compose.yml when running in Docker mode.
 */
function ensureDeviceEnv(): void {
  const model = getDeviceModelFromEnv();
  if (!process.env.SPECULOS_DEVICE) {
    process.env.SPECULOS_DEVICE = model.id;
  }
  if (!process.env.SPECULOS_ELF) {
    process.env.SPECULOS_ELF = model.elfFile;
  }
}

/**
 * Run a test suite with Speculos hardware emulation and standard E2E fixtures.
 *
 * Wraps the base `withFixtures` helper — starts a Speculos instance (or reuses
 * a shared one via {@link SharedSpeculosContext}), connects the APDU bridge,
 * enables blind signing, then hands off to the test suite.
 *
 * @param options - Speculos-aware fixture options (see {@link WithSpeculosFixturesOptions}).
 * @param testSuite - The test callback receiving driver, speculos client, bridge, and interaction handle.
 */
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

  let speculos: Speculos;
  let speculosClient: SpeculosClient;
  let apduBridge: ApduBridge;
  const wsBridgePort = SPECULOS_WS_BRIDGE_PORT;
  let ownsContainer = false;
  let interaction: LedgerDeviceInteraction;
  let deviceModel: DeviceModel;

  if (sharedContext) {
    speculos = sharedContext.speculos;
    speculosClient = sharedContext.client;
    apduBridge = sharedContext.apduBridge;
    interaction = sharedContext.interaction;
    deviceModel = sharedContext.deviceModel;
  } else {
    deviceModel = getDeviceModelFromEnv();
    ensureDeviceEnv();

    speculos = new Speculos({
      device: deviceModel.id,
      apduPort,
      apiPort,
      wsBridgePort,
    });
    ownsContainer = true;

    console.log('[Speculos] Starting...');

    await speculos.start();
    console.log('[Speculos] Started and ready');

    speculosClient = speculos.getClient();
    apduBridge = await speculos.startBridge(wsBridgePort);
    interaction = speculos.getInteraction() as LedgerDeviceInteraction;
    await interaction.enableBlindSigning();
    console.log(`[Speculos] APDU bridge listening on port ${wsBridgePort}`);
  }

  // The WebHID mock is injected at build time by SpeculosPlugin (webpack).
  // It runs BEFORE LavaMoat SES lockdown on every extension page, so
  // navigator.hid survives scuttling. No post-build patching needed.

  const cleanup = async () => {
    if (!ownsContainer) {
      return;
    }
    console.log('[Speculos] Stopping...');
    await speculos.stop();
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
        console.log('[Speculos] Ready for test execution');

        // Increase controller-loaded timeout — LavaMoat + mock setup adds overhead
        driver.timeout = 30_000;

        await testSuite({
          driver,
          ...restOfArgs,
          speculosClient,
          speculos,
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

export { ApduBridge };
