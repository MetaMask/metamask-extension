import { randomBytes } from 'node:crypto';

const CANARY_SRP_PREFIX = 'CANARY-NOT-A-REAL-SRP-';
const PASSWORD_RANDOM_BYTES = 18;

type OnboardingPayload = {
  password: string;
  encodedSeedPhrase: number[];
};

type BackgroundPort = {
  postMessage: (message: unknown) => void;
  disconnect: () => void;
  onMessage: {
    addListener: (listener: (message: unknown) => void) => void;
  };
  onDisconnect: {
    addListener: (listener: () => void) => void;
  };
};

export type SelfOnboardingPage = {
  evaluate: (
    pageFunction: (payload: OnboardingPayload) => Promise<void>,
    payload: OnboardingPayload,
  ) => Promise<void>;
};

/**
 * Normalizes a secret recovery phrase to single-spaced words.
 *
 * @param phrase - The phrase supplied by the caller.
 * @returns The normalized phrase.
 */
export function normalizeSecretRecoveryPhrase(phrase: string): string {
  const words = phrase
    .trim()
    .split(/\s+/u)
    .filter((word) => word.length > 0);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('secret recovery phrase must be 12 or 24 words');
  }
  if (phrase.trim().startsWith(CANARY_SRP_PREFIX)) {
    throw new Error('marker strings cannot onboard MetaMask');
  }
  return words.join(' ');
}

/**
 * Encodes a secret recovery phrase as the UTF-8 byte list the background
 * vault API expects.
 *
 * @param phrase - A normalized secret recovery phrase.
 * @returns UTF-8 code units.
 */
export function encodeSecretRecoveryPhrase(phrase: string): number[] {
  return Array.from(Buffer.from(phrase, 'utf8'));
}

/**
 * Runs inside the extension page. Opens a trusted UI port, waits until the
 * background controller stream is live, restores the vault, then marks
 * onboarding complete. Errors name the background step only, so a thrown
 * message cannot carry the phrase or password.
 *
 * `page.evaluate` serializes only this function's source, so it must not
 * reference anything defined outside its body. It must also not declare named
 * functions: the `mm` daemon runs under tsx, which wraps them in an `__name`
 * helper that does not exist in the page.
 *
 * @param payload - The vault password and the encoded phrase.
 */
export async function completeOnboardingInPage(
  payload: OnboardingPayload,
): Promise<void> {
  const STEP_TIMEOUT_MS = 60_000;
  const UI_SYNC_KEY = 'START_UI_SYNC';

  const runtime = (
    globalThis as unknown as {
      chrome?: {
        runtime?: { connect?: (info: { name: string }) => BackgroundPort };
      };
    }
  ).chrome?.runtime;
  if (!runtime?.connect) {
    throw new Error(
      'chrome.runtime is unavailable; use a test or development build',
    );
  }

  const port = runtime.connect({ name: 'fullscreen' });
  const waiters = new Map<string | number, (failed: boolean) => void>();
  const connection = { open: true };

  port.onMessage.addListener((message: unknown) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('name' in message) ||
      message.name !== 'controller' ||
      !('data' in message) ||
      typeof message.data !== 'object' ||
      message.data === null
    ) {
      return;
    }
    const data = message.data as {
      id?: unknown;
      method?: unknown;
      error?: unknown;
    };
    let key: string | number | undefined;
    if (data.method === UI_SYNC_KEY) {
      key = UI_SYNC_KEY;
    } else if (typeof data.id === 'number') {
      key = data.id;
    }
    const waiter = key === undefined ? undefined : waiters.get(key);
    if (key === undefined || !waiter) {
      return;
    }
    waiters.delete(key);
    waiter(Boolean(data.error));
  });
  port.onDisconnect.addListener(() => {
    connection.open = false;
    for (const waiter of waiters.values()) {
      waiter(true);
    }
    waiters.clear();
  });

  const calls: { method: string; params: unknown[] }[] = [
    {
      method: 'createNewVaultAndRestore',
      params: [payload.password, payload.encodedSeedPhrase],
    },
    { method: 'setFirstTimeFlowType', params: ['import'] },
    { method: 'setSeedPhraseBackedUp', params: [true] },
    { method: 'setTermsOfUseLastAgreed', params: [Date.now()] },
    { method: 'completeOnboarding', params: [] },
    { method: 'setHasSeenOnboardingCompletionPage', params: [true] },
  ];
  // The background attaches its RPC handler before it pushes START_UI_SYNC;
  // requests sent earlier can be dropped while it is still initializing.
  const steps: { key: string | number; step: string; request?: unknown }[] = [
    { key: UI_SYNC_KEY, step: 'background connection' },
    ...calls.map(({ method, params }, index) => ({
      key: index + 1,
      step: method,
      request: {
        name: 'controller',
        data: { id: index + 1, jsonrpc: '2.0', method, params },
      },
    })),
  ];

  try {
    for (const { key, step, request } of steps) {
      await new Promise<void>((resolve, reject) => {
        if (!connection.open) {
          reject(new Error(step));
          return;
        }
        const timer = setTimeout(() => {
          waiters.delete(key);
          reject(new Error(step));
        }, STEP_TIMEOUT_MS);
        waiters.set(key, (failed) => {
          clearTimeout(timer);
          if (failed) {
            reject(new Error(step));
          } else {
            resolve();
          }
        });
        if (request !== undefined) {
          port.postMessage(request);
        }
      });
    }
  } finally {
    if (connection.open) {
      port.disconnect();
    }
  }
}

/**
 * Restores a vault from `phrase` and completes onboarding through the
 * extension background API. The vault password is generated here and dropped
 * before this function returns.
 *
 * @param page - The extension page that can reach `chrome.runtime`.
 * @param phrase - The secret recovery phrase to restore.
 */
export async function runSelfOnboarding(
  page: SelfOnboardingPage,
  phrase: string,
): Promise<void> {
  const normalized = normalizeSecretRecoveryPhrase(phrase);
  const payload: OnboardingPayload = {
    password: randomBytes(PASSWORD_RANDOM_BYTES).toString('base64'),
    encodedSeedPhrase: encodeSecretRecoveryPhrase(normalized),
  };
  try {
    await page.evaluate(completeOnboardingInPage, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message.length > 0 &&
      !message.includes(normalized) &&
      !message.includes(payload.password)
    ) {
      throw new Error(`self-onboarding failed: ${message}`);
    }
    throw new Error('self-onboarding failed');
  } finally {
    payload.password = '';
    payload.encodedSeedPhrase = [];
  }
}
