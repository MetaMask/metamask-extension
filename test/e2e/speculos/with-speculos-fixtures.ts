/* eslint-disable @typescript-eslint/no-explicit-any */
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
import type { SharedSpeculosContext } from './shared-context';
import type { DeviceInteraction } from './device-interaction';
import type { DeviceModel } from './constants';
import { createDeviceInteraction } from './device-interaction';

export type { SharedSpeculosContext } from './shared-context';
export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';

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

  // The WebHID mock is injected at build time by SpeculosPlugin (webpack).
  // It runs BEFORE LavaMoat SES lockdown on every extension page, so
  // navigator.hid survives scuttling. No post-build patching needed.

  const cleanup = async () => {
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

export { ApduBridge };
