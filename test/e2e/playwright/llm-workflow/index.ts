export {
  MetaMaskExtensionLauncher,
  launchMetaMask,
  DEFAULT_PASSWORD,
} from './extension-launcher';

export { HomePage } from './page-objects/home-page';
export { LoginPage } from './page-objects/login-page';
export { OnboardingFlow } from './page-objects/onboarding/onboarding-flow';
export { StartOnboardingPage } from './page-objects/onboarding/start-onboarding-page';
export { SrpPage } from './page-objects/onboarding/srp-page';
export { PasswordPage } from './page-objects/onboarding/password-page';
export { CompletePage } from './page-objects/onboarding/complete-page';

export { MockServer, DEFAULT_MOCK_PORT } from './mock-server';

export {
  createFixtureBuilder,
  buildDefaultFixture,
  buildOnboardingFixture,
  FixturePresets,
  FIXTURE_STATE_METADATA_VERSION,
} from './fixture-helper';

export type { IFixtureBuilder, FixtureBuilderOptions } from './fixture-helper';

export type {
  LaunchOptions,
  ScreenshotOptions,
  ScreenshotResult,
  ExtensionState,
  LauncherContext,
  StateMode,
  NetworkMode,
  NetworkConfig,
  MockServerConfig,
  FixtureData,
  ScreenName,
  PortsConfig,
} from './types';
