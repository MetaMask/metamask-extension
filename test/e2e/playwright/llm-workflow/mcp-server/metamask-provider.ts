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
import { validateExtensionBuilt } from '../validate-extension';

import { MetaMaskExtensionLauncher } from '..';
import {
  createMetaMaskE2EContext,
  createMetaMaskProdContext,
} from '../capabilities/factory';
import type {
  CreateMetaMaskContextOptions,
  CreateMetaMaskProdContextOptions,
} from '../capabilities/factory';
import type { LauncherLaunchOptions } from '../launcher-types';
import type { AnvilSeederWrapper } from '../anvil-seeder-wrapper';
import { MetaMaskFixtureCapability } from '../capabilities/fixture';
import { MetaMaskContractSeedingCapability } from '../capabilities/seeding';

const DEFAULT_ANVIL_PORT = 8545;
const DEFAULT_FIXTURE_SERVER_PORT = 12345;
const HEADLESS = true;

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

  getBuildCapability(): undefined {
    return undefined;
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

  setContext(
    context: 'e2e' | 'prod',
    options?: CreateMetaMaskContextOptions | CreateMetaMaskProdContextOptions,
  ): void {
    if (this.hasActiveSession()) {
      throw new Error(
        `${ErrorCodes.MM_CONTEXT_SWITCH_BLOCKED}: Cannot switch context while session is active. ` +
          `Current session: ${this.getSessionId()}. Call mm_cleanup first.`,
      );
    }

    const currentContext = this.getEnvironmentMode();
    const hasOptions = Boolean(options && Object.keys(options).length > 0);

    if (currentContext === context && !hasOptions) {
      return;
    }

    this.disposeCurrentCapabilities();

    const newContext =
      context === 'e2e'
        ? createMetaMaskE2EContext(options as CreateMetaMaskContextOptions)
        : createMetaMaskProdContext(
            options as CreateMetaMaskProdContextOptions,
          );

    this.setWorkflowContext(newContext as WorkflowContext);
  }

  private disposeCurrentCapabilities(): void {
    if (!this.workflowContext) {
      return;
    }

    const stops: Promise<void>[] = [];

    if (this.workflowContext.fixture) {
      stops.push(this.workflowContext.fixture.stop().catch(() => undefined));
    }
    if (this.workflowContext.mockServer) {
      stops.push(this.workflowContext.mockServer.stop().catch(() => undefined));
    }
    if (this.workflowContext.chain) {
      stops.push(this.workflowContext.chain.stop().catch(() => undefined));
    }

    if (stops.length > 0) {
      Promise.allSettled(stops).catch(() => undefined);
    }
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

    const contractSeeding = this.getMetaMaskContractSeedingCapability();
    if (!contractSeeding) {
      throw new Error('ContractSeedingCapability not available.');
    }

    return contractSeeding.getSeeder();
  }

  private getMetaMaskFixtureCapability():
    | MetaMaskFixtureCapability
    | undefined {
    const capability = this.getFixtureCapability();
    if (capability instanceof MetaMaskFixtureCapability) {
      return capability;
    }
    return undefined;
  }

  private getMetaMaskContractSeedingCapability():
    | MetaMaskContractSeedingCapability
    | undefined {
    const capability = this.getContractSeedingCapability();
    if (capability instanceof MetaMaskContractSeedingCapability) {
      return capability;
    }
    return undefined;
  }

  private isActivePageValid(): boolean {
    return Boolean(this.activePage && !this.activePage.isClosed());
  }

  private fallbackToExtensionPage(): Page {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    const extensionPage = this.activeSession.launcher.getPage();
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
      if (url.includes('notification.html')) {
        return 'notification';
      }
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

    // Resolve extension path — build is a manual prerequisite, validate only
    try {
      extensionPath = await validateExtensionBuilt(extensionPath);
    } catch (error) {
      throw new Error(
        `${ErrorCodes.MM_LAUNCH_FAILED}: ${(error as Error).message}`,
      );
    }

    const fixtureCapability = this.getMetaMaskFixtureCapability();
    const chainCapability = this.getChainCapability();
    const mockServerCapability = this.getMockServerCapability();
    const contractSeedingCapability = this.getContractSeedingCapability();

    if (!isProdMode && !fixtureCapability) {
      throw new Error(
        'FixtureCapability is not available.\n\n' +
          'Ensure FixtureCapability is registered in the workflow context.',
      );
    }

    if (input.seedContracts?.length && !contractSeedingCapability) {
      throw new Error(
        'seedContracts provided but ContractSeedingCapability is not available.',
      );
    }

    const startedCapabilities: {
      fixture?: boolean;
      chain?: boolean;
      mockServer?: boolean;
    } = {};

    let launcher: MetaMaskExtensionLauncher | undefined;

    try {
      if (!isProdMode && fixtureCapability) {
        const fixturePort = input.ports?.fixtureServer;
        if (fixturePort !== undefined && fixtureCapability.setPort) {
          fixtureCapability.setPort(fixturePort);
        }

        const fixtureState = fixtureCapability.resolveState({
          stateMode,
          fixturePreset: input.fixturePreset,
          fixture: input.fixture,
        });

        await fixtureCapability.start(fixtureState);
        startedCapabilities.fixture = true;
      }

      if (chainCapability) {
        const anvilPort = input.ports?.anvil ?? DEFAULT_ANVIL_PORT;
        if (chainCapability.setPort) {
          chainCapability.setPort(anvilPort);
        }
        await chainCapability.start();
        startedCapabilities.chain = true;
      }

      let proxyServer: string | undefined;
      if (mockServerCapability) {
        await mockServerCapability.start();
        startedCapabilities.mockServer = true;

        if (mockServerCapability.isRunning()) {
          proxyServer = `127.0.0.1:${mockServerCapability.getPort()}`;
        }
      }

      if (contractSeedingCapability) {
        contractSeedingCapability.initialize();

        if (input.seedContracts?.length) {
          await contractSeedingCapability.deployContracts(input.seedContracts);
        }
      }

      const launchOptions: LauncherLaunchOptions = {
        headless: HEADLESS,
        stateMode,
        slowMo: input.slowMo ?? 0,
        extensionPath,
        proxyServer,
      };

      launcher = new MetaMaskExtensionLauncher(launchOptions);
      await launcher.launch();
    } catch (error) {
      await this.rollbackStartedCapabilities(
        startedCapabilities,
        launcher,
        fixtureCapability,
        mockServerCapability,
        chainCapability,
      );
      throw error;
    }

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
    const resolvedAnvilPort = input.ports?.anvil ?? DEFAULT_ANVIL_PORT;
    const resolvedFixturePort =
      input.ports?.fixtureServer ?? DEFAULT_FIXTURE_SERVER_PORT;

    this.activeSession = {
      state: {
        sessionId,
        extensionId,
        startedAt,
        ports: {
          anvil: resolvedAnvilPort,
          fixtureServer: resolvedFixturePort,
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
      launch: {
        stateMode,
        fixturePreset: input.fixturePreset ?? null,
        extensionPath,
        ports: {
          anvil: resolvedAnvilPort,
          fixtureServer: resolvedFixturePort,
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

  private async rollbackStartedCapabilities(
    started: { fixture?: boolean; chain?: boolean; mockServer?: boolean },
    launcher: MetaMaskExtensionLauncher | undefined,
    fixtureCapability: FixtureCapability | undefined,
    mockServerCapability: MockServerCapability | undefined,
    chainCapability: ChainCapability | undefined,
  ): Promise<void> {
    const stops: Promise<void>[] = [];

    if (launcher) {
      stops.push(launcher.cleanup().catch(() => undefined));
    }
    if (started.mockServer && mockServerCapability) {
      stops.push(mockServerCapability.stop().catch(() => undefined));
    }
    if (started.fixture && fixtureCapability) {
      stops.push(fixtureCapability.stop().catch(() => undefined));
    }
    if (started.chain && chainCapability) {
      stops.push(chainCapability.stop().catch(() => undefined));
    }

    await Promise.allSettled(stops);
  }

  async cleanup(): Promise<boolean> {
    if (!this.activeSession) {
      return false;
    }

    const stops: Promise<void>[] = [
      this.activeSession.launcher.cleanup().catch((e) => {
        console.warn('Failed to cleanup launcher:', e);
      }),
    ];

    const fixtureCapability = this.getFixtureCapability();
    if (fixtureCapability) {
      stops.push(
        fixtureCapability.stop().catch((e) => {
          console.warn('Failed to stop fixture server:', e);
        }),
      );
    }

    const mockServerCapability = this.getMockServerCapability();
    if (mockServerCapability) {
      stops.push(
        mockServerCapability.stop().catch((e) => {
          console.warn('Failed to stop mock server:', e);
        }),
      );
    }

    const chainCapability = this.getChainCapability();
    if (chainCapability) {
      stops.push(
        chainCapability.stop().catch((e) => {
          console.warn('Failed to stop chain:', e);
        }),
      );
    }

    try {
      await Promise.allSettled(stops);
    } finally {
      this.activeSession = null;
      this.activePage = undefined;
      this.sessionMetadata = undefined;
      this.clearRefMap();
    }

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

    const notificationPath = HEADLESS ? 'sidepanel' : 'notification';

    const context = this.getContext();
    const { extensionId } = this.activeSession.state;
    const notificationUrl = `chrome-extension://${extensionId}/${notificationPath}.html`;

    const existingNotification = context
      .pages()
      .find((p) => p.url().includes(`${notificationPath}.html`));

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
    const page = await this.activeSession.launcher.waitForNotificationPage(
      HEADLESS,
      timeoutMs,
    );
    this.setActivePage(page);
    return page;
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
