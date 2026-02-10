import { fetchWithTimeout, retryUntil } from '@metamask/client-mcp-core';
import type { FixtureCapability, WalletState } from '@metamask/client-mcp-core';

import FixtureServerClass from '../../../fixtures/fixture-server';
import { FIXTURE_STATE_METADATA_VERSION } from '../../../fixtures/default-fixture';
import {
  FixturePresets,
  buildDefaultFixture,
  buildOnboardingFixture,
} from '../fixture-helper';
import type { FixtureData } from '../launcher-types';

export type MetaMaskFixtureCapabilityOptions = {
  port?: number;
  defaultPassword?: string;
  fetchWithTimeout?: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
};

export class MetaMaskFixtureCapability implements FixtureCapability {
  private server: InstanceType<typeof FixtureServerClass> | undefined;

  private readonly port: number;

  private readonly fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;

  constructor(options: MetaMaskFixtureCapabilityOptions = {}) {
    this.port = options.port ?? 12345;
    this.fetchWithTimeout = options.fetchWithTimeout ?? fetchWithTimeout;
  }

  async start(state: WalletState): Promise<void> {
    console.log('Starting FixtureServer...');

    const server = new FixtureServerClass({ port: this.port });
    this.server = server;

    await server.start();
    await this.waitForReady();

    const fixtureWithMeta = {
      ...state,
      meta: state.meta ?? { version: FIXTURE_STATE_METADATA_VERSION },
    };
    server.loadJsonState(fixtureWithMeta, {
      getContractAddress: (name: string) => {
        throw new Error(
          `Fixture references contract "${name}" via __FIXTURE_SUBSTITUTION__CONTRACT, ` +
            `but no contract registry is available. Deploy the contract via seedContracts or ` +
            `remove the substitution from the fixture.`,
        );
      },
    });
    console.log(`FixtureServer running on port ${this.port}`);
  }

  async stop(): Promise<void> {
    const { server } = this;
    if (!server) {
      return;
    }

    await server.stop();
    this.server = undefined;
  }

  getDefaultState(): WalletState {
    return buildDefaultFixture() as unknown as WalletState;
  }

  getOnboardingState(): WalletState {
    return buildOnboardingFixture() as unknown as WalletState;
  }

  resolvePreset(presetName: string): WalletState {
    const presetFn = FixturePresets[presetName as keyof typeof FixturePresets];
    if (!presetFn) {
      const availablePresets = Object.keys(FixturePresets).join(', ');
      throw new Error(
        `Unknown fixture preset: ${presetName}. ` +
          `Available presets: ${availablePresets}`,
      );
    }

    const fixtureData: FixtureData = presetFn();
    return fixtureData as unknown as WalletState;
  }

  resolveState(options: {
    stateMode: 'default' | 'onboarding' | 'custom';
    fixturePreset?: string;
    fixture?: Record<string, unknown>;
  }): WalletState {
    const { stateMode, fixturePreset, fixture } = options;

    if (stateMode === 'custom') {
      if (fixturePreset) {
        return this.resolvePreset(fixturePreset);
      }
      if (fixture) {
        const fixtureData = { data: fixture } as FixtureData;
        if (!fixtureData.meta) {
          fixtureData.meta = { version: FIXTURE_STATE_METADATA_VERSION };
        }
        return fixtureData as unknown as WalletState;
      }
      throw new Error(
        "stateMode 'custom' requires either 'fixturePreset' or 'fixture' to be provided.",
      );
    }

    if (stateMode === 'onboarding') {
      return this.getOnboardingState();
    }

    return this.getDefaultState();
  }

  private async waitForReady(maxAttempts = 10): Promise<void> {
    const response = await retryUntil(
      () =>
        this.fetchWithTimeout(
          `http://localhost:${this.port}/state.json`,
          {},
          3000,
        ).catch(() => null),
      (result) => Boolean(result?.ok),
      { attempts: maxAttempts, delayMs: 500 },
    );

    if (response?.ok) {
      console.log('FixtureServer is ready');
      return;
    }

    throw new Error(
      `FixtureServer failed to respond after ${maxAttempts} attempts on port ${this.port}. ` +
        `To kill any orphan process: lsof -ti:${this.port} | xargs kill -9`,
    );
  }
}
