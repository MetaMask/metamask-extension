import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  completeOnboardingInPage,
  runSelfOnboarding,
  type SelfOnboardingPage,
} from './self-onboarding';

const PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

type RecordedMessage = {
  name?: string;
  data?: { id?: number; method?: string; params?: unknown[] };
};

function installFakeChrome(failMethod?: string) {
  const events: string[] = [];
  const messages: RecordedMessage[] = [];
  const listeners: ((message: unknown) => void)[] = [];
  const emit = (message: unknown) => {
    for (const listener of [...listeners]) {
      listener(message);
    }
  };
  const port = {
    postMessage: (message: RecordedMessage) => {
      events.push(`request:${message.data?.method}`);
      messages.push(message);
      const id = message.data?.id;
      emit({
        name: 'controller',
        data:
          message.data?.method === failMethod
            ? { id, error: { message: PHRASE } }
            : { id, result: true },
      });
    },
    disconnect: jest.fn(),
    onMessage: {
      addListener: (listener: (message: unknown) => void) => {
        listeners.push(listener);
      },
    },
    onDisconnect: {
      addListener: () => undefined,
    },
  };
  (globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      connect: () => {
        setTimeout(() => {
          events.push('sync');
          emit({
            name: 'controller',
            data: { jsonrpc: '2.0', method: 'START_UI_SYNC', params: [{}] },
          });
        }, 0);
        return port;
      },
    },
  };
  return { events, messages, port };
}

const page: SelfOnboardingPage = {
  evaluate: async (fn, payload) => fn(payload),
};

describe('runSelfOnboarding', () => {
  afterEach(() => {
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it('restores the vault and completes onboarding without returning the phrase', async () => {
    const { events, messages, port } = installFakeChrome();

    await runSelfOnboarding(page, `${PHRASE}\n`);

    expect(events[0]).toBe('sync');
    expect(messages.map((message) => message.data?.method)).toStrictEqual([
      'createNewVaultAndRestore',
      'setFirstTimeFlowType',
      'setSeedPhraseBackedUp',
      'setTermsOfUseLastAgreed',
      'completeOnboarding',
      'setHasSeenOnboardingCompletionPage',
    ]);
    const restore = messages[0]?.data?.params;
    expect(restore?.[1]).toStrictEqual(Array.from(Buffer.from(PHRASE, 'utf8')));
    expect(typeof restore?.[0]).toBe('string');
    expect(restore?.[0]).not.toBe(PHRASE);
    expect(messages[1]?.data?.params).toStrictEqual(['import']);
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });

  it('rejects a background failure without echoing the phrase', async () => {
    const { port } = installFakeChrome('createNewVaultAndRestore');

    await expect(runSelfOnboarding(page, PHRASE)).rejects.toThrow(
      'self-onboarding failed: createNewVaultAndRestore',
    );
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });

  it('refuses a phrase that is not 12 or 24 words before calling the page', async () => {
    const evaluate = jest.fn();
    await expect(
      runSelfOnboarding({ evaluate }, 'one two three'),
    ).rejects.toThrow(/12 or 24 words/u);
    expect(evaluate).not.toHaveBeenCalled();
  });
});

describe('completeOnboardingInPage', () => {
  it('fails when the extension runtime is unavailable', async () => {
    delete (globalThis as { chrome?: unknown }).chrome;
    await expect(
      completeOnboardingInPage({ password: 'pw', encodedSeedPhrase: [1] }),
    ).rejects.toThrow('chrome.runtime is unavailable');
  });

  it('stays free of helpers tsx injects, since only its source reaches the page', () => {
    // The esbuild that tsx uses is the transform that matters for the daemon.
    const { transformSync } = jest.requireActual<typeof import('esbuild')>(
      require.resolve('esbuild', {
        paths: [path.dirname(require.resolve('tsx/package.json'))],
      }),
    );
    const { code } = transformSync(
      readFileSync(path.join(__dirname, 'self-onboarding.ts'), 'utf8'),
      { loader: 'ts', keepNames: true },
    );
    const start = code.indexOf('async function completeOnboardingInPage(');
    const end = code.indexOf('__name(completeOnboardingInPage,');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(code.slice(start, end)).not.toContain('__name(');
  });
});
