import type { Page, BrowserContext } from '@playwright/test';

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

export type FixtureData = {
  data: Record<string, unknown>;
  meta?: { version: number };
};

export type LaunchOptions = {
  extensionPath?: string;
  userDataDir?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  slowMo?: number;
  /**
   * Whether to automatically build the extension before launching.
   * This option is handled by the MCP session manager (BuildCapability) and is ignored by the launcher.
   * The launcher only validates that the extension is already built.
   *
   * @default true (when using MCP workflow with BuildCapability)
   */
  autoBuild?: boolean;
  screenshotDir?: string;
  stateMode?: StateMode;
  network?: NetworkConfig;
  fixture?: FixtureData;
};

export type LauncherLaunchOptions = LaunchOptions;

export type ScreenshotOptions = {
  name: string;
  fullPage?: boolean;
  selector?: string;
  timestamp?: boolean;
  /** Optional page to capture. Defaults to extension page if not provided. */
  page?: Page;
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
