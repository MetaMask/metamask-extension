import { completeOnboardingInPage, runSelfOnboarding } from './self-onboarding';

const PHRASE =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

type RecordedMessage = {
  name?: string;
  data?: { method?: string; params?: unknown[] };
};

function installFakeChrome(failMethod?: string) {
  const messages: RecordedMessage[] = [];
  const listeners: ((message: unknown) => void)[] = [];
  const port = {
    postMessage: (message: RecordedMessage) => {
      messages.push(message);
      const method = message.data?.method;
      const response = {
        name: 'controller',
        data:
          method === failMethod
            ? {
                id: (message.data as { id?: number }).id,
                error: { message: PHRASE },
              }
            : { id: (message.data as { id?: number }).id, result: true },
      };
      for (const listener of listeners) {
        listener(response);
      }
    },
    onMessage: {
      addListener: (listener: (message: unknown) => void) => {
        listeners.push(listener);
      },
      removeListener: (listener: (message: unknown) => void) => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      },
    },
    onDisconnect: {
      addListener: () => undefined,
    },
  };
  (globalThis as { chrome?: unknown }).chrome = {
    runtime: {
      connect: () => port,
    },
  };
  return messages;
}

describe('runSelfOnboarding', () => {
  afterEach(() => {
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it('restores the vault and completes onboarding without returning the phrase', async () => {
    const messages = installFakeChrome();
    const page = {
      evaluate: async (
        fn: (payload: {
          password: string;
          encodedSeedPhrase: number[];
        }) => Promise<void>,
        payload: { password: string; encodedSeedPhrase: number[] },
      ) => fn(payload),
    };

    await runSelfOnboarding(page, `${PHRASE}\n`);

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
  });

  it('rejects a background failure without echoing the phrase', async () => {
    installFakeChrome('createNewVaultAndRestore');
    const page = {
      evaluate: async (
        fn: (payload: {
          password: string;
          encodedSeedPhrase: number[];
        }) => Promise<void>,
        payload: { password: string; encodedSeedPhrase: number[] },
      ) => fn(payload),
    };

    await expect(runSelfOnboarding(page, PHRASE)).rejects.toThrow(
      'self-onboarding failed: createNewVaultAndRestore',
    );
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
    ).rejects.toThrow('self-onboarding failed');
  });
});
