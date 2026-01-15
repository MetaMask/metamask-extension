import type { Page, BrowserContext } from '@playwright/test';
import {
  MetaMaskExtensionLauncher,
  launchMetaMask,
  FixturePresets,
} from '../index';
import type { FixtureData, LaunchOptions, ExtensionState } from '../types';
import {
  type SessionState,
  type LaunchInput,
  type SessionMetadata,
  ErrorCodes,
  generateSessionId,
} from './types';
import { knowledgeStore } from './knowledge-store';

const DEFAULT_ANVIL_PORT = 8545;
const DEFAULT_FIXTURE_SERVER_PORT = 12345;

export class SessionManager {
  private activeSession: {
    state: SessionState;
    launcher: MetaMaskExtensionLauncher;
  } | null = null;

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

  getLauncher(): MetaMaskExtensionLauncher | undefined {
    return this.activeSession?.launcher;
  }

  getPage(): Page {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activeSession.launcher.getPage();
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
    this.clearRefMap();
    return true;
  }

  async navigateToHome(): Promise<void> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    await this.activeSession.launcher.navigateToHome();
  }

  async navigateToSettings(): Promise<void> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    await this.activeSession.launcher.navigateToSettings();
  }

  async navigateToUrl(url: string): Promise<void> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    const page = this.activeSession.launcher.getPage();
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
  }

  async waitForNotificationPage(timeoutMs: number): Promise<Page> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activeSession.launcher.waitForNotificationPage(timeoutMs);
  }

  async screenshot(options: {
    name: string;
    fullPage?: boolean;
    selector?: string;
  }): Promise<{ path: string; base64: string; width: number; height: number }> {
    if (!this.activeSession) {
      throw new Error(ErrorCodes.MM_NO_ACTIVE_SESSION);
    }
    return this.activeSession.launcher.screenshot(options);
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
