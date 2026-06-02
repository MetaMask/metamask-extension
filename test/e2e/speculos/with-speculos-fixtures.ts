/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Speculos,
  SpeculosClient,
  ApduBridge,
  type LedgerDeviceInteraction,
} from '@metamask/hw-emulator';
import { withFixtures } from '../helpers';
import { Anvil } from '../seeder/anvil';
import { Driver } from '../webdriver/driver';
import { validateSpeculosTestEnv, type DeviceModel } from './build-config';
import {
  startSharedSpeculos,
  stopSharedSpeculos,
  type SharedSpeculosContext,
} from './shared-context';

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
    sharedContext: existingSharedContext,
    seedBalances,
    ...restOfOptions
  } = options;

  let ctx: SharedSpeculosContext;
  let ownsContainer = false;

  if (existingSharedContext) {
    ctx = existingSharedContext;
  } else {
    ctx = await startSharedSpeculos({
      apduPort: speculosOptions.apduPort,
      apiPort: speculosOptions.apiPort,
    });
    ownsContainer = true;
  }

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

        driver.timeout = 30_000;

        await testSuite({
          driver,
          ...restOfArgs,
          speculosClient: ctx.client,
          speculos: ctx.speculos,
          apduBridge: ctx.apduBridge,
          wsBridgePort: ctx.wsBridgePort,
          interaction: ctx.interaction,
          deviceModel: ctx.deviceModel,
        } as SpeculosFixturesTestSuiteArgs);

        console.log('[Speculos] Test execution completed');
      },
    );
  } catch (error: unknown) {
    console.error('[Speculos] Test execution failed:', error);
    throw error;
  } finally {
    if (ownsContainer) {
      await stopSharedSpeculos(ctx);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

export { ApduBridge };
export type { SharedSpeculosContext };
export { startSharedSpeculos, stopSharedSpeculos } from './shared-context';
