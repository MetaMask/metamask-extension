import type { Page, BrowserContext } from '@playwright/test';
import {
  type ISessionManager,
  type TrackedPage,
  type SessionLaunchInput,
  type SessionLaunchResult,
  type SessionScreenshotOptions,
  type TabRole,
  type SessionState,
  type SessionMetadata,
  type ScreenshotResult,
  type BuildCapability,
  type FixtureCapability,
  type ChainCapability,
  type ContractSeedingCapability,
  type StateSnapshotCapability,
  type ExtensionState,
  type WorkflowContext,
  type EnvironmentMode,
  ErrorCodes,
  generateSessionId,
  knowledgeStore,
  MockServerCapability,
} from '@metamask/client-mcp-core';

import { MetaMaskExtensionLauncher, launchMetaMask } from '..';
import {
  createMetaMaskE2EContext,
  createMetaMaskProdContext,
} from '../capabilities/factory';
import type { LauncherLaunchOptions } from '../launcher-types';
import type { AnvilSeederWrapper } from '../anvil-seeder-wrapper';
import type { MetaMaskFixtureCapability } from '../capabilities/fixture';
import type { MetaMaskContractSeedingCapability } from '../capabilities/seeding';

const DEFAULT_ANVIL_PORT = 8545;
const DEFAULT_FIXTURE_SERVER_PORT = 12345;

export class MetaMaskSessionManager implements ISessionManager {
  private activeSession: {
    state: SessionState;
    launcher: MetaMaskExtensionLauncher;
  } | null = null;

  private activePage: Page | undefined;

  private refMap: Map<string, string> = new Map();

  private workflowContext: WorkflowContext | undefined;

  private sessionMetadata: SessionMetadata | undefined;

  hasActiveSession(): boolean {
    return this.activeSession !== null;
  }

  setWorkflowContext(context: WorkflowContext): void {
    this.workflowContext = context;
  }

  getWorkflowContext(): WorkflowContext | undefined {
    return this.workflowContext;
  }

  getEnvironmentMode(): EnvironmentMode {
    return this.workflowContext?.config?.environment ?? 'e2e';
  }

  getBuildCapability(): BuildCapability | undefined {
    return this.workflowContext?.build;
  }

  getFixtureCapability(): FixtureCapability | undefined {
    return this.workflowContext?.fixture;
  }

  getChainCapability(): ChainCapability | undefined {
    return this.workflowContext?.chain;
  }

  getContractSeedingCapability(): ContractSeedingCapability | undefined {
    return this.workflowContext?.contractSeeding;
  }

  getStateSnapshotCapability(): StateSnapshotCapability | undefined {
    return this.workflowContext?.stateSnapshot;
  }

  private getMockServerCapability(): MockServerCapability | undefined {
    return this.workflowContext?.mockServer;
  }

  setContext(context: 'e2e' | 'prod'): void {
    if (this.hasActiveSession()) {
      throw new Error(
        `${ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED}: Cannot switch context while session is active. ` +
          `Current session: ${this.getSessionId()}. Call mm_cleanup first.`,
      );
    }

    const currentContext = this.getEnvironmentMode();
    if (currentContext === context) {
      return;
    }

    const newContext =
      context === 'e2e'
        ? createMetaMaskE2EContext()
        : createMetaMaskProdContext();

    this.setWorkflowContext(newContext as WorkflowContext);
  }

  getContextInfo(): {
    currentContext: 'e2e' | 'prod';
    hasActiveSession: boolean;
    sessionId: string | null;
    capabilities: { available: string[] };
    canSwitchContext: boolean;
  } {
    const context = this.getEnvironmentMode();
    const hasSession = this.hasActiveSession();

    const availableCapabilities: string[] = [];
    if (this.getBuildCapability()) {
      availableCapabilities.push('build');
    }
    if (this.getFixtureCapability()) {
      availableCapabilities.push('fixture');
    }
    if (this.getChainCapability()) {
      availableCapabilities.push('chain');
    }
    if (this.getContractSeedingCapability()) {
      availableCapabilities.push('contractSeeding');
    }
    if (this.getStateSnapshotCapability()) {
      availableCapabilities.push('stateSnapshot');
    }
    if (this.getMockServerCapability()) {
      availableCapabilities.push('mockServer');
    }

    return {
      currentContext: context,
      hasActiveSession: hasSession,
      sessionId: this.getSessionId() ?? null,
      capabilities: { available: availableCapabilities },
      canSwitchContext: !hasSession,
    };
  }

  getSessionId(): string | undefined {
    return this.activeSession?.state.sessionId;
  }

  getSessionState(): SessionState | undefined {
    return this.activeSession?.state;
  }

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

    const contractSeeding = this.getContractSeedingCapability() as
      | MetaMaskContractSeedingCapability
      | undefined;
    if (!contractSeeding) {
      throw new Error('ContractSeedingCapability not available.');
    }

    return contractSeeding.getSeeder();
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
    if (url.startsWith(extPrefix)) {
      return url.includes('notification.html') ? 'notification' : 'extension';
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

    const stateSnapshot = this.getStateSnapshotCapability();
    if (!stateSnapshot) {
      throw new Error('StateSnapshotCapability is not available.');
    }

    const chainId = this.workflowContext?.config?.defaultChainId ?? 1337;
    const extensionPage = this.activeSession.launcher.getPage();

    return stateSnapshot.getState(extensionPage, {
      extensionId: this.activeSession.state.extensionId,
      chainId,
    });
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

  async launch(input: SessionLaunchInput): Promise<SessionLaunchResult> {
    if (this.activeSession) {
      throw new Error(ErrorCodes.MM_SESSION_ALREADY_RUNNING);
    }

    const sessionId = generateSessionId();
    const stateMode = input.stateMode ?? 'default';
    const autoBuild = input.autoBuild ?? true;
    const environment = this.workflowContext?.config?.environment ?? 'e2e';
    const isProdMode = environment === 'prod';

    let { extensionPath } = input;

    // In prod mode, reject fixture-related options (no fixtures available)
    if (isProdMode && (input.fixturePreset || input.fixture)) {
      throw new Error(
        'Fixture options (fixturePreset, fixture) are not available in prod mode.\n\n' +
          'Prod mode does not support fixtures. Options:\n' +
          '  1. Remove fixturePreset/fixture parameters\n' +
          '  2. Use stateMode: "onboarding" for fresh wallet setup\n' +
          '  3. Switch to e2e environment for fixture support',
      );
    }

    // Handle build logic
    if (autoBuild) {
      const buildCapability = this.getBuildCapability();
      if (!buildCapability) {
        throw new Error(
          'autoBuild is enabled but BuildCapability is not available.\n\n' +
            'Options:\n' +
            '  1. Use mm_build tool first to build the extension\n' +
            '  2. Set autoBuild: false and provide extensionPath\n' +
            '  3. Ensure BuildCapability is registered in the workflow context',
        );
      }

      const buildResult = await buildCapability.build({ force: false });
      if (!buildResult.success) {
        throw new Error(
          `Build failed: ${buildResult.error ?? 'Unknown error'}\n\n` +
            'Use mm_build tool to diagnose build issues.',
        );
      }

      if (!extensionPath && buildResult.extensionPath) {
        extensionPath = buildResult.extensionPath;
      }
    }

    // Handle fixture capability based on environment
    const fixtureCapability = this.getFixtureCapability() as
      | MetaMaskFixtureCapability
      | undefined;

    // In e2e mode, fixture capability is required
    // In prod mode, fixture capability is never started (even if available)
    if (!isProdMode) {
      if (!fixtureCapability) {
        throw new Error(
          'FixtureCapability is not available.\n\n' +
            'Ensure FixtureCapability is registered in the workflow context.',
        );
      }

      const fixtureState = fixtureCapability.resolveState({
        stateMode,
        fixturePreset: input.fixturePreset,
        fixture: input.fixture,
      });

      await fixtureCapability.start(fixtureState);
    }

    const chainCapability = this.getChainCapability();
    if (chainCapability) {
      const anvilPort = input.ports?.anvil ?? DEFAULT_ANVIL_PORT;
      if (chainCapability.setPort) {
        chainCapability.setPort(anvilPort);
      }
      await chainCapability.start();
    }

    const mockServerCapability = this.getMockServerCapability();
    if (mockServerCapability) {
      await mockServerCapability.start();
    }

    const contractSeedingCapability = this.getContractSeedingCapability();
    if (contractSeedingCapability) {
      contractSeedingCapability.initialize();

      if (input.seedContracts?.length) {
        await contractSeedingCapability.deployContracts(input.seedContracts);
      }
    } else if (input.seedContracts?.length) {
      throw new Error(
        'seedContracts provided but ContractSeedingCapability is not available.',
      );
    }

    const launchOptions: LauncherLaunchOptions = {
      stateMode,
      slowMo: input.slowMo ?? 0,
      extensionPath,
    };

    const launcher = await launchMetaMask(launchOptions);
    const extensionId = launcher.getExtensionId();
    const stateSnapshot = this.getStateSnapshotCapability();
    if (!stateSnapshot) {
      throw new Error('StateSnapshotCapability is not available.');
    }

    const chainId = this.workflowContext?.config?.defaultChainId ?? 1337;
    const extensionState = await stateSnapshot.getState(launcher.getPage(), {
      extensionId,
      chainId,
    });
    const startedAt = new Date().toISOString();

    this.activeSession = {
      state: {
        sessionId,
        extensionId,
        startedAt,
        ports: {
          anvil: input.ports?.anvil ?? DEFAULT_ANVIL_PORT,
          fixtureServer:
            input.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT,
        },
        stateMode,
      },
      launcher,
    };

    this.activePage = launcher.getPage();

    const metadata: SessionMetadata = {
      schemaVersion: 1,
      sessionId,
      createdAt: startedAt,
      goal: input.goal,
      flowTags: input.flowTags ?? [],
      tags: input.tags ?? [],
      build: {
        buildType: 'build:test',
        extensionPathResolved: input.extensionPath,
      },
      launch: {
        stateMode,
        fixturePreset: input.fixturePreset ?? null,
        extensionPath: input.extensionPath,
        ports: {
          anvil: input.ports?.anvil ?? DEFAULT_ANVIL_PORT,
          fixtureServer:
            input.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT,
        },
      },
    };

    await knowledgeStore.writeSessionMetadata(metadata);
    this.sessionMetadata = metadata;

    return {
      sessionId,
      extensionId,
      state: extensionState,
    };
  }

  async cleanup(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    await this.activeSession.launcher.cleanup();

    const fixtureCapability = this.getFixtureCapability();
    if (fixtureCapability) {
      await fixtureCapability.stop();
    }

    const mockServerCapability = this.getMockServerCapability();
    if (mockServerCapability) {
      await mockServerCapability.stop();
    }

    const chainCapability = this.getChainCapability();
    if (chainCapability) {
      await chainCapability.stop();
    }

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

  async screenshot(
    options: SessionScreenshotOptions,
  ): Promise<ScreenshotResult> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }

    return this.activeSession.launcher.screenshot({
      ...options,
      page: this.getPage(),
    });
  }
}

export const metaMaskSessionManager = new MetaMaskSessionManager();
