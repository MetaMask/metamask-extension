import type { Page, BrowserContext } from '@playwright/test';
import { MetaMaskExtensionLauncher, launchMetaMask, FixturePresets } from '..';
import type { FixtureData, LaunchOptions, ExtensionState } from '../types';
import type { AnvilSeederWrapper } from '../anvil-seeder-wrapper';
import {
  type SessionState,
  type LaunchInput,
  type SessionMetadata,
  type TabRole,
  ErrorCodes,
  generateSessionId,
} from './types';
import { knowledgeStore } from './knowledge-store';

export type TrackedPage = {
  role: TabRole;
  url: string;
  page: Page;
};

const DEFAULT_ANVIL_PORT = 8545;
const DEFAULT_FIXTURE_SERVER_PORT = 12345;

export class SessionManager {
  private activeSession: {
    state: SessionState;
    launcher: MetaMaskExtensionLauncher;
  } | null = null;

  private activePage: Page | undefined;

  private refMap: Map<string, string> = new Map();

  hasActiveSession(): boolean {
    return this.activeSession !== null;
  }

  getSessionId(): string | undefined {
    return this.activeSession?.state.sessionId;
  }

  getSessionState(): SessionState | undefined {
    return this.activeSession?.state;
  }

  private sessionMetadata: SessionMetadata | undefined;

  getSessionMetadata(): SessionMetadata | undefined {
    return this.sessionMetadata;
  }

  getLauncher(): MetaMaskExtensionLauncher | undefined {
    return this.activeSession?.launcher;
  }

  getSeeder(): AnvilSeederWrapper {
    if (!this.activeSession) {
      throw new Error('No active session. Call launch() first.');
    }
    return this.activeSession.launcher.getSeeder();
  }

  private isActivePageValid(): boolean {
    return Boolean(this.activePage && !this.activePage.isClosed());
  }

  private fallbackToExtensionPage(): Page {
    const extensionPage = (
      this.activeSession as { launcher: MetaMaskExtensionLauncher }
    ).launcher.getPage();
    this.activePage = extensionPage;
    this.clearRefMap();
    return extensionPage;
  }

  getPage(): Page {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    if (this.isActivePageValid()) {
      return this.activePage as Page;
    }
    return this.fallbackToExtensionPage();
  }

  setActivePage(page: Page): void {
    this.activePage = page;
    this.clearRefMap();
  }

  getTrackedPages(): TrackedPage[] {
    if (!this.activeSession) {
      return [];
    }

    const context = this.getContext();
    const { extensionId } = this.activeSession.state;

    return context
      .pages()
      .filter((page) => !page.isClosed())
      .map((page) => ({
        role: this.classifyPageRole(page, extensionId),
        url: page.url(),
        page,
      }));
  }

  classifyPageRole(page: Page, extensionId?: string): TabRole {
    const url = page.url();
    if (!extensionId) {
      return 'other';
    }

    const extPrefix = `chrome-extension://${extensionId}`;
    if (url.includes('notification.html')) {
      return 'notification';
    }
    if (url.startsWith(extPrefix)) {
      return 'extension';
    }
    if (url.startsWith('http')) {
      return 'dapp';
    }
    return 'other';
  }

  getContext(): BrowserContext {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activeSession.launcher.getContext();
  }

  async getExtensionState(): Promise<ExtensionState> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activeSession.launcher.getState();
  }

  setRefMap(map: Map<string, string>): void {
    this.refMap = map;
  }

  getRefMap(): Map<string, string> {
    return this.refMap;
  }

  clearRefMap(): void {
    this.refMap.clear();
  }

  resolveA11yRef(ref: string): string | undefined {
    return this.refMap.get(ref);
  }

  async launch(input: LaunchInput): Promise<{
    sessionId: string;
    extensionId: string;
    state: ExtensionState;
  }> {
    if (this.activeSession) {
      throw new Error(ErrorCodes.MM_SESSION_ALREADY_RUNNING);
    }

    const sessionId = generateSessionId();
    const stateMode = input.stateMode ?? 'default';

    let fixture: FixtureData | undefined;
    if (stateMode === 'custom') {
      if (input.fixturePreset) {
        fixture = this.resolveFixturePreset(input.fixturePreset);
      } else if (input.fixture) {
        fixture = { data: input.fixture };
      }
    }

    const launchOptions: LaunchOptions = {
      autoBuild: input.autoBuild ?? true,
      stateMode,
      fixture,
      slowMo: input.slowMo ?? 0,
      extensionPath: input.extensionPath,
      ports: {
        anvil: input.ports?.anvil ?? DEFAULT_ANVIL_PORT,
        fixtureServer:
          input.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT,
      },
    };

    const launcher = await launchMetaMask(launchOptions);
    const extensionState = await launcher.getState();

    const startedAt = new Date().toISOString();

    this.activeSession = {
      state: {
        sessionId,
        extensionId: extensionState.extensionId,
        startedAt,
        ports: {
          anvil: launchOptions.ports?.anvil ?? DEFAULT_ANVIL_PORT,
          fixtureServer:
            launchOptions.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT,
        },
        stateMode,
      },
      launcher,
    };

    this.activePage = launcher.getPage();

    const sessionMetadata: SessionMetadata = {
      schemaVersion: 1,
      sessionId,
      createdAt: startedAt,
      goal: input.goal,
      flowTags: input.flowTags ?? [],
      tags: input.tags ?? [],
      git: knowledgeStore.getGitInfoSync(),
      build: {
        buildType: 'build:test',
        extensionPathResolved: input.extensionPath,
      },
      launch: {
        stateMode,
        fixturePreset: input.fixturePreset ?? null,
        extensionPath: input.extensionPath,
        ports: {
          anvil: launchOptions.ports?.anvil ?? DEFAULT_ANVIL_PORT,
          fixtureServer:
            launchOptions.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT,
        },
      },
    };

    await knowledgeStore.writeSessionMetadata(sessionMetadata);

    this.sessionMetadata = sessionMetadata;

    return {
      sessionId,
      extensionId: extensionState.extensionId,
      state: extensionState,
    };
  }

  async cleanup(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    await this.activeSession.launcher.cleanup();
    this.activeSession = null;
    this.activePage = undefined;
    this.sessionMetadata = undefined;
    this.clearRefMap();
    return true;
  }

  async navigateToHome(): Promise<void> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    await this.activeSession.launcher.navigateToHome();
    const extensionPage = this.activeSession.launcher.getPage();
    this.setActivePage(extensionPage);
  }

  async navigateToSettings(): Promise<void> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    await this.activeSession.launcher.navigateToSettings();
    const extensionPage = this.activeSession.launcher.getPage();
    this.setActivePage(extensionPage);
  }

  async navigateToUrl(url: string): Promise<Page> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    const context = this.getContext();
    const newPage = await context.newPage();
    await newPage.goto(url);
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async navigateToNotification(): Promise<Page> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }

    const context = this.getContext();
    const { extensionId } = this.activeSession.state;
    const notificationUrl = `chrome-extension://${extensionId}/notification.html`;

    const existingNotification = context
      .pages()
      .find((p) => p.url().includes('notification.html'));

    if (existingNotification) {
      await existingNotification.bringToFront();
      await existingNotification.waitForLoadState('domcontentloaded');
      this.setActivePage(existingNotification);
      return existingNotification;
    }

    const newPage = await context.newPage();
    await newPage.goto(notificationUrl);
    await newPage.waitForLoadState('domcontentloaded');
    this.setActivePage(newPage);
    return newPage;
  }

  async waitForNotificationPage(timeoutMs: number): Promise<Page> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    const notificationPage =
      await this.activeSession.launcher.waitForNotificationPage(timeoutMs);
    this.setActivePage(notificationPage);
    return notificationPage;
  }

  async screenshot(options: {
    name: string;
    fullPage?: boolean;
    selector?: string;
  }): Promise<{ path: string; base64: string; width: number; height: number }> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }

    return this.activeSession.launcher.screenshot({
      ...options,
      page: this.getPage(),
    });
  }

  private resolveFixturePreset(presetName: string): FixtureData {
    const presetMap: Record<string, () => FixtureData> = {
      default: FixturePresets.default,
      onboarding: FixturePresets.onboarding,
      withMultipleAccounts: FixturePresets.withMultipleAccounts,
      withERC20Tokens: FixturePresets.withERC20Tokens,
      withConnectedDapp: FixturePresets.withConnectedDapp,
      withPopularNetworks: FixturePresets.withPopularNetworks,
      withMainnet: FixturePresets.withMainnet,
      withNFTs: FixturePresets.withNFTs,
      withFiatDisabled: FixturePresets.withFiatDisabled,
      withHSTToken: FixturePresets.withHSTToken,
    };

    const presetFn = presetMap[presetName];
    if (!presetFn) {
      throw new Error(
        `Unknown fixture preset: ${presetName}. ` +
          `Available presets: ${Object.keys(presetMap).join(', ')}`,
      );
    }

    return presetFn();
  }
}

export const sessionManager = new SessionManager();
