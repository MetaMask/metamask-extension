import type { Page, BrowserContext } from '@playwright/test';
import type { ManifestFlags } from '../../../../shared/lib/manifestFlags';

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
  headless?: boolean;
  screenshotDir?: string;
  stateMode?: StateMode;
  network?: NetworkConfig;
  fixture?: FixtureData;
  proxyServer?: string;
  manifestFlags?: Partial<ManifestFlags>;
  /**
   * Restore the supplied secret recovery phrase and finish onboarding inside
   * `launch()`, instead of leaving the extension on the onboarding UI.
   */
  selfOnboarding?: boolean;
  /** Secret recovery phrase used when `selfOnboarding` is set. Cleared after use. */
  srp?: string;
  /**
   * Vault password set and used to unlock when `selfOnboarding` is set.
   * Defaults to the e2e password. Cleared after use.
   */
  password?: string;
  /**
   * Directory that receives an opt-in screen recording of every page.
   * Recording starts after onboarding, so no secrets are captured. When
   * unset, `MM_SCREENCAST_DIR` is used as a fallback.
   */
  screencastDir?: string;
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

/**
 * The route the extension shows, named by `getScreenName` (e.g. `home`,
 * `activity`, `account-list`, `settings-privacy`), or `notification` /
 * `unknown` when no route matches.
 */
export type ScreenName = string;

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
  activeTab?: {
    role: string;
    url: string;
    title?: string;
  };
};

export type LauncherContext = {
  context: BrowserContext;
  extensionPage: Page;
  extensionId: string;
};
