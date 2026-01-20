import type { FixtureData } from '../types';
import { retryUntil } from './retry';

const FixtureServer = require('../../../fixtures/fixture-server');
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../../fixtures/default-fixture');
const FixtureBuilderClass = require('../../../fixtures/fixture-builder');

type FixtureServerServiceOptions = {
  port: number;
  stateMode: 'default' | 'onboarding' | 'custom';
  fixture: FixtureData | null;
  fetchWithTimeout: (
    url: string,
    options: RequestInit,
    timeoutMs?: number,
  ) => Promise<Response>;
  log: {
    info: (message: string) => void;
  };
};

export class FixtureServerService {
  private server: typeof FixtureServer | undefined;

  private readonly options: FixtureServerServiceOptions;

  constructor(options: FixtureServerServiceOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const { port, log } = this.options;

    log.info('Starting FixtureServer...');
    this.server = new FixtureServer({ port });
    await this.server.start();
    await this.waitForReady();

    const fixture = this.resolveFixture();
    this.server.loadJsonState(fixture, null);
    log.info(
      `FixtureServer running on port ${port} (mode: ${this.options.stateMode})`,
    );
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await this.server.stop();
    this.server = undefined;
  }

  getPort(): number {
    return this.options.port;
  }

  private resolveFixture(): FixtureData {
    if (this.options.fixture) {
      const fixture = this.options.fixture;
      if (!fixture.meta) {
        fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION };
      }
      return fixture;
    }

    if (this.options.stateMode === 'onboarding') {
      const builder = new FixtureBuilderClass({ onboarding: true });
      return builder.build();
    }

    const fixture = defaultFixture();
    fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION };
    return fixture;
  }

  private async waitForReady(maxAttempts = 10): Promise<void> {
    const { port, fetchWithTimeout } = this.options;

    const response = await retryUntil(
      () =>
        fetchWithTimeout(`http://localhost:${port}/state.json`, {}, 3000).catch(
          () => null,
        ),
      (result) => Boolean(result?.ok),
      { attempts: maxAttempts, delayMs: 500 },
    );

    if (response?.ok) {
      this.options.log.info('FixtureServer is ready');
      return;
    }

    throw new Error(
      `FixtureServer failed to respond after ${maxAttempts} attempts on port ${port}. ` +
        `To kill any orphan process: lsof -ti:${port} | xargs kill -9`,
    );
  }
}
