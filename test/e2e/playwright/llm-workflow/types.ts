import type { Page, BrowserContext } from '@playwright/test';
import type { Mockttp } from 'mockttp';

export type StateMode = 'default' | 'onboarding' | 'custom';

export type NetworkMode = 'localhost' | 'fork' | 'custom';

export type NetworkConfig = {
  mode?: NetworkMode;
  chainId?: number;
  rpcUrl?: string;
  forkBlockNumber?: number;
  chainName?: string;
  nativeCurrency?: {
    symbol: string;
    decimals: number;
  };
};

export type MockServerConfig = {
  enabled?: boolean;
  port?: number;
  testSpecificMock?: (mockServer: Mockttp) => Promise<void>;
};

export type FixtureData = {
  data: Record<string, unknown>;
  meta?: { version: number };
};

export type PortsConfig = {
  anvil?: number;
  fixtureServer?: number;
};

export type LaunchOptions = {
  extensionPath?: string;
  userDataDir?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  slowMo?: number;
  autoBuild?: boolean;
  screenshotDir?: string;
  stateMode?: StateMode;
  network?: NetworkConfig;
  mockServer?: MockServerConfig;
  fixture?: FixtureData;
  ports?: PortsConfig;
};

export type ScreenshotOptions = {
  name: string;
  fullPage?: boolean;
  selector?: string;
  timestamp?: boolean;
};

export type ScreenshotResult = {
  path: string;
  base64: string;
  width: number;
  height: number;
};

export type ScreenName =
  | 'unlock'
  | 'home'
  | 'onboarding-welcome'
  | 'onboarding-import'
  | 'onboarding-create'
  | 'onboarding-srp'
  | 'onboarding-password'
  | 'onboarding-complete'
  | 'onboarding-metametrics'
  | 'settings'
  | 'send'
  | 'swap'
  | 'bridge'
  | 'confirm-transaction'
  | 'confirm-signature'
  | 'notification'
  | 'unknown';

export type ExtensionState = {
  isLoaded: boolean;
  currentUrl: string;
  extensionId: string;
  isUnlocked: boolean;
  currentScreen: ScreenName;
  accountAddress: string | null;
  networkName: string | null;
  chainId: number | null;
  balance: string | null;
};

export type LauncherContext = {
  context: BrowserContext;
  extensionPage: Page;
  extensionId: string;
};
